import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ModelPrediction } from './dto/detection-result.dto';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import FormData = require('form-data');

@Injectable()
export class ModelClientService {
  private readonly log = new Logger(ModelClientService.name);
  private readonly modelUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.modelUrl = this.config.get<string>(
      'MODEL_API_URL',
      'http://localhost:8000',
    );
  }

  async predict(
    audioBuffer: Buffer,
    mimeType: string,
  ): Promise<ModelPrediction> {
    const form = new FormData();
    form.append('audio', audioBuffer, {
      filename: 'cry.webm',
      contentType: mimeType || 'audio/webm',
    });

    try {
      const start = Date.now();
      const { data } = await firstValueFrom(
        this.http.post<ModelPrediction>(`${this.modelUrl}/predict`, form, {
          headers: form.getHeaders(),
          maxBodyLength: 10 * 1024 * 1024,
          timeout: 8000,
        }),
      );
      const elapsed = Date.now() - start;
      this.log.log(
        `Model returned ${data.predicted_class} (${data.confidence.toFixed(3)}) in ${elapsed}ms`,
      );
      return data;
    } catch (err: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.log.error('Model service unreachable', err?.message);
      throw new ServiceUnavailableException(
        'Model service is currently unavailable. Please try again in a moment.',
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data } = await firstValueFrom(
        this.http.get(`${this.modelUrl}/health`, { timeout: 2000 }),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return data?.model_loaded === true;
    } catch {
      return false;
    }
  }
}
