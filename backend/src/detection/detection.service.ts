import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ModelClientService } from './model-client.service';
import { ContextFusionService } from './context-fusion.service';
import { DetectCryDto } from './dto/detect-cry.dto';
import { DetectionResult } from './dto/detection-result.dto';
import { HistoryService } from '../history/history.service';
import { AlertsService } from '../alerts/alerts.service';
import { SettingsService } from '../settings/settings.service';
import { PushService } from '../push/push.service';
const RECOMMENDATIONS: Record<string, { advice: string; actions: string[] }> = {
  hunger: {
    advice: 'Baby is likely hungry. Offer a feed.',
    actions: [
      'Prepare a bottle or position for breastfeeding',
      'Check the time since the last feed',
      'Watch for rooting and sucking motions',
    ],
  },
  pain: {
    advice: 'Baby may be in physical discomfort or pain.',
    actions: [
      'Check the nappy for irritation',
      'Look for signs of fever or rash',
      'Check clothing for tight elastic or tags',
      'If pain persists or seems severe, contact your paediatrician',
    ],
  },
  discomfort: {
    advice: 'Baby seems uncomfortable. Try environmental checks.',
    actions: [
      'Check nappy — wet or soiled',
      'Check temperature — too hot or too cold',
      'Adjust position or wind the baby',
      'Soothe with gentle rocking or skin-to-skin contact',
    ],
  },
  sleepiness: {
    advice: 'Baby appears tired and needs help winding down.',
    actions: [
      'Move to a quiet, dim space',
      'Swaddle if appropriate for age',
      'Try gentle rocking, white noise, or a lullaby',
      'Avoid overstimulation',
    ],
  },
};
@Injectable()
export class DetectionService {
  private readonly log = new Logger(DetectionService.name);
  constructor(
    private readonly modelClient: ModelClientService,
    private readonly fusion: ContextFusionService,
    private readonly history: HistoryService,
    private readonly alerts: AlertsService,
    private readonly settings: SettingsService,
    private readonly push: PushService,
  ) {}
  async detect(
    audioBuffer: Buffer,
    mimeType: string,
    ctx: DetectCryDto,
  ): Promise<DetectionResult> {
    const t0 = Date.now();
    if (audioBuffer.length < 2000) {
      throw new BadRequestException(
        'Audio recording is too short. Please record at least 2 seconds.',
      );
    }
    const prediction = await this.modelClient.predict(audioBuffer, mimeType);
    console.log('🔍 MODEL RESPONSE:', JSON.stringify(prediction, null, 2));
    console.log('🔍 typeof prediction:', typeof prediction);
    const fusion = this.fusion.apply(prediction, ctx);
    const finalCause = fusion.finalCause;
    const reco = RECOMMENDATIONS[finalCause];
    const result: DetectionResult = {
      id: randomUUID(),
      primaryCause: prediction.predicted_class,
      primaryConfidence: prediction.confidence,
      contextAdjustedCause: finalCause,
      fusionApplied: fusion.applied,
      fusionReason: fusion.reason,
      recommendation: reco.advice,
      actionItems: reco.actions,
      allProbabilities: prediction.all_probabilities,
      modelLatencyMs: prediction.processing_time_ms,
      totalLatencyMs: Date.now() - t0,
      timestamp: new Date().toISOString(),
    };
    // ── 1. Save to history ────────────────────────────────────────
    await this.history.save({ ...result, babyId: ctx.babyId });

    // ── 2. Create an alert ────────────────────────────────────────
    const severity = finalCause === 'pain' ? 'danger' : 'info';
    await this.alerts.create({
      type: 'cry',
      severity,
      title: `${this.capitalise(finalCause)} cry detected`,
      message: result.recommendation,
      read: false,
      relatedId: result.id,
    });

    // ── 3. Send push notification (if enabled) ───────────────────
    const settings = await this.settings.get();
    if (settings.pushNotifications) {
      await this.push.sendToAll({
        title: `${this.capitalise(finalCause)} cry detected`,
        body: result.recommendation,
        tag: 'cry-detection',
      });
    }

    this.log.log(
      `Detection ${result.id}: model=${result.primaryCause}(${result.primaryConfidence.toFixed(2)}) ` +
        `final=${result.contextAdjustedCause} total=${result.totalLatencyMs}ms`,
    );

    return result;
  }

  /** Temperature alert — called from a temperature endpoint or device feed. */
  async handleTemperature(value: number): Promise<void> {
    const settings = await this.settings.get();
    if (!settings.temperatureAlerts) return;
    if (value < settings.tempMin || value > settings.tempMax) {
      const tooLow = value < settings.tempMin;
      await this.alerts.create({
        type: 'temperature',
        severity: 'warning',
        title: `Room temperature ${tooLow ? 'too low' : 'too high'}`,
        message: `Current: ${value}°C — safe range ${settings.tempMin}–${settings.tempMax}°C`,
        read: false,
      });
      if (settings.pushNotifications) {
        await this.push.sendToAll({
          title: `Room temperature ${tooLow ? 'too low' : 'too high'}`,
          body: `Current: ${value}°C. Safe range is ${settings.tempMin}–${settings.tempMax}°C.`,
          tag: 'temperature-alert',
        });
      }
    }
  }
  private capitalise(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
