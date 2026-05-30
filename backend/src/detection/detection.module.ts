import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DetectionController } from './detection.controller';
import { DetectionService } from './detection.service';
import { ModelClientService } from './model-client.service';
import { ContextFusionService } from './context-fusion.service';
import { HistoryModule } from '../history/history.module';
import { AlertsModule } from '../alerts/alerts.module';
import { SettingsModule } from '../settings/settings.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({ timeout: 8000, maxRedirects: 0 }),
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
    HistoryModule, // ← gives access to HistoryService
    AlertsModule, // ← gives access to AlertsService
    SettingsModule, // ← gives access to SettingsService
    PushModule, // ← gives access to PushService
  ],
  controllers: [DetectionController],
  providers: [DetectionService, ModelClientService, ContextFusionService],
  exports: [DetectionService],
})
export class DetectionModule {}
