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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      id: result.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      //   babyId: result.babyId ?? null,
      //   primaryCause: result.primaryCause,
      //   primaryConfidence: result.primaryConfidence,
      //   contextAdjustedCause: result.contextAdjustedCause,
      //   fusionApplied: result.fusionApplied,
      //   fusionReason: result.fusionReason ?? null,
      //   recommendation: result.recommendation,
      //   actionItems: JSON.stringify(result.actionItems),
      //   allProbabilities: JSON.stringify(result.allProbabilities),
      //   modelLatencyMs: result.modelLatencyMs,
      //   totalLatencyMs: result.totalLatencyMs,
    });
    await this.repo.save(entity);
  }
  /** Return detection history, newest first. */
  async findAll(limit = 100): Promise<any[]> {
    const rows = await this.repo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
    // Deserialise JSON columns back into objects
    return rows.map((r) => ({
      id: r.id,
      primaryCause: r.primaryCause,
      primaryConfidence: r.primaryConfidence,
      contextAdjustedCause: r.contextAdjustedCause,
      fusionApplied: r.fusionApplied,
      fusionReason: r.fusionReason,
      recommendation: r.recommendation,

      //   actionItems: JSON.parse(r.actionItems),
      //   allProbabilities: JSON.parse(r.allProbabilities),
      modelLatencyMs: r.modelLatencyMs,
      totalLatencyMs: r.totalLatencyMs,
      //   timestamp: r.createdAt.toISOString(),
    }));
  }
  async clear(): Promise<void> {
    await this.repo.clear();
  }
}
