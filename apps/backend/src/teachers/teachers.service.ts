import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async create(createTeacherDto: any, createdBy: string) {
    return this.prisma.user.create({
      data: {
        ...createTeacherDto,
        userRoles: {
          create: {
            roleId: createTeacherDto.roleId,
            scope: createTeacherDto.scope || {},
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findAll(user: any) {
    const teachers = await this.prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              name: 'teacher',
            },
            isActive: true,
          },
        },
      },
      include: {
        userRoles: {
          where: {
            isActive: true,
          },
          include: {
            role: true,
          },
        },
        teacherSubjects: {
          include: {
            subject: true,
          },
        },
      },
    });

    return teachers;
  }

  async findOne(id: string, user: any) {
    const teacher = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          where: {
            isActive: true,
          },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        teacherSubjects: {
          include: {
            subject: true,
          },
        },
        classSubjects: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async update(id: string, updateTeacherDto: any, user: any) {
    const teacher = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const { roleId, scope, ...updateData } = updateTeacherDto;

    if (roleId && scope) {
      await this.prisma.userRole.updateMany({
        where: {
          userId: id,
          roleId: roleId,
        },
        data: {
          scope,
        },
      });
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        userRoles: {
          where: {
            isActive: true,
          },
          include: {
            role: true,
          },
        },
      },
    });
  }

  async remove(id: string, user: any) {
    const teacher = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Teacher deleted successfully' };
  }

  async getTeacherSubjects(teacherId: string) {
    const subjects = await this.prisma.teacherSubject.findMany({
      where: { teacherId },
      include: {
        subject: true,
      },
    });

    return subjects;
  }

  async getTeacherClasses(teacherId: string) {
    const classSubjects = await this.prisma.classSubject.findMany({
      where: { teacherId },
      include: {
        class: true,
        subject: true,
      },
    });

    return classSubjects;
  }
}