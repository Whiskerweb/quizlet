import { IsString, IsBoolean, IsOptional, IsInt, Min } from 'class-validator';

export class AnswerFlashcardDto {
  @IsString()
  flashcardId: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpent?: number; // milliseconds
}












