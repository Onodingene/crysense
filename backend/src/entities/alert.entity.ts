import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('alerts')
export class AlertEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar')
  type!: 'cry' | 'temperature';

  @Column('varchar')
  severity!: 'info' | 'warning' | 'danger';

  @Column('varchar')
  title!: string;

  @Column('text')
  message!: string;

  @Column('boolean', { default: false })
  @Index()
  read!: boolean;

  @Column('varchar', { nullable: true })
  relatedId!: string;

  @CreateDateColumn()
  @Index()
  createdAt!: Date;
}
