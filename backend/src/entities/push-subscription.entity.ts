import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('push_subscriptions')
export class PushSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text', { unique: true })
  endpoint!: string;

  @Column('text')
  p256dh!: string;

  @Column('text')
  auth!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
