import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async create(createAttendanceDto: any, recordedBy: string) {
    return this.prisma.attendance.create({
      data: {
        ...createAttendanceDto,
        recordedBy,
      },
      include: {
        student: true,
        class: true,
      },
    });
  }

  async findAll(user: any) {
    const where: any = {};
    
    if (user.roles.includes('teacher') || user.roles.includes('class_teacher')) {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: user.userId, isActive: true },
      }) as any[];
      
      const classIds = userRoles.flatMap(ur => ur.scope?.classIds || []);
      if (classIds.length > 0) {
        where.classId = { in: classIds };
      }
    }
    
    if (user.roles.includes('parent')) {
      const studentParents = await this.prisma.studentParent.findMany({
        where: { parentId: user.userId },
        select: { studentId: true },
      });
      const studentIds = studentParents.map(sp => sp.studentId);
      where.studentId = { in: studentIds };
    }
    
    if (user.roles.includes('student')) {
      where.studentId = user.scope?.studentId;
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        student: true,
        class: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findOne(id: string, user: any) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        student: true,
        class: true,
      },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    return attendance;
  }

  async update(id: string, updateAttendanceDto: any, user: any) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    return this.prisma.attendance.update({
      where: { id },
      data: updateAttendanceDto,
      include: {
        student: true,
        class: true,
      },
    });
  }

  async remove(id: string, user: any) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    await this.prisma.attendance.delete({
      where: { id },
    });

    return { message: 'Attendance record deleted successfully' };
  }

  async getStudentAttendance(studentId: string, user: any) {
    return this.prisma.attendance.findMany({
      where: { studentId },
      include: {
        class: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async getClassAttendance(classId: string, date: string, user: any) {
    return this.prisma.attendance.findMany({
      where: {
        classId,
        date: new Date(date),
      },
      include: {
        student: true,
      },
      orderBy: {
        student: {
          lastName: 'asc',
        },
      },
    });
  }
}
