export type AnswerGrade = 'correct' | 'wrong' | 'refused_correctly' | 'refused_wrongly';

export interface TestQuestion {
  id: string;
  category: 'grounded' | 'unanswerable_refusal' | 'cross_paper' | 'retriever_trap';
  question: string;
  targetPaperId?: string;
  expectedGrade: AnswerGrade;
  expectedCitations: string[];
  groundTruthSummary: string;
  trapExplanation?: string;
}

export const TEST_QUESTIONS: TestQuestion[] = [
  // --- Category 1: Grounded Questions (Directly in papers, citations required) ---
  {
    id: 'q-01',
    category: 'grounded',
    targetPaperId: 'attention',
    question: 'In "Attention Is All You Need", what is the exact formula for sinusoidal positional encodings, and what dimension d_model was used?',
    expectedGrade: 'correct',
    expectedCitations: ['arXiv:1706.03762v7, Section 3.1 & 3.5, pp. 3-5'],
    groundTruthSummary: 'PE_(pos, 2i) = sin(pos / 10000^(2i/d_model)) and PE_(pos, 2i+1) = cos(pos / 10000^(2i/d_model)), where d_model = 512 for base model and embeddings.'
  },
  {
    id: 'q-02',
    category: 'grounded',
    targetPaperId: 'attention',
    question: 'How many layers are in the Transformer encoder and decoder stacks, and what BLEU score did Transformer (big) reach on WMT 2014 English-to-German?',
    expectedGrade: 'correct',
    expectedCitations: ['arXiv:1706.03762v7, Section 3.1 & 6.1, pp. 3, 8'],
    groundTruthSummary: 'Both encoder and decoder have N = 6 identical layers. On WMT 2014 En-De, Transformer (big) achieved a BLEU score of 28.4.'
  },
  {
    id: 'q-03',
    category: 'grounded',
    targetPaperId: 'moshi',
    question: 'What is the frame rate of the Mimi neural audio codec in Moshi, and how many codebooks does its RVQ use?',
    expectedGrade: 'correct',
    expectedCitations: ['arXiv:2410.00037v1, Section 2.1, p. 3'],
    groundTruthSummary: 'Mimi operates at a frame rate of 12.5 Hz (80 ms per frame) on 24 kHz audio, using residual vector quantization (RVQ) with 8 codebooks for speech tokens.'
  },
  {
    id: 'q-04',
    category: 'grounded',
    targetPaperId: 'moshi',
    question: 'Explain the "Inner Monologue" mechanism in Moshi and why it is used.',
    expectedGrade: 'correct',
    expectedCitations: ['arXiv:2410.00037v1, Section 3.3, p. 6'],
    groundTruthSummary: 'Before generating speech audio tokens, Moshi autoregressively predicts the corresponding text tokens ahead of time. This provides semantic anchoring, eliminating phonetic hallucinations and improving factual consistency.'
  },
  {
    id: 'q-05',
    category: 'grounded',
    targetPaperId: 'dynamic_chunking',
    question: 'How is the boundary predictor B_t parameterized in Dynamic Chunking, and what threshold tau triggers a chunk boundary?',
    expectedGrade: 'correct',
    expectedCitations: ['arXiv:2507.07955v2, Section 2, p. 3'],
    groundTruthSummary: 'B_t is a lightweight two-layer MLP with sigmoid gating: B_t = Sigmoid(W_2 * GELU(W_1 * h_t)), trained with a straight-through Gumbel estimator. A boundary is instantiated when B_t > tau = 0.5.'
  },
  {
    id: 'q-06',
    category: 'grounded',
    targetPaperId: 'dynamic_chunking',
    question: 'What computational complexity does Dynamic Chunking achieve compared to standard Transformer attention?',
    expectedGrade: 'correct',
    expectedCitations: ['arXiv:2507.07955v2, Section 3.1, p. 4'],
    groundTruthSummary: 'It reduces standard quadratic O(N^2) complexity to O(N * C_avg + (N/C_avg)^2), where C_avg is the average learned dynamic chunk size (typically 64-128 tokens).'
  },

  // --- Category 2: Cross-Paper Comparative Questions ---
  {
    id: 'q-07',
    category: 'cross_paper',
    question: 'Compare the attention layer dimensions and head counts between the base Transformer in "Attention Is All You Need" and the intra-chunk attention in Dynamic Chunking.',
    expectedGrade: 'correct',
    expectedCitations: ['arXiv:1706.03762v7, Section 3.2.2, p. 4', 'arXiv:2507.07955v2, Section 3.1, p. 4'],
    groundTruthSummary: 'Base Transformer uses h=8 heads, d_k=d_v=64, d_model=512 for full sequence dense attention. Dynamic Chunking restricts dense intra-chunk self-attention strictly within bounded variable-length chunks of max size C_max=512.'
  },
  {
    id: 'q-08',
    category: 'cross_paper',
    question: 'How does Moshi achieve real-time speech dialogue compared to the full-sequence transduction paradigm proposed in "Attention Is All You Need"?',
    expectedGrade: 'correct',
    expectedCitations: ['arXiv:1706.03762v7, Section 1, p. 2', 'arXiv:2410.00037v1, Section 3.1 & 4.1, pp. 5, 7'],
    groundTruthSummary: 'Attention Is All You Need requires complete sentence/sequence encoding before full autoregressive translation. Moshi is streaming and full-duplex with 12.5 Hz Mimi frames, achieving ~200ms end-to-end conversational turn latency.'
  },

  // --- Category 3: Unanswerable Questions (Strict refusal test) ---
  {
    id: 'q-09',
    category: 'unanswerable_refusal',
    question: 'What was the Word Error Rate (WER) of OpenAI Whisper large-v3 reported in the Moshi paper on the LibriSpeech test-clean benchmark?',
    expectedGrade: 'refused_correctly',
    expectedCitations: [],
    groundTruthSummary: 'The Moshi paper (arXiv:2410.00037v1) does not benchmark or report Word Error Rate for OpenAI Whisper large-v3 on LibriSpeech. The assistant must refuse to answer.'
  },
  {
    id: 'q-10',
    category: 'unanswerable_refusal',
    question: 'In "Attention Is All You Need", what system prompt template did the authors specify for guiding ChatGPT conversational alignment?',
    expectedGrade: 'refused_correctly',
    expectedCitations: [],
    groundTruthSummary: 'The paper was published in 2017 (arXiv:1706.03762v7), years before ChatGPT was developed. It contains no prompts or conversational alignment templates. Must refuse.'
  },
  {
    id: 'q-11',
    category: 'unanswerable_refusal',
    question: 'According to the Dynamic Chunking paper, what learning rate and weight decay were used when fine-tuning the model on ImageNet-1K classification?',
    expectedGrade: 'refused_correctly',
    expectedCitations: [],
    groundTruthSummary: 'The Dynamic Chunking paper (arXiv:2507.07955v2) evaluates on Long Range Arena (LRA), ListOps, and text/speech sequences; it never trains or fine-tunes on ImageNet-1K. Must refuse.'
  },
  {
    id: 'q-12',
    category: 'unanswerable_refusal',
    question: 'How many NVIDIA H100 GPUs were used to train Moshi-2 on 500,000 hours of conversational podcasts?',
    expectedGrade: 'refused_correctly',
    expectedCitations: [],
    groundTruthSummary: 'The paper covers Moshi v1 trained with Helium 7B and Mimi on A100 GPUs. "Moshi-2" and 500k hours of podcasts do not appear in the paper. Must refuse.'
  },

  // --- Category 4: Retriever Traps & Tricky Misleading Queries ---
  {
    id: 'q-13',
    category: 'retriever_trap',
    targetPaperId: 'dynamic_chunking',
    question: 'What is the optimal chunk size in words recommended for RAG vector retrieval in the Dynamic Chunking paper?',
    expectedGrade: 'refused_correctly',
    expectedCitations: [],
    groundTruthSummary: 'TRAP: Dynamic Chunking is an architectural modeling paper for sequence representations (learned gating boundaries B_t for sequence transformers), NOT a document retrieval / RAG chunking paper. It does not recommend RAG vector chunk sizes.'
  },
  {
    id: 'q-14',
    category: 'retriever_trap',
    targetPaperId: 'moshi',
    question: 'Does Moshi use self-attention or cross-attention to align its text stream to speech in the decoder?',
    expectedGrade: 'correct',
    expectedCitations: ['arXiv:2410.00037v1, Section 3.1 & 3.3, pp. 5-6'],
    groundTruthSummary: 'TRAP: Moshi structures text and audio into parallel synchronized streams on a unified 12.5 Hz grid, using joint causal autoregressive modeling with Inner Monologue text conditioning, rather than an encoder-decoder cross-attention layer.'
  },
  {
    id: 'q-15',
    category: 'retriever_trap',
    targetPaperId: 'attention',
    question: 'In "Attention Is All You Need", how does the speech codec tokenize continuous audio into discrete acoustic tokens?',
    expectedGrade: 'refused_correctly',
    expectedCitations: [],
    groundTruthSummary: 'TRAP: "Attention Is All You Need" is solely a text machine translation model using byte-pair encoding (BPE) subwords. It has no audio or speech codec. (Naive search matches "tokens" and "attention"). Must refuse.'
  },
  {
    id: 'q-16',
    category: 'grounded',
    targetPaperId: 'dynamic_chunking',
    question: 'What entropy regularization loss L_chunk and target density parameter were chosen in Dynamic Chunking to prevent degenerate chunking?',
    expectedGrade: 'correct',
    expectedCitations: ['arXiv:2507.07955v2, Section 5, p. 7'],
    groundTruthSummary: 'L_chunk = lambda_c * ((1/T sum(B_t) - target_density)^2), with target_density = 0.015 (average chunk ~66 tokens) and lambda_c = 0.05.'
  },
  {
    id: 'q-17',
    category: 'grounded',
    targetPaperId: 'moshi',
    question: 'What text LLM backbone is Moshi built upon, and what is its parameter size?',
    expectedGrade: 'correct',
    expectedCitations: ['arXiv:2410.00037v1, Section 4.1, p. 7'],
    groundTruthSummary: 'Moshi is built upon the Helium text backbone, which has 7 billion (7B) parameters.'
  },
  {
    id: 'q-18',
    category: 'grounded',
    targetPaperId: 'attention',
    question: 'What warmup step count and label smoothing value were used in training the original Transformer in "Attention Is All You Need"?',
    expectedGrade: 'correct',
    expectedCitations: ['arXiv:1706.03762v7, Section 5.3, p. 7'],
    groundTruthSummary: 'Warmup steps = 4000 steps with learning rate schedule lrate = d_model^(-0.5) * min(step^(-0.5), step * warmup^(-1.5)), and label smoothing epsilon_ls = 0.1.'
  }
];
