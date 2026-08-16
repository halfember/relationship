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

export class CreatePairInviteDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  displayName: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 16)
  relationshipType: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  spaceName: string;

  @IsOptional()
  @IsDateString()
  anniversaryDate?: string;

  @IsOptional()
  @IsInt()
  relationshipId?: number;

}

export class CreateFamilySpaceDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  name: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class UpdateSpaceDto {
  @IsOptional()
  @IsString()
  @Length(1, 64)
  name?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class CreateSpaceInviteDto {
  @IsOptional()
  @IsInt()
  targetMemberId?: number;
}

export class AcceptSpaceInviteDto {
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

  @IsOptional()
  @IsString()
  @Length(1, 32)
  relationshipName?: string;
}

export class CreateSpaceMemberDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  displayName: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  relationLabel: string;

  @IsString()
  @IsIn(['ELDER', 'PEER', 'YOUNGER'])
  generation: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;
}

export class UpdateSpaceMemberDto {
  @IsOptional()
  @IsString()
  @Length(1, 32)
  displayName?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  relationLabel?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ELDER', 'PEER', 'YOUNGER'])
  generation?: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;
}

export class CreateSharedEventDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  title: string;

  @IsDateString()
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

export class CreateSharedMemoryDto {
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @Length(1, 5000)
  content?: string;

  @IsOptional()
  @IsDateString()
  memoryDate?: string;
}
