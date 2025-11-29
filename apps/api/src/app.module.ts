import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SetsModule } from './sets/sets.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { StudyModule } from './study/study.module';
import { StatsModule } from './stats/stats.module';
import { SearchModule } from './search/search.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    SetsModule,
    FlashcardsModule,
    StudyModule,
    StatsModule,
    SearchModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
