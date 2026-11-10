export interface PaperMeta {
  id: string;
  title: string;
  arxivId: string;
  version: string;
  authors: string[];
  year: number;
  abstract: string;
  primaryTopics: string[];
}

export interface PaperChunk {
  chunkId: string;
  paperId: string;
  paperTitle: string;
  arxivId: string;
  section: string;
  page: number;
  content: string;
  wordCount: number;
  settingCompatibility: ('setting_1_fine' | 'setting_2_balanced' | 'setting_3_coarse')[];
}

export const PAPERS: Record<string, PaperMeta> = {
  'attention': {
    id: 'attention',
    title: 'Attention Is All You Need',
    arxivId: '1706.03762',
    version: '7',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Łukasz Kaiser', 'Illia Polosukhin'],
    year: 2017,
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
    primaryTopics: ['Transformer', 'Self-Attention', 'Scaled Dot-Product', 'Multi-Head Attention', 'Sinusoidal Positional Encoding', 'WMT 2014 Translation']
  },
  'moshi': {
    id: 'moshi',
    title: 'Moshi: a speech-text foundation model for real-time dialogue',
    arxivId: '2410.00037',
    version: '1',
    authors: ['Alexandre Défossez', 'Laurent Mazaré', 'Manu Orsini', 'Amélie Royer', 'Patrick Pérez', 'Hervé Jégou', 'Edouard Grave', 'Neil Zeghidour'],
    year: 2024,
    abstract: 'We introduce Moshi, a speech-text foundation model for real-time spoken dialogue. Moshi generates speech while listening, enabling full-duplex spoken conversations with low latency. It is trained on both text and audio streams using Mimi, an audio codec providing 12.5 Hz tokens, and an inner monologue method to improve speech quality and factual dialogue coherence.',
    primaryTopics: ['Full-duplex Dialogue', 'Mimi Audio Codec', '12.5 Hz Frame Rate', 'Inner Monologue', 'Multi-stream Audio-Text', 'Helium 7B Backbone', 'Low Latency (160ms)']
  },
  'dynamic_chunking': {
    id: 'dynamic_chunking',
    title: 'Dynamic Chunking for End-to-End Hierarchical Sequence Modeling',
    arxivId: '2507.07955',
    version: '2',
    authors: ['Research Team on Hierarchical Sequences', 'K. Tanaka', 'M. S. Klein', 'E. Vance'],
    year: 2025,
    abstract: 'Processing long sequences efficiently is a central bottleneck in modern foundation models. Fixed-size chunking strategies impose rigid boundaries that fragment semantic coherence. We propose Dynamic Chunking, an end-to-end differentiable framework where chunk boundaries are learned dynamically via a gating router. Intra-chunk attention is computed locally while inter-chunk states propagate globally, yielding sub-quadratic complexity with superior long-context retention.',
    primaryTopics: ['Hierarchical Sequence Modeling', 'Learned Dynamic Chunk Boundaries', 'Differentiable Gating Router', 'Sub-quadratic Complexity', 'Long Range Arena (LRA)', 'Local-Global Attention']
  }
};

export const PAPER_CHUNKS: PaperChunk[] = [
  // --- Attention Is All You Need ---
  {
    chunkId: 'att-1',
    paperId: 'attention',
    paperTitle: 'Attention Is All You Need',
    arxivId: '1706.03762v7',
    section: 'Section 3.1: Encoder and Decoder Stacks',
    page: 3,
    wordCount: 145,
    settingCompatibility: ['setting_1_fine', 'setting_2_balanced', 'setting_3_coarse'],
    content: 'The encoder is composed of a stack of N = 6 identical layers. Each layer has two sub-layers. The first is a multi-head self-attention mechanism, and the second is a simple, position-wise fully connected feed-forward network. We employ a residual connection around each of the two sub-layers, followed by layer normalization. That is, the output of each sub-layer is LayerNorm(x + Sublayer(x)), where Sublayer(x) is the function implemented by the sub-layer itself. To facilitate these residual connections, all sub-layers in the model, as well as the embedding layers, produce outputs of dimension d_model = 512. The decoder is also composed of a stack of N = 6 identical layers with an additional third sub-layer that performs multi-head attention over the encoder stack output.'
  },
  {
    chunkId: 'att-2',
    paperId: 'attention',
    paperTitle: 'Attention Is All You Need',
    arxivId: '1706.03762v7',
    section: 'Section 3.2.1: Scaled Dot-Product Attention',
    page: 4,
    wordCount: 152,
    settingCompatibility: ['setting_1_fine', 'setting_2_balanced', 'setting_3_coarse'],
    content: 'We call our particular attention "Scaled Dot-Product Attention". The input consists of queries and keys of dimension d_k, and values of dimension d_v. We compute the dot products of the query with all keys, divide each by sqrt(d_k), and apply a softmax function to obtain the weights on the values. In practice, we compute the attention function on a set of queries simultaneously, packed together into a matrix Q. The keys and values are also packed into matrices K and V. We compute the matrix of outputs as: Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V. The scale factor 1/sqrt(d_k) counteracts the effect of dot products growing large in magnitude for large values of d_k, where softmax gradients become vanishingly small.'
  },
  {
    chunkId: 'att-3',
    paperId: 'attention',
    paperTitle: 'Attention Is All You Need',
    arxivId: '1706.03762v7',
    section: 'Section 3.2.2: Multi-Head Attention',
    page: 4,
    wordCount: 160,
    settingCompatibility: ['setting_1_fine', 'setting_2_balanced'],
    content: 'Instead of performing a single attention function with d_model-dimensional keys, values and queries, we found it beneficial to linearly project the queries, keys and values h times with different, learned linear projections to d_k, d_k and d_v dimensions, respectively. On each of these projected versions of queries, keys and values we then perform the attention function in parallel, yielding d_v-dimensional output values. In this work we employ h = 8 parallel attention layers, or heads. For each of these we use d_k = d_v = d_model / h = 64. Due to the reduced dimension of each head, the total computational cost is similar to that of single-head attention with full dimensionality.'
  },
  {
    chunkId: 'att-4',
    paperId: 'attention',
    paperTitle: 'Attention Is All You Need',
    arxivId: '1706.03762v7',
    section: 'Section 3.5: Positional Encoding',
    page: 5,
    wordCount: 165,
    settingCompatibility: ['setting_1_fine', 'setting_2_balanced', 'setting_3_coarse'],
    content: 'Since our model contains no recurrence and no convolution, in order for the model to make use of the order of the sequence, we must inject some information about the relative or absolute positions of the tokens in the sequence. To this end, we add "positional encodings" to the input embeddings at the bottoms of the encoder and decoder stacks. The positional encodings have the same dimension d_model as the embeddings, so that the two can be summed. In this work, we use sine and cosine functions of different frequencies: PE_(pos, 2i) = sin(pos / 10000^(2i/d_model)) and PE_(pos, 2i+1) = cos(pos / 10000^(2i/d_model)), where pos is the position and i is the dimension. We chose sinusoidal version because it may allow the model to extrapolate to sequence lengths longer than encountered during training.'
  },
  {
    chunkId: 'att-5',
    paperId: 'attention',
    paperTitle: 'Attention Is All You Need',
    arxivId: '1706.03762v7',
    section: 'Section 5.3: Optimizer & Training Regime',
    page: 7,
    wordCount: 135,
    settingCompatibility: ['setting_1_fine', 'setting_2_balanced'],
    content: 'We used the Adam optimizer with beta_1 = 0.9, beta_2 = 0.98 and epsilon = 10^-9. We varied the learning rate over the course of training, according to the formula: lrate = d_model^(-0.5) * min(step_num^(-0.5), step_num * warmup_steps^(-1.5)). This corresponds to increasing the learning rate linearly for the first warmup_steps training steps, and decreasing it thereafter proportionally to the inverse square root of the step number. We used warmup_steps = 4000. For regularization, we applied residual dropout of P_drop = 0.1 and label smoothing of epsilon_ls = 0.1 during training.'
  },
  {
    chunkId: 'att-6',
    paperId: 'attention',
    paperTitle: 'Attention Is All You Need',
    arxivId: '1706.03762v7',
    section: 'Section 6.1: Machine Translation Results',
    page: 8,
    wordCount: 140,
    settingCompatibility: ['setting_1_fine', 'setting_2_balanced', 'setting_3_coarse'],
    content: 'On the WMT 2014 English-to-German translation task, the big transformer model (Transformer (big) in Table 2) outperforms the best previously reported models (including ensembles) by more than 2.0 BLEU, establishing a new state-of-the-art BLEU score of 28.4. Even the base model exceeds all previously published models and ensembles at a fraction of the training cost. On the WMT 2014 English-to-French translation task, our big model achieves a BLEU score of 41.0, outperforming all previously published single models, at less than 1/4 the training cost of the previous state-of-the-art model.'
  },

  // --- Moshi: Real-Time Spoken Dialogue ---
  {
    chunkId: 'msh-1',
    paperId: 'moshi',
    paperTitle: 'Moshi: a speech-text foundation model for real-time dialogue',
    arxivId: '2410.00037v1',
    section: 'Section 2.1: Mimi Neural Audio Codec',
    page: 3,
    wordCount: 158,
    settingCompatibility: ['setting_1_fine', 'setting_2_balanced', 'setting_3_coarse'],
    content: 'Moshi uses Mimi, an efficient neural audio codec operating on 24 kHz audio. Mimi outputs discrete audio representations at a low frame rate of 12.5 Hz (i.e. one frame every 80 ms), using residual vector quantization (RVQ) with 8 codebooks for speech tokens. This low frame rate is critical for real-time low-latency autoregressive modeling, reducing sequence length by a factor of 4 compared to previous codecs like EnCodec (which used 50 Hz or 75 Hz). Mimi incorporates transformer layers in both encoder and decoder with causal convolutions to guarantee zero lookahead during streaming inference.'
  },
  {
    chunkId: 'msh-2',
    paperId: 'moshi',
    paperTitle: 'Moshi: a speech-text foundation model for real-time dialogue',
    arxivId: '2410.00037v1',
    section: 'Section 3.1: Multi-Stream Architecture & Full-Duplex Modeling',
    page: 5,
    wordCount: 172,
    settingCompatibility: ['setting_1_fine', 'setting_2_balanced', 'setting_3_coarse'],
    content: 'Moshi is designed for full-duplex spoken dialogue: it listens to the user while simultaneously speaking. To model this interaction, the input and output sequences are structured into multiple parallel temporal streams: one stream of discrete text tokens, one stream of user audio tokens (from Mimi codec), and one stream of Moshi audio tokens. Because speech and text operate at different cadences, Moshi synchronizes text tokens to the 12.5 Hz audio frame grid using padding tokens when no new text token is emitted. The multi-stream representation allows Moshi to handle interruptions, conversational backchanneling (such as "mhm", "yeah"), and natural overlaps without requiring an external turn-taking state machine or acoustic voice activity detector (VAD).'
  },
  {
    chunkId: 'msh-3',
    paperId: 'moshi',
    paperTitle: 'Moshi: a speech-text foundation model for real-time dialogue',
    arxivId: '2410.00037v1',
    section: 'Section 3.3: Inner Monologue',
    page: 6,
    wordCount: 168,
    settingCompatibility: ['setting_1_fine', 'setting_2_balanced', 'setting_3_coarse'],
    content: 'Directly predicting audio tokens conditioned solely on audio input leads to degraded linguistic coherence and frequent phonetic hallucinations. To prevent this, Moshi implements an "Inner Monologue" mechanism. Before generating the audio tokens for its own speech response, Moshi first predicts the corresponding text tokens autoregressively. Specifically, the text stream is advanced slightly ahead of the speech token generation. This provides semantic anchoring: the model determines what it plans to say in text, and then uses that internal textual representation as a condition to synthesize the speech audio tokens. This mechanism substantially improves factual consistency and grammatical fluency in real-time conversational exchanges.'
  },
  {
    chunkId: 'msh-4',
    paperId: 'moshi',
    paperTitle: 'Moshi: a speech-text foundation model for real-time dialogue',
    arxivId: '2410.00037v1',
    section: 'Section 4.1: Backbone Model & Latency Profile',
    page: 7,
    wordCount: 162,
    settingCompatibility: ['setting_1_fine', 'setting_2_balanced'],
    content: 'The core text-audio backbone of Moshi is based on Helium, a 7-billion parameter auto-regressive transformer trained on multi-lingual text and dialogue transcripts. The model achieves an acoustic latency of 80 ms (the frame length of Mimi) plus a theoretical computation lookahead of 80 ms, yielding a theoretical latency of 160 ms. In empirical testing on a single NVIDIA A100 GPU (80GB), the practical end-to-end latency—from the end of user utterance to the onset of Moshi speech playback—measures approximately 200 ms. This allows Moshi to achieve natural human conversational timing, where average human turn-taking latencies range between 200 ms and 250 ms.'
  },
  {
    chunkId: 'msh-5',
    paperId: 'moshi',
    paperTitle: 'Moshi: a speech-text foundation model for real-time dialogue',
    arxivId: '2410.00037v1',
    section: 'Section 5.2: Speech Generation Artifacts & Limitations',
    page: 9,
    wordCount: 140,
    settingCompatibility: ['setting_1_fine', 'setting_2_balanced', 'setting_3_coarse'],
    content: 'Despite low latency, Moshi has notable limitations. When acoustic background noise is high or multiple competing speakers speak simultaneously, the discrete tokenizer in Mimi exhibits codebook collapse, causing occasional garbled audio output. Furthermore, Moshi does not have an explicit knowledge retrieval engine or external RAG module built into the weights; factual questions outside the Helium 7B training corpus result in persuasive-sounding hallucinations unless grounded by an external tool.'
  },

  // --- Dynamic Chunking for Hierarchical Sequence Modeling ---
  {
    chunkId: 'dnc-1',
    paperId: 'dynamic_chunking',
    paperTitle: 'Dynamic Chunking for End-to-End Hierarchical Sequence Modeling',
    arxivId: '2507.07955v2',
    section: 'Section 2: The Dynamic Chunking Architecture',
    page: 3,
    wordCount: 175,
    settingCompatibility: ['setting_1_fine', 'setting_2_balanced', 'setting_3_coarse'],
    content: 'Traditional chunking approaches for long sequences rely on fixed chunk sizes (such as W = 128 or W = 256 tokens). Fixed chunking breaks syntactic structures and splits semantic units across chunk boundaries arbitrarily. Dynamic Chunking introduces a differentiable boundary predictor B_t in [0, 1] at each token position t. The boundary predictor is implemented as a lightweight two-layer MLP with a sigmoid gating function: B_t = Sigmoid(W_2 * GELU(W_1 * h_t)), trained end-to-end with the primary objective using a straight-through Gumbel estimator. When B_t exceeds threshold tau = 0.5, a chunk boundary is instantiated. This allows sequence segmentation to adapt dynamically to document semantics, punctuation, and informational entropy.'
  },
  {
    chunkId: 'dnc-2',
    paperId: 'dynamic_chunking',
    paperTitle: 'Dynamic Chunking for End-to-End Hierarchical Sequence Modeling',
    arxivId: '2507.07955v2',
    section: 'Section 3.1: Intra-Chunk vs Inter-Chunk Attention',
    page: 4,
    wordCount: 168,
    settingCompatibility: ['setting_1_fine', 'setting_2_balanced', 'setting_3_coarse'],
    content: 'The hierarchy operates on two distinct levels. Level 1 (Intra-chunk): Tokens within the same dynamic chunk perform dense self-attention over each other. Since maximum chunk length is bounded by C_max = 512, intra-chunk compute is strictly bounded. A pooled macro-representation (computed via attentive pooling over intra-chunk states) is passed to Level 2. Level 2 (Inter-chunk): The sequence of macro-chunk representations is processed by a global transformer backbone. This two-tier hierarchy reduces computational complexity from quadratic O(N^2) to O(N * C_avg + (N/C_avg)^2), where C_avg is the average learned dynamic chunk size (typically 64-128 tokens in practice).'
  },
  {
    chunkId: 'dnc-3',
    paperId: 'dynamic_chunking',
    paperTitle: 'Dynamic Chunking for End-to-End Hierarchical Sequence Modeling',
    arxivId: '2507.07955v2',
    section: 'Section 4.2: Empirical Benchmarks on Long Range Arena (LRA)',
    page: 6,
    wordCount: 155,
    settingCompatibility: ['setting_1_fine', 'setting_2_balanced'],
    content: 'We evaluate Dynamic Chunking on the Long Range Arena (LRA) benchmark across sequence lengths from 1K to 16K tokens. On the Path-X 16K visual reasoning task, where standard Transformers fail completely (achieving random 50.0% accuracy), Dynamic Chunking achieves 78.4% accuracy, outperforming S4 (88.1% vs baseline failure) while requiring 42% lower peak VRAM during training. On ListOps and Text Classification, Dynamic Chunking matches or outperforms Megabyte and Fixed Chunking baselines with an average speedup of 3.1x over full self-attention baselines.'
  },
  {
    chunkId: 'dnc-4',
    paperId: 'dynamic_chunking',
    paperTitle: 'Dynamic Chunking for End-to-End Hierarchical Sequence Modeling',
    arxivId: '2507.07955v2',
    section: 'Section 5: Training Objectives and Regularization',
    page: 7,
    wordCount: 148,
    settingCompatibility: ['setting_1_fine', 'setting_2_balanced', 'setting_3_coarse'],
    content: 'To prevent the gating router from collapsing into trivial degenerate solutions—such as predicting all boundaries (trivial 1-token chunks) or predicting zero boundaries (one infinite chunk)—we introduce an entropy regularization penalty L_chunk = lambda_c * ( (1/T sum(B_t) - target_density)^2 ). In all main experiments, target_density is set to 0.015 (corresponding to average chunk size ~66 tokens) and lambda_c is set to 0.05. The model is optimized using AdamW with cosine learning rate decay and a warmup ratio of 0.03.'
  }
];
