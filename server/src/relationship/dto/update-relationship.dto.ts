import { IsArray, IsDateString, IsOptional, IsString, Length } from 'class-validator';

/**
 * 更新关系 DTO
 */
export class UpdateRelationshipDto {
  @IsOptional()
  @IsString()
  @Length(1, 32)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 16)
  type?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  remark?: string;
}
