import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertEntity } from '../entities/alert.entity';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
@Module({
  imports: [TypeOrmModule.forFeature([AlertEntity])],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
