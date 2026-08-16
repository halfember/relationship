import { IsString, IsOptional, IsDateString } from 'class-validator';

/**
 * 更新记忆 DTO
 */
export class UpdateMemoryDto {
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsDateString()
  memoryDate?: string;
}
