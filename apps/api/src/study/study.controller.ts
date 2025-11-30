import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { StudyService } from './study.service';
import { StartSessionDto } from './dto/start-session.dto';
import { AnswerFlashcardDto } from './dto/answer-flashcard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('study')
@UseGuards(JwtAuthGuard)
export class StudyController {
  constructor(private readonly studyService: StudyService) {}

  @Post('sessions')
  startSession(@CurrentUser() user: any, @Body() dto: StartSessionDto) {
    return this.studyService.startSession(user.id, dto);
  }

  @Post('sessions/:id/answers')
  submitAnswer(
    @Param('id') sessionId: string,
    @CurrentUser() user: any,
    @Body() dto: AnswerFlashcardDto
  ) {
    return this.studyService.submitAnswer(sessionId, user.id, dto);
  }

  @Patch('sessions/:id/complete')
  completeSession(@Param('id') sessionId: string, @CurrentUser() user: any) {
    return this.studyService.completeSession(sessionId, user.id);
  }

  @Get('sessions/:id')
  getSession(@Param('id') sessionId: string, @CurrentUser() user: any) {
    return this.studyService.getSession(sessionId, user.id);
  }
}






