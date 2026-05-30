import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DetectionService } from './detection.service';
import { ModelClientService } from './model-client.service';
import { DetectCryDto } from './dto/detect-cry.dto';
import { DetectionResult } from './dto/detection-result.dto';

@Controller('api/detect')
export class DetectionController {
  constructor(
    private readonly detection: DetectionService,
    private readonly modelClient: ModelClientService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('audio'))
  async detect(
    @UploadedFile() audio: Express.Multer.File,
    @Body() ctx: DetectCryDto,
  ): Promise<DetectionResult> {
    return this.detection.detect(audio.buffer, audio.mimetype, ctx);
  }

  // Report a temperature reading (from manual entry or a sensor)
  @Post('temperature')
  @HttpCode(HttpStatus.OK)
  async temperature(@Body() body: { value: number }) {
    await this.detection.handleTemperature(body.value);
    return { ok: true };
  }

  @Get('health')
  async health() {
    const modelOk = await this.modelClient.healthCheck();
    return { backend: 'ok', model: modelOk ? 'ok' : 'unavailable' };
  }
}
