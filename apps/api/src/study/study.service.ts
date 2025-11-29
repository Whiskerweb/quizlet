import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartSessionDto } from './dto/start-session.dto';
import { AnswerFlashcardDto } from './dto/answer-flashcard.dto';

@Injectable()
export class StudyService {
  constructor(private prisma: PrismaService) {}

  async startSession(userId: string, dto: StartSessionDto) {
    // Verify set exists
    const set = await this.prisma.set.findUnique({
      where: { id: dto.setId },
      include: {
        flashcards: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!set) {
      throw new NotFoundException('Set not found');
    }

    if (set.flashcards.length === 0) {
      throw new NotFoundException('Set has no flashcards');
    }

    // Create session
    const session = await this.prisma.studySession.create({
      data: {
        userId,
        setId: dto.setId,
        mode: dto.mode,
        totalCards: set.flashcards.length,
      },
      include: {
        set: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Increment studies count
    const setStats = await this.prisma.setStats.findUnique({
      where: { setId: set.id },
    });
    
    if (setStats) {
      await this.prisma.setStats.update({
        where: { setId: set.id },
        data: { studies: { increment: 1 } },
      });
    } else {
      // Create stats if doesn't exist
      await this.prisma.setStats.create({
        data: { setId: set.id, studies: 1 },
      });
    }

    return session;
  }

  async submitAnswer(sessionId: string, userId: string, dto: AnswerFlashcardDto) {
    // Verify session
    const session = await this.prisma.studySession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new NotFoundException('Session not found');
    }

    if (session.completed) {
      throw new NotFoundException('Session already completed');
    }

    // Create answer
    await this.prisma.answer.create({
      data: {
        sessionId,
        flashcardId: dto.flashcardId,
        isCorrect: dto.isCorrect,
        timeSpent: dto.timeSpent,
      },
    });

    return { message: 'Answer submitted' };
  }

  async completeSession(sessionId: string, userId: string) {
    // Verify session
    const session = await this.prisma.studySession.findUnique({
      where: { id: sessionId },
      include: {
        answers: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new NotFoundException('Session not found');
    }

    if (session.completed) {
      return session;
    }

    // Calculate score
    const correctAnswers = session.answers.filter((a) => a.isCorrect).length;
    const totalAnswers = session.answers.length;
    const score = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    // Update session
    const updatedSession = await this.prisma.studySession.update({
      where: { id: sessionId },
      data: {
        completed: true,
        score,
        completedAt: new Date(),
      },
      include: {
        set: {
          select: {
            id: true,
            title: true,
          },
        },
        answers: {
          include: {
            flashcard: {
              select: {
                id: true,
                front: true,
                back: true,
              },
            },
          },
        },
      },
    });

    // Update user stats
    const userStats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (userStats) {
      const totalSessions = userStats.totalSessions + 1;
      const totalStudyTime = userStats.totalStudyTime + (session.answers.reduce((acc, a) => acc + (a.timeSpent || 0), 0) / 60000); // Convert to minutes
      const averageScore = ((userStats.averageScore * (totalSessions - 1)) + score) / totalSessions;

      await this.prisma.userStats.update({
        where: { userId },
        data: {
          totalSessions,
          totalStudyTime: Math.round(totalStudyTime),
          averageScore: Math.round(averageScore * 100) / 100,
        },
      });
    }

    // Update set stats
    const setStats = await this.prisma.setStats.findUnique({
      where: { setId: session.setId },
    });

    if (setStats) {
      const totalStudies = setStats.studies;
      const newAverageScore = ((setStats.averageScore * totalStudies) + score) / (totalStudies + 1);

      await this.prisma.setStats.update({
        where: { setId: session.setId },
        data: {
          averageScore: Math.round(newAverageScore * 100) / 100,
        },
      });
    }

    return updatedSession;
  }

  async getSession(sessionId: string, userId: string) {
    const session = await this.prisma.studySession.findUnique({
      where: { id: sessionId },
      include: {
        set: {
          select: {
            id: true,
            title: true,
          },
        },
        answers: {
          include: {
            flashcard: {
              select: {
                id: true,
                front: true,
                back: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }
}

