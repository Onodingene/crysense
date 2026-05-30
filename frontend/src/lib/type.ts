export type CryClass = 'hunger' | 'pain' | 'discomfort' | 'sleepiness';
 
export interface DetectionResult {
  id: string;
  primaryCause: CryClass;
  primaryConfidence: number;
  contextAdjustedCause: CryClass;
  fusionApplied: boolean;
  fusionReason?: string;
  recommendation: string;
  actionItems: string[];
  allProbabilities: Record<CryClass, number>;
  modelLatencyMs: number;
  totalLatencyMs: number;
  timestamp: string;
}
 
export interface HistoryEntry extends DetectionResult {}
 
export interface Alert {
  id: string;
  type: 'cry' | 'temperature';
  severity: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  relatedId?: string;
}
 
export interface AppSettings {
  pushNotifications: boolean;
  temperatureAlerts: boolean;
  tempMin: number;
  tempMax: number;
}
 
export interface TemperatureReading {
  value: number;          // °C
  timestamp: string;
}
 