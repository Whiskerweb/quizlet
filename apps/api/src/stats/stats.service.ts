import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getUserStats(userId: string) {
    let stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      // Create if doesn't exist
      stats = await this.prisma.userStats.create({
        data: { userId },
      });
    }

    // Get recent sessions
    const recentSessions = await this.prisma.studySession.findMany({
      where: { userId, completed: true },
      take: 10,
      orderBy: { completedAt: 'desc' },
      include: {
        set: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return {
      ...stats,
      recentSessions,
    };
  }

  async getSetStats(setId: string) {
    const set = await this.prisma.set.findUnique({
      where: { id: setId },
    });

    if (!set) {
      throw new NotFoundException('Set not found');
    }

    let stats = await this.prisma.setStats.findUnique({
      where: { setId },
    });

    if (!stats) {
      stats = await this.prisma.setStats.create({
        data: { setId },
      });
    }

    return stats;
  }

  async getSessions(userId: string, limit: number = 20) {
    return this.prisma.studySession.findMany({
      where: { userId, completed: true },
      take: limit,
      orderBy: { completedAt: 'desc' },
      include: {
        set: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }
}











