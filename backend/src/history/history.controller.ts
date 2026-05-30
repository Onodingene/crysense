import { Controller, Get, Delete, Query } from '@nestjs/common';
import { HistoryService } from './history.service';
@Controller('api/history')
export class HistoryController {
  constructor(private readonly history: HistoryService) {}
  @Get()
  async getHistory(@Query('limit') limit?: string) {
    return this.history.findAll(limit ? parseInt(limit, 10) : 100);
  }
  @Delete()
  async clearHistory() {
    await this.history.clear();
    return { cleared: true };
  }
}
