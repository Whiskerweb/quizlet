import { IsArray, ValidateNested, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

class ImportCardDto {
  @IsString()
  @MinLength(1)
  term: string;

  @IsString()
  @MinLength(1)
  definition: string;
}

export class ImportFlashcardsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportCardDto)
  cards: ImportCardDto[];
}









