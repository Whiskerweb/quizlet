import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { ImportFlashcardsDto } from './dto/import-flashcards.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('sets/:setId/flashcards')
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Param('setId') setId: string,
    @CurrentUser() user: any,
    @Body() createFlashcardDto: CreateFlashcardDto
  ) {
    return this.flashcardsService.create(setId, user.id, createFlashcardDto);
  }

  @Get()
  findAll(@Param('setId') setId: string) {
    return this.flashcardsService.findAll(setId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.flashcardsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateFlashcardDto: UpdateFlashcardDto
  ) {
    return this.flashcardsService.update(id, user.id, updateFlashcardDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.flashcardsService.remove(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('reorder')
  reorder(
    @Param('setId') setId: string,
    @CurrentUser() user: any,
    @Body('flashcardIds') flashcardIds: string[]
  ) {
    return this.flashcardsService.reorder(setId, user.id, flashcardIds);
  }

  @UseGuards(JwtAuthGuard)
  @Post('import')
  import(
    @Param('setId') setId: string,
    @CurrentUser() user: any,
    @Body() importFlashcardsDto: ImportFlashcardsDto
  ) {
    return this.flashcardsService.import(setId, user.id, importFlashcardsDto);
  }
}



