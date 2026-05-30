import { Injectable, Logger } from '@nestjs/common';
import { ModelPrediction } from './dto/detection-result.dto';
import { DetectCryDto } from './dto/detect-cry.dto';

interface FusionDecision {
  finalCause: string;
  applied: boolean;
  reason?: string;
}

@Injectable()
export class ContextFusionService {
  private readonly log = new Logger(ContextFusionService.name);
  private readonly LOW_CONFIDENCE_THRESHOLD = 0.55;

  apply(prediction: ModelPrediction, ctx: DetectCryDto): FusionDecision {
    const probs = prediction.all_probabilities;
    const top = prediction.predicted_class;
    const confidence = prediction.confidence;

    if (confidence >= this.LOW_CONFIDENCE_THRESHOLD) {
      return { finalCause: top, applied: false };
    }

    if (top === 'hunger' && ctx.lastFedAt) {
      const minutesSinceFeed = this.minutesSince(ctx.lastFedAt);
      if (minutesSinceFeed < 60) {
        const alternative = this.secondHighest(probs, 'hunger');
        return {
          finalCause: alternative,
          applied: true,
          reason: `Baby was fed ${Math.round(minutesSinceFeed)} minutes ago, so hunger is unlikely. The second-most probable cause (${alternative}) was selected instead.`,
        };
      }
    }

    if (ctx.lastSleptAt) {
      const minutesAwake = this.minutesSince(ctx.lastSleptAt);
      const sleepProb = probs['sleepiness'] ?? 0;
      if (minutesAwake > 120 && sleepProb > 0.2 && top !== 'sleepiness') {
        return {
          finalCause: 'sleepiness',
          applied: true,
          reason: `Baby has been awake for ${Math.round(minutesAwake / 60)} hours, suggesting tiredness despite the cry pattern.`,
        };
      }
    }

    if (ctx.timeOfDay === 'night' && top !== 'hunger') {
      const hungerProb = probs['hunger'] ?? 0;
      if (hungerProb > 0.25 && ctx.lastFedAt) {
        const minutesSinceFeed = this.minutesSince(ctx.lastFedAt);
        if (minutesSinceFeed > 180) {
          return {
            finalCause: 'hunger',
            applied: true,
            reason: `It's nighttime and baby was last fed ${Math.round(minutesSinceFeed / 60)} hours ago — likely night-feed time.`,
          };
        }
      }
    }

    return { finalCause: top, applied: false };
  }

  private minutesSince(isoDate: string): number {
    return Math.max(0, (Date.now() - new Date(isoDate).getTime()) / 60000);
  }

  private secondHighest(
    probs: Record<string, number>,
    exclude: string,
  ): string {
    return Object.entries(probs)
      .filter(([k]) => k !== exclude)
      .sort(([, a], [, b]) => b - a)[0][0];
  }
}
