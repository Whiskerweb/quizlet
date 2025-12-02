import { IsString, IsIn } from 'class-validator';

export class StartSessionDto {
  @IsString()
  setId: string;

  @IsString()
  @IsIn(['flashcard', 'quiz', 'writing', 'match'])
  mode: string;
}












