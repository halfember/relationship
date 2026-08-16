import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

/**
 * 创建事件 DTO
 */
export class CreateEventDto {
  @IsInt()
  @IsNotEmpty({ message: 'relationshipId 不能为空' })
  relationshipId: number;

  @IsString()
  @IsNotEmpty({ message: '事件标题不能为空' })
  @Length(1, 64)
  title: string;

  @IsDateString()
  @IsNotEmpty({ message: '事件日期不能为空' })
  eventDate: string;

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
