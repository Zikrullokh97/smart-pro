import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async create(createScheduleDto: any, createdBy: string) {
    return this.prisma.schedule.create({
      data: {
        ...createScheduleDto,
        teacherId: createdBy,
      },
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
    });
  }

  async findAll(user: any) {
    const where: any = {};
    
    if (user.roles.includes('teacher') || user.roles.includes('class_teacher')) {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: user.userId, isActive: true },
        select: { scope: true },
      });
      
      const classIds = userRoles.flatMap(ur => ur.scope?.classIds || []);
      if (classIds.length > 0) {
        where.classId = { in: classIds };
      }
      
      where.teacherId = user.userId;
    }
    
    if (user.roles.includes('student')) {
      const student = await this.prisma.student.findUnique({
        where: { id: user.scope?.studentId },
        select: { classId: true },
      });
      where.classId = student?.classId;
    }
    
    if (user.roles.includes('parent')) {
      const studentParents = await this.prisma.studentParent.findMany({
        where: { parentId: user.userId },
        select: { studentId: true },
      });
      const studentIds = studentParents.map(sp => sp.studentId);
      const students = await this.prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: { classId: true },
      });
      const classIds = students.map(s => s.classId);
      where.classId = { in: classIds };
    }

    return this.prisma.schedule.findMany({
      where,
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
      orderBy: {
        dayOfWeek: 'asc',
      },
    });
  }

  async findOne(id: string, user: any) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return schedule;
  }

  async update(id: string, updateScheduleDto: any, user: any) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return this.prisma.schedule.update({
      where: { id },
      data: updateScheduleDto,
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
    });
  }

  async remove(id: string, user: any) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    await this.prisma.schedule.delete({
      where: { id },
    });

    return { message: 'Schedule deleted successfully' };
  }

  async getClassSchedule(classId: string) {
    return this.prisma.schedule.findMany({
      where: { classId, isActive: true },
      include: {
        subject: true,
        teacher: true,
      },
      orderBy: {
        dayOfWeek: 'asc',
        startTime: 'asc',
      },
    });
  }

  async getTeacherSchedule(teacherId: string) {
    return this.prisma.schedule.findMany({
      where: { teacherId, isActive: true },
      include: {
        class: true,
        subject: true,
      },
      orderBy: {
        dayOfWeek: 'asc',
        startTime: 'asc',
      },
    });
  }
}