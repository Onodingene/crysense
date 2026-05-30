import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common';
import { AlertsService } from './alerts.service';
@Controller('api/alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}
  @Get()
  async getAlerts(@Query('limit') limit?: string) {
    return this.alerts.findAll(limit ? parseInt(limit, 10) : 50);
  }
  @Get('unread-count')
  async getUnreadCount() {
    return { count: await this.alerts.unreadCount() };
  }
  @Post(':id/read')
  async markRead(@Param('id') id: string) {
    await this.alerts.markRead(id);
    return { ok: true };
  }
  @Post('read-all')
  async markAllRead() {
    await this.alerts.markAllRead();
    return { ok: true };
  }
  @Delete()
  async clearAlerts() {
    await this.alerts.clear();
    return { cleared: true };
  }
}
