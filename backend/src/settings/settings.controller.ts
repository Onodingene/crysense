import { Controller, Get, Patch, Body } from '@nestjs/common';
import { SettingsService } from './settings.service'; 
@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}
  @Get()
  async getSettings() {
    return this.settings.get();
  }
  @Patch()
  async updateSettings(@Body() patch: any) {
    return this.settings.update(patch);
  }
}
