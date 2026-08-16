import { IsString, IsNotEmpty, IsOptional, IsInt, IsIn, Length, Max, MaxLength, Min } from 'class-validator';

/**
 * AI 生成请求 DTO
 */
export class GenerateDto {
  @IsInt()
  @IsNotEmpty({ message: 'userId 不能为空' })
  userId: number;

  @IsString()
  @IsNotEmpty({ message: 'type 不能为空' })
  @IsIn(['blessing', 'memory', 'gift'])
  type: 'blessing' | 'memory' | 'gift';

  @IsString()
  @IsNotEmpty({ message: 'prompt 不能为空' })
  @Length(1, 2000)
  prompt: string;

  @IsOptional()
  @IsInt()
  relationshipId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  scene?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  style?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  budgetMin?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  budgetMax?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  preferences?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  avoid?: string;
}
