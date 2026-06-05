import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetectionEntity } from '../entities/detection.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(DetectionEntity)
    private readonly repo: Repository<DetectionEntity>,
  ) {}

  /** Persist a detection result (called by the detection flow). */
  async save(result: any): Promise<void> {
    const entity = this.repo.create({
      id: result.id,
      babyId: result.babyId ?? null,
      primaryCause: result.primaryCause,
      primaryConfidence: result.primaryConfidence,
      contextAdjustedCause: result.contextAdjustedCause,
      fusionApplied: result.fusionApplied,
      fusionReason: result.fusionReason ?? null,
      recommendation: result.recommendation,
      actionItems: JSON.stringify(result.actionItems ?? []),
      allProbabilities: JSON.stringify(result.allProbabilities ?? {}),
      modelLatencyMs: result.modelLatencyMs,
      totalLatencyMs: result.totalLatencyMs,
    });
    await this.repo.save(entity);
  }

  /** Return detection history, newest first. */
  async findAll(limit = 100): Promise<any[]> {
    const rows = await this.repo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      babyId: r.babyId,
      primaryCause: r.primaryCause,
      primaryConfidence: r.primaryConfidence,
      contextAdjustedCause: r.contextAdjustedCause,
      fusionApplied: r.fusionApplied,
      fusionReason: r.fusionReason,
      recommendation: r.recommendation,
      actionItems: safeParse(r.actionItems, []),
      allProbabilities: safeParse(r.allProbabilities, {}),
      modelLatencyMs: r.modelLatencyMs,
      totalLatencyMs: r.totalLatencyMs,
      timestamp: r.createdAt.toISOString(),
    }));
  }

  async clear(): Promise<void> {
    await this.repo.clear();
  }
}

/** Safely parse a JSON string, returning a fallback on failure. */
function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
