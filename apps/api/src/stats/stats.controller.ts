import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('user')
  getUserStats(@CurrentUser() user: any) {
    return this.statsService.getUserStats(user.id);
  }

  @Public()
  @Get('sets/:id')
  getSetStats(@Param('id') id: string) {
    return this.statsService.getSetStats(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  getSessions(
    @CurrentUser() user: any,
    @Query('limit') limit?: string
  ) {
    return this.statsService.getSessions(user.id, limit ? parseInt(limit) : 20);
  }
}

