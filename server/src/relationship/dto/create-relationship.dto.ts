import { IsArray, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

/**
 * 创建关系 DTO
 */
export class CreateRelationshipDto {
  @IsInt()
  @IsNotEmpty({ message: 'userId 不能为空' })
  userId: number;

  @IsString()
  @IsNotEmpty({ message: '姓名不能为空' })
  @Length(1, 32)
  name: string;

  @IsString()
  @IsNotEmpty({ message: '关系类型不能为空' })
  @Length(1, 16)
  type: string;

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
