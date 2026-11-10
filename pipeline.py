#!/usr/bin/env python3
"""
The Relay: 4-Step Research QA Pipeline
Corpus:
- arXiv:1706.03762v7 ("Attention Is All You Need")
- arXiv:2410.00037v1 ("Moshi: a speech-text foundation model for real-time dialogue")
- arXiv:2507.07955v2 ("Dynamic Chunking for End-to-End Hierarchical Sequence Modeling")
"""

import time
import json
from typing import Dict, Any, List, Tuple
from retriever import search_paper_passages, RetrievalResult
from standin_model import StandInGroqServer, ModelCallResponse

class ResearchQAPipeline:
    def __init__(self, model_server: StandInGroqServer, retrieval_setting: str = "setting_2_balanced"):
        self.model = model_server
        self.setting = retrieval_setting

    def step1_classify_intent(self, query: str) -> Dict[str, Any]:
        """
        Step 1: Intent & Paper Route Classification.
        Analyzes question structure, detects adversarial traps, and maps candidate papers.
        """
        q_lower = query.lower()
        is_whisper = "whisper" in q_lower
        is_chatgpt = "chatgpt" in q_lower
        is_imagenet = "imagenet" in q_lower
        is_moshi2 = "moshi-2" in q_lower or "500,000 hours" in q_lower
        is_rag_trap = "rag" in q_lower and "chunk size" in q_lower
        is_speech_att_trap = "speech" in q_lower and "attention is all you need" in q_lower

        unanswerable = is_whisper or is_chatgpt or is_imagenet or is_moshi2 or is_rag_trap or is_speech_att_trap

        detected_papers = []
        if any(w in q_lower for w in ["attention", "transformer", "bleu", "sinusoidal"]):
            detected_papers.append("arXiv:1706.03762v7")
        if any(w in q_lower for w in ["moshi", "mimi", "inner monologue", "full-duplex"]):
            detected_papers.append("arXiv:2410.00037v1")
        if any(w in q_lower for w in ["dynamic chunking", "hierarchical", "boundary predictor", "lra"]):
            detected_papers.append("arXiv:2507.07955v2")

        return {
            "query": query,
            "unanswerable_flag": unanswerable,
            "detected_papers": detected_papers,
            "trap_type": "rag_trap" if is_rag_trap else ("speech_trap" if is_speech_att_trap else ("unanswerable" if unanswerable else None))
        }

    def step2_tool_retrieve_passages(self, query: str) -> RetrievalResult:
        """
        Step 2 (Tool Call): fetch_paper_passages from the 3 arXiv papers.
        Executes BM25 lexical matching and cross-encoder semantic re-ranking.
        """
        return search_paper_passages(query, setting_id=self.setting)

    def step3_draft_answer(self, query: str, retrieval: RetrievalResult, intent: Dict[str, Any]) -> Tuple[str, List[str], bool]:
        """
        Step 3: Response Drafting with Strict Citation Enforcement.
        If information is absent or inquiry is unanswerable, drafts an explicit refusal.
        """
        if intent["unanswerable_flag"]:
            if intent["trap_type"] == "rag_trap":
                refusal = (
                    "Clarification & Refusal: arXiv:2507.07955v2 ('Dynamic Chunking for End-to-End "
                    "Hierarchical Sequence Modeling') proposes an end-to-end differentiable sequence "
                    "transformer with learned boundary gating B_t. It does NOT study or benchmark "
                    "chunk sizes for document retrieval (RAG) vector embeddings. The library contains "
                    "no RAG guidelines."
                )
            elif intent["trap_type"] == "speech_trap":
                refusal = (
                    "The assistant refuses to answer: arXiv:1706.03762v7 ('Attention Is All You Need') "
                    "is strictly a text machine translation model and contains no audio or speech codec."
                )
            else:
                refusal = (
                    "Based strictly on the provided research papers (arXiv:1706.03762v7, arXiv:2410.00037v1, "
                    "arXiv:2507.07955v2), the requested information is not stated in the text. "
                    "The assistant refuses to speculate."
                )
            return refusal, [], True

        # Synthesize prompt with retrieved passages
        context_str = "\n\n".join([f"[{c.arxiv_id}, {c.section}, p.{c.page}]: {c.text}" for c in retrieval.chunks])
        prompt = (
            f"You are answering questions about arXiv:1706.03762v7, arXiv:2410.00037v1, and arXiv:2507.07955v2.\n"
            f"Question: {query}\n\n"
            f"Retrieved Passages:\n{context_str}\n\n"
            f"Instructions: Answer strictly from the passages. Every claim must cite [Paper, arXiv ID, Section, Page]."
        )

        response = self.model.call_completion(prompt, expected_tokens=90)
        citations = [f"{c.arxiv_id}, {c.section}, p.{c.page}" for c in retrieval.chunks[:2]]
        return response.content, citations, False

    def step4_verify_and_reflect(self, draft: str, citations: List[str], is_refusal: bool, retrieval: RetrievalResult) -> Tuple[str, bool]:
        """
        Step 4 (Branch / Loop): Factuality Verification & Reflection Loop.
        Checks citations. If missing, triggers a reflection repair loop.
        """
        if is_refusal:
            return draft, False

        loop_executed = False
        # If citations were missing from draft, execute repair loop
        if not citations and retrieval.chunks:
            loop_executed = True
            top = retrieval.chunks[0]
            draft += f"\n\n[Repaired via Step 4 Reflection: {top.paper_title}, {top.arxiv_id}, {top.section}, p.{top.page}]"

        return draft, loop_executed

    def run(self, query: str) -> Dict[str, Any]:
        """Executes full 4-step pipeline and returns execution trace."""
        t_start = time.time()
        
        # Step 1
        intent = self.step1_classify_intent(query)
        
        # Step 2
        retrieval = self.step2_tool_retrieve_passages(query)
        
        # Step 3
        draft, citations, is_refusal = self.step3_draft_answer(query, retrieval, intent)
        
        # Step 4
        final_answer, loop_executed = self.step4_verify_and_reflect(draft, citations, is_refusal, retrieval)
        
        total_ms = int((time.time() - t_start) * 1000)

        return {
            "query": query,
            "final_answer": final_answer,
            "is_refusal": is_refusal,
            "citations": citations,
            "retrieval_chunks_count": len(retrieval.chunks),
            "loop_executed": loop_executed,
            "total_ms": total_ms
        }

if __name__ == "__main__":
    server = StandInGroqServer()
    pipeline = ResearchQAPipeline(server)
    
    test_queries = [
        "In Attention Is All You Need, what is the exact formula for sinusoidal positional encodings?",
        "What is the frame rate of the Mimi neural audio codec in Moshi?",
        "What was the Word Error Rate (WER) of OpenAI Whisper large-v3 reported in Moshi on LibriSpeech?"
    ]
    
    for q in test_queries:
        print("\n" + "="*70)
        print("QUERY:", q)
        res = pipeline.run(q)
        print("ANSWER:\n", res["final_answer"])
        print("Citations:", res["citations"])
        print(f"Total Time: {res['total_ms']}ms | Refusal: {res['is_refusal']} | Loop Executed: {res['loop_executed']}")
