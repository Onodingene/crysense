import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertEntity } from '../entities/alert.entity';
@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(AlertEntity)
    private readonly repo: Repository<AlertEntity>,
  ) {}
  async create(data: Partial<AlertEntity>): Promise<AlertEntity> {
    const alert = this.repo.create(data);
    return this.repo.save(alert);
  }
  async findAll(limit = 50): Promise<AlertEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: limit });
  }
  async unreadCount(): Promise<number> {
    return this.repo.count({ where: { read: false } });
  }
  async markRead(id: string): Promise<void> {
    await this.repo.update(id, { read: true });
  }
  async markAllRead(): Promise<void> {
    await this.repo.update({ read: false }, { read: true });
  }

  async clear(): Promise<void> {
    await this.repo.clear();
  }
}
