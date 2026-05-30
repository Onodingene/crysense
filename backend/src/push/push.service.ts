import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscriptionEntity } from '../entities/push-subscription.entity';
@Injectable()
export class PushService implements OnModuleInit {
  private readonly log = new Logger(PushService.name);
  constructor(
    @InjectRepository(PushSubscriptionEntity)
    private readonly repo: Repository<PushSubscriptionEntity>,
    private readonly config: ConfigService,
  ) {}
  onModuleInit() {
    // VAPID keys identify your server to push services.
    // Generate once with: npx web-push generate-vapid-keys
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>(
      'VAPID_SUBJECT',
      'mailto:admin@crysense.app',
    );

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.log.log('Web Push configured with VAPID keys');
    } else {
      this.log.warn('VAPID keys not set — push notifications disabled');
    }
  }

  /** Store a browser subscription. */
  async subscribe(sub: any): Promise<void> {
    const existing = await this.repo.findOne({ where: { endpoint: sub.endpoint } });
    if (existing) return; // already subscribed

    await this.repo.save(
      this.repo.create({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        endpoint: sub.endpoint,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      }),
    );
    this.log.log('New push subscription stored');
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.repo.delete({ endpoint });
  }

  /** Send a notification to every subscribed browser. */
  async sendToAll(payload: {
    title: string;
    body: string;
    tag?: string;
  }): Promise<void> {
    const subs = await this.repo.find();
    const data = JSON.stringify(payload);

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            data,
          );
        } catch (err: any) {
          // 410 Gone = subscription expired, remove it
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (err.statusCode === 410 || err.statusCode === 404) {
            await this.repo.delete({ endpoint: sub.endpoint });
            this.log.log('Removed expired subscription');
          } else {
            this.log.error(`Push failed: ${err.message}`);
          }
        }
      }),
    );
  }

  /** Public VAPID key for the frontend to subscribe. */
  getPublicKey(): string {
    return this.config.get<string>('VAPID_PUBLIC_KEY', '');
  }
}
