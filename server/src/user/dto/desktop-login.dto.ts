import { IsString, Matches } from 'class-validator';

export class DesktopLoginDto {
  @IsString()
  @Matches(/^[A-HJ-NP-Z2-9]{8}$/, { message: '连接码格式不正确' })
  code: string;
}
