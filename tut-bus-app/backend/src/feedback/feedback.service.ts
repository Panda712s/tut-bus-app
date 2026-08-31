import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  create(studentId: string, dto: CreateFeedbackDto) {
    return this.prisma.feedback.create({ data: { studentId, ...dto } });
  }

  findMine(studentId: string) {
    return this.prisma.feedback.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } });
  }

  findAll() {
    return this.prisma.feedback.findMany({
      include: { student: { select: { id: true, fullName: true, studentNumber: true } }, trip: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
