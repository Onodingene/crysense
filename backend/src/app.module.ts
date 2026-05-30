import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetectionModule } from './detection/detection.module';
import { HistoryModule } from './history/history.module';
import { AlertsModule } from './alerts/alerts.module';
import { SettingsModule } from './settings/settings.module';
import { PushModule } from './push/push.module';
import { DetectionEntity } from './entities/detection.entity';
import { AlertEntity } from './entities/alert.entity';
import { SettingsEntity } from './entities/settings.entity';
import { PushSubscriptionEntity } from './entities/push-subscription.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // SQLite — zero-config local database stored in a single file
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'crysense.db', // created automatically in backend/
      entities: [
        DetectionEntity,
        AlertEntity,
        SettingsEntity,
        PushSubscriptionEntity,
      ],
      synchronize: true, // auto-creates tables (dev only)
    }),

    DetectionModule,
    HistoryModule,
    AlertsModule,
    SettingsModule,
    PushModule,
  ],
})
export class AppModule {}
