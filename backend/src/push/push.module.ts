import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushSubscriptionEntity } from '../entities/push-subscription.entity';
import { PushController } from './push.controller';
import { PushService } from './push.service';
@Module({
  imports: [TypeOrmModule.forFeature([PushSubscriptionEntity])],
  controllers: [PushController],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
