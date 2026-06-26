import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, userId: string) {
    return this.prisma.health.create({
      data: {
        ...data,
        recordedBy: userId,
      },
    })
  }

  async findAll(user: any) {
    const where: any = {}
    
    if (user.roles.includes('student')) {
      where.studentId = user.scope?.studentId
    } else if (user.roles.includes('parent')) {
      // Parent can view their children's health records
      const studentParents = await this.prisma.studentParent.findMany({
        where: { parentId: user.userId },
        select: { studentId: true },
      })
      const studentIds = studentParents.map(sp => sp.studentId)
      where.studentId = { in: studentIds }
    }

    return this.prisma.health.findMany({
      where,
      include: {
        student: true,
      },
    })
  }

  async findOne(id: string, user: any) {
    return this.prisma.health.findUnique({
      where: { id },
      include: {
        student: true,
      },
    })
  }

  async update(id: string, data: any, user: any) {
    return this.prisma.health.update({
      where: { id },
      data,
    })
  }

  async remove(id: string, user: any) {
    await this.prisma.health.delete({
      where: { id },
    })
    return { message: 'Health record deleted successfully' }
  }
}