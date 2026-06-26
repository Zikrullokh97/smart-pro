import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiCopilotService {
  constructor(private prisma: PrismaService) {}

  async createSuggestion(createSuggestionDto: any, user: any) {
    const agentType = createSuggestionDto.agentType;
    
    if (!this.hasValidRole(user.roles, agentType)) {
      throw new ForbiddenException('Invalid agent type for your role');
    }

    return this.prisma.aIAction.create({
      data: {
        ...createSuggestionDto,
        userId: user.userId,
        agentType: agentType,
        status: 'pending',
      },
      include: {
        user: true,
      },
    });
  }

  async getSuggestions(userId: string) {
    return this.prisma.aIAction.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSuggestion(id: string, userId: string) {
    const suggestion = await this.prisma.aIAction.findFirst({
      where: { id, userId },
      include: {
        user: true,
      },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    return suggestion;
  }

  async approveSuggestion(id: string, userId: string) {
    const suggestion = await this.prisma.aIAction.findFirst({
      where: { id, userId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    return this.prisma.aIAction.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });
  }

  async rejectSuggestion(id: string, userId: string) {
    const suggestion = await this.prisma.aIAction.findFirst({
      where: { id, userId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    return this.prisma.aIAction.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });
  }

  async modifySuggestion(id: string, modifyDto: any, userId: string) {
    const suggestion = await this.prisma.aIAction.findFirst({
      where: { id, userId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    return this.prisma.aIAction.update({
      where: { id },
      data: {
        ...modifyDto,
        status: 'modified',
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });
  }

  private hasValidRole(roles: string[], agentType: string): boolean {
    const roleMap: Record<string, string[]> = {
      'director': ['director'],
      'academic': ['academic_head'],
      'teacher': ['teacher', 'class_teacher'],
      'class_teacher': ['class_teacher'],
      'parent': ['parent'],
      'student': ['student'],
    };

    const allowedRoles = roleMap[agentType] || [];
    return roles.some(role => allowedRoles.includes(role));
  }
}