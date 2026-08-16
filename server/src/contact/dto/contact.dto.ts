import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateContactInviteDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  displayName: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 16)
  relationshipType: string;

  @IsOptional()
  @IsString()
  @Length(1, 160)
  message?: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  relationshipName?: string;
}

export class AcceptContactInviteDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 32)
  token: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 16)
  relationshipType?: string;
}
