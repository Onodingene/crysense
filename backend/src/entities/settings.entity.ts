import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('settings')
export class SettingsEntity {
  @PrimaryColumn('varchar')
  id!: string;

  @Column('boolean', { default: true })
  pushNotifications!: boolean;

  @Column('boolean', { default: true })
  temperatureAlerts!: boolean;

  @Column('float', { default: 20 })
  tempMin!: number;

  @Column('float', { default: 26 })
  tempMax!: number;
}
