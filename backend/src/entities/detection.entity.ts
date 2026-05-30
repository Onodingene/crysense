import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('detections')
export class DetectionEntity {
  @PrimaryColumn('varchar')
  id!: string;

  @Column('varchar', { nullable: true })
  @Index()
  babyId!: string;

  @Column('varchar')
  primaryCause!: string;

  @Column('float')
  primaryConfidence!: number;

  @Column('varchar')
  contextAdjustedCause!: string;

  @Column('boolean', { default: false })
  fusionApplied!: boolean;

  @Column('text', { nullable: true })
  fusionReason!: string;

  @Column('text')
  recommendation!: string;

  @Column('text')
  actionItems!: string;

  @Column('text')
  allProbabilities!: string;

  @Column('float')
  modelLatencyMs!: number;

  @Column('float')
  totalLatencyMs!: number;

  @CreateDateColumn()
  @Index()
  createdAt!: Date;
}
