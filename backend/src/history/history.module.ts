import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetectionEntity } from '../entities/detection.entity';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';

@Module({
  imports: [TypeOrmModule.forFeature([DetectionEntity])],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
