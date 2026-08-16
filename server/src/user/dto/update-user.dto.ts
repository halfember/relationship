import { IsString, IsOptional, Length } from 'class-validator';

/**
 * 更新用户信息 DTO
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 32, { message: '昵称长度 1-32 字符' })
  nickname?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
