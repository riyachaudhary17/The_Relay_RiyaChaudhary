export interface ModelRequestConfig {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  isStream?: boolean;
}

export interface ModelUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ModelResponse {
  content: string;
  firstTokenMs: number;
  totalMs: number;
  queueWaitMs: number;
  workingMs: number;
  retryWaitMs: number;
  retries: number;
  status: 'ok' | 'rate_limited' | 'timeout' | 'error';
  errorMessage?: string;
  usage: ModelUsage;
  source: 'real' | 'stand-in';
}

export interface StandInConfig {
  baseTTFTMs: number;          // Base TTFT p50 ~240ms
  tokensPerSecond: number;     // ~280 tokens/sec
  rpmLimit: number;            // 30 req/min
  tpmLimit: number;            // 6,000 tokens/min
  dailyBudgetTokens: number;   // 500,000 tokens
  dailyTokensUsed: number;
  maxConcurrency: number;      // 2 in-flight before heavy queueing
  transientFailureRate: number; // e.g. 0.02 (2%)
  slowCallRate: number;        // e.g. 0.05 (5% slow tail)
  enableDailyBudgetExhausted: boolean;
}

export const DEFAULT_STANDIN_CONFIG: StandInConfig = {
  baseTTFTMs: 240,
  tokensPerSecond: 280,
  rpmLimit: 30,
  tpmLimit: 6000,
  dailyBudgetTokens: 500000,
  dailyTokensUsed: 12000,
  maxConcurrency: 2,
  transientFailureRate: 0.02,
  slowCallRate: 0.05,
  enableDailyBudgetExhausted: false,
};

// Singleton rate-limiter state
class StandInServer {
  private config: StandInConfig = { ...DEFAULT_STANDIN_CONFIG };
  private requestTimestamps: number[] = [];
  private tokenTimestamps: { timestamp: number; tokens: number }[] = [];
  private activeInFlight: number = 0;
  private queueWaiters: number = 0;

  public updateConfig(newConfig: Partial<StandInConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): StandInConfig {
    return { ...this.config };
  }

  public resetBuckets() {
    this.requestTimestamps = [];
    this.tokenTimestamps = [];
    this.activeInFlight = 0;
    this.queueWaiters = 0;
    this.config.dailyTokensUsed = 12000;
  }

  public getInFlightCount(): number {
    return this.activeInFlight;
  }

  public getQueueLength(): number {
    return this.queueWaiters;
  }

  private cleanOldBuckets(now: number) {
    const windowStart = now - 60000;
    this.requestTimestamps = this.requestTimestamps.filter(t => t > windowStart);
    this.tokenTimestamps = this.tokenTimestamps.filter(t => t.timestamp > windowStart);
  }

  public checkRateLimits(now: number, estimatedTokens: number): { allowed: boolean; reason?: string; retryAfterSec?: number } {
    if (this.config.enableDailyBudgetExhausted || this.config.dailyTokensUsed >= this.config.dailyBudgetTokens) {
      return {
        allowed: false,
        reason: 'Daily token budget exhausted (14,400 RPD / 500,000 TPD exhausted for organization). Resets at 00:00 UTC.',
        retryAfterSec: 3600
      };
    }

    this.cleanOldBuckets(now);

    if (this.requestTimestamps.length >= this.config.rpmLimit) {
      const oldest = this.requestTimestamps[0] || now;
      const retryAfterSec = Math.max(1, Math.ceil((60000 - (now - oldest)) / 1000));
      return {
        allowed: false,
        reason: `Rate limit reached for requests per minute (RPM): Limit ${this.config.rpmLimit}, Used ${this.requestTimestamps.length}. Please try again in ${retryAfterSec}s.`,
        retryAfterSec
      };
    }

    const currentMinuteTokens = this.tokenTimestamps.reduce((sum, item) => sum + item.tokens, 0);
    if (currentMinuteTokens + estimatedTokens > this.config.tpmLimit) {
      const oldest = this.tokenTimestamps[0]?.timestamp || now;
      const retryAfterSec = Math.max(1, Math.ceil((60000 - (now - oldest)) / 1000));
      return {
        allowed: false,
        reason: `Rate limit reached for tokens per minute (TPM): Limit ${this.config.tpmLimit}, Used ${currentMinuteTokens}, Requested ${estimatedTokens}. Please try again in ${retryAfterSec}s.`,
        retryAfterSec
      };
    }

    return { allowed: true };
  }

  public recordUsage(now: number, tokens: number) {
    this.requestTimestamps.push(now);
    this.tokenTimestamps.push({ timestamp: now, tokens });
    this.config.dailyTokensUsed += tokens;
  }

  public async executeCall(
    prompt: string,
    expectedOutputText: string,
    onTokenChunk?: (chunk: string) => void
  ): Promise<ModelResponse> {
    const overallStart = performance.now();
    let queueWaitMs = 0;
    let workingMs = 0;
    let retryWaitMs = 0;
    let retries = 0;

    const promptTokens = Math.max(12, Math.round(prompt.length / 4));
    const completionTokens = Math.max(15, Math.round(expectedOutputText.length / 4));
    const totalTokens = promptTokens + completionTokens;

    // Retry loop (Max 2 retries)
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const attemptStart = performance.now();
      const now = Date.now();

      // Check Rate Limits
      const limitCheck = this.checkRateLimits(now, totalTokens);
      if (!limitCheck.allowed) {
        if (attempt < maxRetries && limitCheck.retryAfterSec && limitCheck.retryAfterSec <= 3) {
          // Retry with exponential backoff & jitter
          retries++;
          const backoff = (limitCheck.retryAfterSec * 1000) + Math.random() * 400;
          retryWaitMs += backoff;
          await new Promise(r => setTimeout(r, backoff));
          continue;
        }

        const totalTime = Math.round(performance.now() - overallStart);
        return {
          content: '',
          firstTokenMs: 0,
          totalMs: totalTime,
          queueWaitMs: Math.round(queueWaitMs),
          workingMs: 0,
          retryWaitMs: Math.round(retryWaitMs),
          retries,
          status: 'rate_limited',
          errorMessage: limitCheck.reason,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          source: 'stand-in'
        };
      }

      // Check Concurrency & Queueing
      this.queueWaiters++;
      const queueStart = performance.now();
      
      // If concurrency exceeded, queue delay occurs
      if (this.activeInFlight >= this.config.maxConcurrency) {
        const queueDelay = (this.activeInFlight - this.config.maxConcurrency + 1) * 350 + (Math.random() * 200);
        await new Promise(r => setTimeout(r, queueDelay));
      }
      queueWaitMs += (performance.now() - queueStart);
      this.queueWaiters--;

      // Enter active working state
      this.activeInFlight++;
      this.recordUsage(Date.now(), totalTokens);

      try {
        // Random transient failure injection (e.g. 2% network drop)
        if (Math.random() < this.config.transientFailureRate) {
          if (attempt < maxRetries) {
            retries++;
            const backoff = 400 * Math.pow(2, attempt) + Math.random() * 150;
            retryWaitMs += backoff;
            await new Promise(r => setTimeout(r, backoff));
            continue;
          }
          throw new Error('Groq upstream connection reset by peer (simulated transient failure)');
        }

        // Latency simulation:
        // Base TTFT + concurrency penalty + occasional long tail
        const isTailLatency = Math.random() < this.config.slowCallRate;
        const concurrencyFactor = 1 + (this.activeInFlight * 0.35);
        const jitter = (Math.random() * 60) - 30;
        
        let ttft = (this.config.baseTTFTMs * concurrencyFactor) + jitter;
        if (isTailLatency) {
          ttft += 750 + Math.random() * 800; // Tail latency p95/p99 simulation
        }
        ttft = Math.max(90, Math.round(ttft));

        // Wait for first token
        const workStart = performance.now();
        await new Promise(r => setTimeout(r, ttft));
        const firstTokenArrival = performance.now() - overallStart;

        // Stream output tokens
        const words = expectedOutputText.split(/(\s+)/);
        const msPerWord = Math.max(5, Math.round((1000 / this.config.tokensPerSecond) * 1.3));
        
        for (let i = 0; i < words.length; i++) {
          if (onTokenChunk) {
            onTokenChunk(words[i]);
          }
          // Small realistic chunk delay
          if (i % 2 === 0) {
            await new Promise(r => setTimeout(r, msPerWord * 2));
          }
        }

        workingMs += (performance.now() - workStart);
        const totalDuration = Math.round(performance.now() - overallStart);

        return {
          content: expectedOutputText,
          firstTokenMs: Math.round(firstTokenArrival),
          totalMs: totalDuration,
          queueWaitMs: Math.round(queueWaitMs),
          workingMs: Math.round(workingMs),
          retryWaitMs: Math.round(retryWaitMs),
          retries,
          status: 'ok',
          usage: { promptTokens, completionTokens, totalTokens },
          source: 'stand-in'
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        if (attempt >= maxRetries) {
          const totalDuration = Math.round(performance.now() - overallStart);
          return {
            content: '',
            firstTokenMs: 0,
            totalMs: totalDuration,
            queueWaitMs: Math.round(queueWaitMs),
            workingMs: Math.round(workingMs),
            retryWaitMs: Math.round(retryWaitMs),
            retries,
            status: 'error',
            errorMessage: errorMsg,
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            source: 'stand-in'
          };
        }
      } finally {
        this.activeInFlight = Math.max(0, this.activeInFlight - 1);
      }
    }

    // Default timeout/give up
    return {
      content: '',
      firstTokenMs: 0,
      totalMs: Math.round(performance.now() - overallStart),
      queueWaitMs: Math.round(queueWaitMs),
      workingMs: Math.round(workingMs),
      retryWaitMs: Math.round(retryWaitMs),
      retries,
      status: 'timeout',
      errorMessage: 'Exceeded maximum retries (request abandoned by client)',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      source: 'stand-in'
    };
  }
}

export const standInModelServer = new StandInServer();
