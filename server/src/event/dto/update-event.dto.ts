import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

/**
 * 更新事件 DTO
 */
export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @Length(1, 64)
  title?: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['每年', '每月', '每周'])
  repeatType?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(365, { each: true })
  remindDays?: number[];
}
