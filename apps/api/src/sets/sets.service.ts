import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSetDto } from './dto/create-set.dto';
import { UpdateSetDto } from './dto/update-set.dto';
import { QuerySetDto } from './dto/query-set.dto';

@Injectable()
export class SetsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateSetDto) {
    const set = await this.prisma.set.create({
      data: {
        ...dto,
        userId,
        isPublic: dto.isPublic ?? false,
        tags: dto.tags ?? [],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            flashcards: true,
          },
        },
      },
    });

    // Create set stats
    await this.prisma.setStats.create({
      data: {
        setId: set.id,
      },
    });

    return set;
  }

  async findAll(query: QuerySetDto) {
    const { page = 1, limit = 20, userId, isPublic, search, tag } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tag) {
      where.tags = { has: tag };
    }

    const [sets, total] = await Promise.all([
      this.prisma.set.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              flashcards: true,
            },
          },
          stats: true,
        },
      }),
      this.prisma.set.count({ where }),
    ]);

    return {
      sets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const set = await this.prisma.set.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        flashcards: {
          orderBy: { order: 'asc' },
        },
        stats: true,
        _count: {
          select: {
            flashcards: true,
          },
        },
      },
    });

    if (!set) {
      throw new NotFoundException('Set not found');
    }

    // Increment views if public
    if (set.isPublic && set.stats) {
      await this.prisma.setStats.update({
        where: { setId: set.id },
        data: { views: { increment: 1 } },
      });
    }

    return set;
  }

  async findByShareId(shareId: string) {
    const set = await this.prisma.set.findUnique({
      where: { shareId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        flashcards: {
          orderBy: { order: 'asc' },
        },
        stats: true,
        _count: {
          select: {
            flashcards: true,
          },
        },
      },
    });

    if (!set) {
      throw new NotFoundException('Set not found');
    }

    // Increment views
    if (set.stats) {
      await this.prisma.setStats.update({
        where: { setId: set.id },
        data: { views: { increment: 1 } },
      });
    }

    return set;
  }

  async update(id: string, userId: string, dto: UpdateSetDto) {
    const set = await this.prisma.set.findUnique({
      where: { id },
    });

    if (!set) {
      throw new NotFoundException('Set not found');
    }

    if (set.userId !== userId) {
      throw new ForbiddenException('You can only update your own sets');
    }

    return this.prisma.set.update({
      where: { id },
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            flashcards: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const set = await this.prisma.set.findUnique({
      where: { id },
    });

    if (!set) {
      throw new NotFoundException('Set not found');
    }

    if (set.userId !== userId) {
      throw new ForbiddenException('You can only delete your own sets');
    }

    await this.prisma.set.delete({
      where: { id },
    });

    return { message: 'Set deleted successfully' };
  }

  async duplicate(id: string, userId: string) {
    const originalSet = await this.prisma.set.findUnique({
      where: { id },
      include: {
        flashcards: true,
      },
    });

    if (!originalSet) {
      throw new NotFoundException('Set not found');
    }

    // Create new set
    const newSet = await this.prisma.set.create({
      data: {
        title: `${originalSet.title} (Copy)`,
        description: originalSet.description,
        isPublic: false,
        userId,
        tags: originalSet.tags,
        language: originalSet.language,
        flashcards: {
          create: originalSet.flashcards.map((card) => ({
            front: card.front,
            back: card.back,
            imageUrl: card.imageUrl,
            audioUrl: card.audioUrl,
            order: card.order,
          })),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            flashcards: true,
          },
        },
      },
    });

    // Create stats for new set
    await this.prisma.setStats.create({
      data: {
        setId: newSet.id,
      },
    });

    return newSet;
  }
}

