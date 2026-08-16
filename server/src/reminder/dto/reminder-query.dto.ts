import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 提醒查询 DTO
 */
export class ReminderQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days?: number = 7;
}
