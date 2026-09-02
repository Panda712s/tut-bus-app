import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  /** Either an https URL or a `data:image/...;base64,...` URI. */
  @IsOptional()
  @IsString()
  @MaxLength(6_000_000)
  profileImageUrl?: string;
}
