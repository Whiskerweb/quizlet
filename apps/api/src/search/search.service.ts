import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchPublicSets(query: string, limit: number = 20, offset: number = 0) {
    const where = {
      isPublic: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        { description: { contains: query, mode: 'insensitive' as const } },
        { tags: { has: query } },
      ],
    };

    const [sets, total] = await Promise.all([
      this.prisma.set.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [
          { stats: { views: 'desc' } },
          { createdAt: 'desc' },
        ],
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          stats: true,
          _count: {
            select: {
              flashcards: true,
            },
          },
        },
      }),
      this.prisma.set.count({ where }),
    ]);

    return {
      sets,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    };
  }
}









