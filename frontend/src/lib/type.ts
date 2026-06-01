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

export interface Alert {
  id: string;
  type: 'cry' | 'temperature';
  severity: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Settings {
  pushNotifications: boolean;
  temperatureAlerts: boolean;
  tempMin: number;
  tempMax: number;
}