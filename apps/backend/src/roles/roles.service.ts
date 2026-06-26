import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: any, createdBy: string) {
    return this.prisma.role.create({
      data: {
        ...createRoleDto,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findAll() {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return roles;
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async update(id: string, updateRoleDto: any, updatedBy: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async remove(id: string, deletedBy: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    await this.prisma.role.delete({
      where: { id },
    });

    return { message: 'Role deleted successfully' };
  }

  async seedDefaultRoles() {
    const defaultRoles = [
      {
        name: 'director',
        nameKy: 'Директор',
        nameRu: 'Директор',
        nameUz: "Direktor",
        description: 'School Director',
        isSystem: true,
      },
      {
        name: 'vice_director',
        nameKy: 'Ортоңку директор',
        nameRu: 'Заместитель директора',
        nameUz: "Bo'lim boshlig'i",
        description: 'Vice Director',
        isSystem: true,
      },
      {
        name: 'academic_head',
        nameKy: 'Окуу иштери боюнча директор',
        nameRu: 'Учебный директор',
        nameUz: "O'quv ishlari bo'yicha direktor",
        description: 'Academic Head',
        isSystem: true,
      },
      {
        name: 'school_admin',
        nameKy: 'Мекеме администратору',
        nameRu: 'Администратор школы',
        nameUz: "Maktab administratori",
        description: 'School Administrator',
        isSystem: true,
      },
      {
        name: 'teacher',
        nameKy: 'Мугалим',
        nameRu: 'Учитель',
        nameUz: "O'qituvchi",
        description: 'Teacher',
        isSystem: true,
      },
      {
        name: 'class_teacher',
        nameKy: 'Класс жетекчиси',
        nameRu: 'Классный руководитель',
        nameUz: "Sinf rahbari",
        description: 'Class Teacher',
        isSystem: true,
      },
      {
        name: 'psychologist',
        nameKy: 'Психолог',
        nameRu: 'Психолог',
        nameUz: "Psixolog",
        description: 'Psychologist',
        isSystem: true,
      },
      {
        name: 'social_worker',
        nameKy: 'Социалдык ишмер',
        nameRu: 'Социальный работник',
        nameUz: "Ijtimoiy ishchi",
        description: 'Social Worker',
        isSystem: true,
      },
      {
        name: 'librarian',
        nameKy: 'Китепканачы',
        nameRu: 'Библиотекарь',
        nameUz: "Kutubxonachi",
        description: 'Librarian',
        isSystem: true,
      },
      {
        name: 'accountant',
        nameKy: 'Бухгалтер',
        nameRu: 'Бухгалтер',
        nameUz: "Buxgalter",
        description: 'Accountant',
        isSystem: true,
      },
      {
        name: 'medical_staff',
        nameKy: 'Медицина кызматкери',
        nameRu: 'Медицинский работник',
        nameUz: "Tibbiyot xodimi",
        description: 'Medical Staff',
        isSystem: true,
      },
      {
        name: 'parent',
        nameKy: 'Ата-эне',
        nameRu: 'Родитель',
        nameUz: "Ota-ona",
        description: 'Parent',
        isSystem: true,
      },
      {
        name: 'student',
        nameKy: 'Окуучу',
        nameRu: 'Ученик',
        nameUz: "O'quvchi",
        description: 'Student',
        isSystem: true,
      },
    ];

    for (const roleData of defaultRoles) {
      await this.prisma.role.upsert({
        where: { name: roleData.name },
        update: {},
        create: roleData,
      });
    }

    return { message: 'Default roles seeded successfully' };
  }
}