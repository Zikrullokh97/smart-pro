import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(createStudentDto: any, createdBy: string) {
    return this.prisma.student.create({
      data: createStudentDto,
      include: {
        class: true,
        parents: {
          include: {
            parent: true,
          },
        },
      },
    });
  }

  async findAll(user: any) {
    const isAdmin = user.roles.some(r => 
      ['director', 'vice_director', 'academic_head', 'school_admin'].includes(r)
    );
    
    if (isAdmin) {
      return this.prisma.student.findMany({
        include: {
          class: true,
          school: true,
        },
      });
    }
    
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
    }
    
    if (user.roles.includes('parent')) {
      const studentParents = await this.prisma.studentParent.findMany({
        where: { parentId: user.userId },
        select: { studentId: true },
      });
      const studentIds = studentParents.map(sp => sp.studentId);
      where.id = { in: studentIds };
    }
    
    if (user.roles.includes('student')) {
      where.id = user.scope?.studentId;
    }

    return this.prisma.student.findMany({
      where,
      include: {
        class: true,
        school: true,
      },
    });
  }

  async findOne(id: string, user: any) {
    const isAdmin = user.roles.some(r => 
      ['director', 'vice_director', 'academic_head', 'school_admin'].includes(r)
    );
    
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
        school: true,
        parents: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (!isAdmin) {
      if (user.roles.includes('parent')) {
        const hasAccess = await this.prisma.studentParent.findFirst({
          where: {
            studentId: id,
            parentId: user.userId,
          },
        });
        
        if (!hasAccess) {
          throw new ForbiddenException('Access denied');
        }
      }
      
      if (user.roles.includes('student')) {
        if (student.id !== user.scope?.studentId) {
          throw new ForbiddenException('Access denied');
        }
      }
    }

    return student;
  }

  async update(id: string, updateStudentDto: any, user: any) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.prisma.student.update({
      where: { id },
      data: updateStudentDto,
      include: {
        class: true,
        school: true,
      },
    });
  }

  async remove(id: string, user: any) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    await this.prisma.student.delete({
      where: { id },
    });

    return { message: 'Student deleted successfully' };
  }
}