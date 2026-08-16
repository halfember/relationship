import { IsObject, IsOptional, IsString, Length, MaxLength, Matches } from 'class-validator';

export class TrackEventDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{1,63}$/)
  eventName: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  page?: string;

  @IsOptional()
  @IsString()
  @Length(8, 64)
  sessionId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string | number | boolean | null>;
}
