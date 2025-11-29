import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateFlashcardDto {
  @IsString()
  front: string;

  @IsString()
  back: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  audioUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}


