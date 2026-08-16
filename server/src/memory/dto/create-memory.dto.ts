import { IsString, IsNotEmpty, IsOptional, IsInt, IsDateString } from 'class-validator';

/**
 * 创建记忆 DTO
 */
export class CreateMemoryDto {
  @IsInt()
  @IsNotEmpty({ message: 'relationshipId 不能为空' })
  relationshipId: number;

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
