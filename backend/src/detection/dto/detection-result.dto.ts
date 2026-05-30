export interface ModelPrediction {
  predicted_class: 'hunger' | 'pain' | 'discomfort' | 'sleepiness';
  confidence: number;
  all_probabilities: Record<string, number>;
  processing_time_ms: number;
  audio_duration_s: number;
}

export interface DetectionResult {
  id: string;
  primaryCause: string;
  primaryConfidence: number;
  contextAdjustedCause: string;
  fusionApplied: boolean;
  fusionReason?: string;
  recommendation: string;
  actionItems: string[];
  allProbabilities: Record<string, number>;
  modelLatencyMs: number;
  totalLatencyMs: number;
  timestamp: string;
}
