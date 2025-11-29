import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';

@Injectable()
export class FlashcardsService {
  constructor(private prisma: PrismaService) {}

  async create(setId: string, userId: string, dto: CreateFlashcardDto) {
    // Verify set ownership
    const set = await this.prisma.set.findUnique({
      where: { id: setId },
    });

    if (!set) {
      throw new NotFoundException('Set not found');
    }

    if (set.userId !== userId) {
      throw new ForbiddenException('You can only add flashcards to your own sets');
    }

    // Get max order
    const maxOrder = await this.prisma.flashcard.findFirst({
      where: { setId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = dto.order ?? (maxOrder ? maxOrder.order + 1 : 0);

    return this.prisma.flashcard.create({
      data: {
        ...dto,
        setId,
        order,
      },
    });
  }

  async findAll(setId: string) {
    return this.prisma.flashcard.findMany({
      where: { setId },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const flashcard = await this.prisma.flashcard.findUnique({
      where: { id },
    });

    if (!flashcard) {
      throw new NotFoundException('Flashcard not found');
    }

    return flashcard;
  }

  async update(id: string, userId: string, dto: UpdateFlashcardDto) {
    const flashcard = await this.prisma.flashcard.findUnique({
      where: { id },
      include: { set: true },
    });

    if (!flashcard) {
      throw new NotFoundException('Flashcard not found');
    }

    if (flashcard.set.userId !== userId) {
      throw new ForbiddenException('You can only update flashcards in your own sets');
    }

    return this.prisma.flashcard.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    const flashcard = await this.prisma.flashcard.findUnique({
      where: { id },
      include: { set: true },
    });

    if (!flashcard) {
      throw new NotFoundException('Flashcard not found');
    }

    if (flashcard.set.userId !== userId) {
      throw new ForbiddenException('You can only delete flashcards from your own sets');
    }

    await this.prisma.flashcard.delete({
      where: { id },
    });

    return { message: 'Flashcard deleted successfully' };
  }

  async reorder(setId: string, userId: string, flashcardIds: string[]) {
    const set = await this.prisma.set.findUnique({
      where: { id: setId },
    });

    if (!set) {
      throw new NotFoundException('Set not found');
    }

    if (set.userId !== userId) {
      throw new ForbiddenException('You can only reorder flashcards in your own sets');
    }

    // Update order for each flashcard
    await Promise.all(
      flashcardIds.map((id, index) =>
        this.prisma.flashcard.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return { message: 'Flashcards reordered successfully' };
  }
}

