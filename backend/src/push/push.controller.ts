import { Controller, Post, Get, Body } from '@nestjs/common';
import { PushService } from './push.service';
@Controller('api/push')
export class PushController {
  constructor(private readonly push: PushService) {}
  @Get('public-key')
  getPublicKey() {
    return { publicKey: this.push.getPublicKey() };
  }
  @Post('subscribe')
  async subscribe(@Body() subscription: any) {
    await this.push.subscribe(subscription);
    return { ok: true };
  }
  @Post('unsubscribe')
  async unsubscribe(@Body() body: { endpoint: string }) {
    await this.push.unsubscribe(body.endpoint);
    return { ok: true };
  }
  // Handy for testing push from the browser
  @Post('test')
  async test() {
    await this.push.sendToAll({
      title: 'CrySense Test',
      body: 'Push notifications are working!',
      tag: 'test',
    });
    return { sent: true };
  }
}
