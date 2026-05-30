import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsEntity } from '../entities/settings.entity';
const DEFAULT_ID = 'default';
@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SettingsEntity)
    private readonly repo: Repository<SettingsEntity>,
  ) {}
  /** Return settings, creating the default row on first access. */
  async get(): Promise<SettingsEntity> {
    let settings = await this.repo.findOne({ where: { id: DEFAULT_ID } });
    if (!settings) {
      settings = this.repo.create({
        id: DEFAULT_ID,
        pushNotifications: true,
        temperatureAlerts: true,
        tempMin: 20,
        tempMax: 26,
      });
      await this.repo.save(settings);
    }
    return settings;
  }
  async update(patch: Partial<SettingsEntity>): Promise<SettingsEntity> {
    const current = await this.get();
    Object.assign(current, patch, { id: DEFAULT_ID });
    return this.repo.save(current);
  }
}
