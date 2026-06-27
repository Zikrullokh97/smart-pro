import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateReport(generateReportDto: any, user: any) {
    const { type, filters } = generateReportDto;
    
    switch (type) {
      case 'attendance':
        return this.getAttendanceReport(user, filters);
      case 'grades':
        return this.getGradesReport(user, filters);
      case 'students':
        return this.getStudentsReport(user, filters);
      default:
        throw new Error('Invalid report type');
    }
  }

  async getAttendanceReport(user: any, filters?: any) {
    const where: any = {};
    
    if (user.roles.includes('teacher') || user.roles.includes('class_teacher')) {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: user.userId, isActive: true },
      });
      
      const classIds = userRoles.map(ur => ur.roleId);
      if (classIds.length > 0) {
        where.classId = { in: classIds };
      }
    }

    if (filters?.classId) {
      where.classId = filters.classId;
    }
    
    if (filters?.startDate && filters?.endDate) {
      where.date = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    const attendance = await this.prisma.attendance.findMany({
      where,
      include: {
        student: true,
        class: true,
      },
    });

    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      late: attendance.filter(a => a.status === 'LATE').length,
      excused: attendance.filter(a => a.status === 'EXCUSED').length,
    };

    return {
      data: attendance,
      stats,
    };
  }

  async getGradesReport(user: any, filters?: any) {
    const where: any = {};
    
    if (user.roles.includes('teacher') || user.roles.includes('class_teacher')) {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: user.userId, isActive: true },
      });
      
      const classIds = userRoles.map(ur => ur.roleId);
      if (classIds.length > 0) {
        where.classId = { in: classIds };
      }
    }

    if (filters?.classId) {
      where.classId = filters.classId;
    }
    
    if (filters?.subjectId) {
      where.subjectId = filters.subjectId;
    }
    
    if (filters?.term) {
      where.term = filters.term;
    }

    const grades = await this.prisma.grade.findMany({
      where,
      include: {
        student: true,
        class: true,
      },
    });

    const stats = {
      total: grades.length,
      average: grades.reduce((sum, g) => sum + g.value, 0) / grades.length || 0,
      highest: Math.max(...grades.map(g => g.value)),
      lowest: Math.min(...grades.map(g => g.value)),
    };

    return {
      data: grades,
      stats,
    };
  }

  async getStudentsReport(user: any, filters?: any) {
    const where: any = {};
    
    if (user.roles.includes('teacher') || user.roles.includes('class_teacher')) {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: user.userId, isActive: true },
      });
      
      const classIds = userRoles.map(ur => ur.roleId);
      if (classIds.length > 0) {
        where.classId = { in: classIds };
      }
    }

    if (filters?.classId) {
      where.classId = filters.classId;
    }

    const students = await this.prisma.student.findMany({
      where,
      include: {
        class: true,
        school: true,
        grades: true,
        attendances: true,
      },
    });

    const stats = {
      total: students.length,
      male: students.filter(s => s.gender === 'male').length,
      female: students.filter(s => s.gender === 'female').length,
    };

    return {
      data: students,
      stats,
    };
  }
}