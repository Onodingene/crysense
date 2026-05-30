import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class DetectCryDto {
  @IsOptional()
  @IsDateString()
  lastFedAt?: string;

  @IsOptional()
  @IsDateString()
  lastSleptAt?: string;

  @IsOptional()
  @IsString()
  babyId?: string;

  @IsOptional()
  @IsIn(['morning', 'afternoon', 'evening', 'night'])
  timeOfDay?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  ageInMonths?: number;
}
