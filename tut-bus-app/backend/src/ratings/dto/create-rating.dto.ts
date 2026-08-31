import { ArrayMaxSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateRatingDto {
  @IsString() @IsNotEmpty() tripId: string;

  @IsInt() @Min(1) @Max(5) score: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  tags?: string[];

  @IsOptional() @IsString() @MaxLength(500) comment?: string;
}
