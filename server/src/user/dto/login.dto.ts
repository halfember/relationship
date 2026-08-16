import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

/**
 * 微信登录 DTO
 */
export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'code 不能为空' })
  code: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
