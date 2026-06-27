import { PrismaService } from '../prisma/prisma.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedData implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    console.log('Starting seed...');
    
    // Check if already seeded
    const existingUsers = await this.prisma.user.count();
    if (existingUsers > 0) {
      console.log('Database already seeded');
      return;
    }

    // Create permissions
    const permissions = await this.createPermissions();
    console.log('Permissions created');

    // Create roles
    const roles = await this.createRoles(permissions);
    console.log('Roles created');

    // Create school
    const school = await this.prisma.school.create({
      data: {
        name: 'Demo School',
        nameKy: 'Демо Мектеп',
        nameRu: 'Демо Школа',
        nameUz: 'Demo Maktab',
        address: 'Bishkek, Kyrgyzstan',
        phone: '+996 555 123 456',
        email: 'info@demoschool.kg',
      },
    });
    console.log('School created');

    // Create school settings
    await this.prisma.schoolSettings.create({
      data: {
        schoolId: school.id,
        academicYear: '2024-2025',
        currentTerm: 1,
        maxStudentsPerClass: 30,
        gradingSystem: '5-point',
        defaultLanguage: 'kg',
        timezone: 'Asia/Bishkek',
      },
    });

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await this.prisma.user.create({
      data: {
        email: 'admin@demoschool.kg',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        phone: '+996 555 000 001',
      },
    });

    // Assign director role to admin
    await this.prisma.userRole.create({
      data: {
        userId: admin.id,
        roleId: roles.director.id,
        isActive: true,
      },
    });

    // Create 20 teachers
    const teachers = [];
    for (let i = 1; i <= 20; i++) {
      const password = await bcrypt.hash('teacher123', 10);
      const teacher = await this.prisma.user.create({
        data: {
          email: `teacher${i}@demoschool.kg`,
          password,
          firstName: `Teacher ${i}`,
          lastName: `Surname ${i}`,
          phone: `+996 555 ${String(i).padStart(3, '0')} ${String(i * 10).padStart(3, '0')}`,
        },
      });

      await this.prisma.userRole.create({
        data: {
          userId: teacher.id,
          roleId: roles.teacher.id,
          isActive: true,
        },
      });

      teachers.push(teacher);
    }

    // Create 10 classes
    const classes = [];
    for (let i = 1; i <= 10; i++) {
      const classData = await this.prisma.class.create({
        data: {
          schoolId: school.id,
          name: `${i}-${Math.ceil(i / 2)}`,
          nameKy: `${i}-${Math.ceil(i / 2)}`,
          nameRu: `${i}-${Math.ceil(i / 2)}`,
          nameUz: `${i}-${Math.ceil(i / 2)}`,
          grade: i,
          section: String.fromCharCode(64 + (i % 2 || 2)),
          classTeacherId: teachers[i - 1]?.id,
          isActive: true,
        },
      });
      classes.push(classData);
    }

    // Create 100 students
    const students = [];
    for (let i = 1; i <= 100; i++) {
      const classIndex = (i - 1) % 10;
      const student = await this.prisma.student.create({
        data: {
          schoolId: school.id,
          classId: classes[classIndex].id,
          firstName: `Student ${i}`,
          lastName: `Surname ${i}`,
          firstNameKy: `Окуучу ${i}`,
          lastNameKy: `Фамилия ${i}`,
          dateOfBirth: new Date(2010 + (i % 5), (i % 12), (i % 28) + 1),
          gender: i % 2 === 0 ? 'male' : 'female',
          isActive: true,
        },
      });
      students.push(student);
    }

    // Create parent users and link to students
    for (let i = 1; i <= 50; i++) {
      const password = await bcrypt.hash('parent123', 10);
      const parent = await this.prisma.user.create({
        data: {
          email: `parent${i}@demoschool.kg`,
          password,
          firstName: `Parent ${i}`,
          lastName: `Surname ${i}`,
          phone: `+996 555 ${String(i + 50).padStart(3, '0')} ${String(i * 20).padStart(3, '0')}`,
        },
      });

      await this.prisma.userRole.create({
        data: {
          userId: parent.id,
          roleId: roles.parent.id,
          isActive: true,
        },
      });

      // Link parent to 2 students
      const studentIndex1 = (i - 1) * 2;
      const studentIndex2 = (i - 1) * 2 + 1;
      
      if (studentIndex1 < students.length) {
        await this.prisma.studentParent.create({
          data: {
            studentId: students[studentIndex1].id,
            parentId: parent.id,
            relationship: 'mother',
            isPrimary: true,
          },
        });
      }

      if (studentIndex2 < students.length) {
        await this.prisma.studentParent.create({
          data: {
            studentId: students[studentIndex2].id,
            parentId: parent.id,
            relationship: 'father',
            isPrimary: false,
          },
        });
      }
    }

    // Create 1000 attendance records
    const statuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const;
    for (let i = 0; i < 1000; i++) {
      const student = students[Math.floor(Math.random() * students.length)];
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      await this.prisma.attendance.create({
        data: {
          studentId: student.id,
          classId: student.classId,
          schoolId: school.id,
          date,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          recordedBy: teachers[Math.floor(Math.random() * teachers.length)].id,
        },
      });
    }

    // Create 500 grades
    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Kyrgyz', 'Russian', 'History'];
    for (let i = 0; i < 500; i++) {
      const student = students[Math.floor(Math.random() * students.length)];
      
      await this.prisma.grade.create({
        data: {
          studentId: student.id,
          classId: student.classId,
          subjectId: subjects[Math.floor(Math.random() * subjects.length)],
          schoolId: school.id,
          value: Math.floor(Math.random() * 3) + 3, // 3-5
          maxValue: 5,
          recordedBy: teachers[Math.floor(Math.random() * teachers.length)].id,
        },
      });
    }

    // Create 500 homework records
    for (let i = 0; i < 500; i++) {
      const classData = classes[Math.floor(Math.random() * classes.length)];
      
      await this.prisma.homework.create({
        data: {
          classId: classData.id,
          subjectId: subjects[Math.floor(Math.random() * subjects.length)],
          schoolId: school.id,
          title: `Homework ${i + 1}`,
          description: `Complete exercises ${i + 1}-${i + 10}`,
          dueDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
          createdBy: teachers[Math.floor(Math.random() * teachers.length)].id,
          isActive: true,
        },
      });
    }

    console.log('Seed completed successfully!');
    console.log('Admin credentials: admin@demoschool.kg / admin123');
    console.log('Teacher credentials: teacher1@demoschool.kg / teacher123');
    console.log('Parent credentials: parent1@demoschool.kg / parent123');
  }

  private async createPermissions() {
    const permissionData = [
      // Students
      { name: 'students.view', description: 'View students', module: 'students', action: 'view' },
      { name: 'students.create', description: 'Create students', module: 'students', action: 'create' },
      { name: 'students.update', description: 'Update students', module: 'students', action: 'update' },
      { name: 'students.delete', description: 'Delete students', module: 'students', action: 'delete' },
      
      // Teachers
      { name: 'teachers.view', description: 'View teachers', module: 'teachers', action: 'view' },
      { name: 'teachers.create', description: 'Create teachers', module: 'teachers', action: 'create' },
      { name: 'teachers.update', description: 'Update teachers', module: 'teachers', action: 'update' },
      { name: 'teachers.delete', description: 'Delete teachers', module: 'teachers', action: 'delete' },
      
      // Classes
      { name: 'classes.view', description: 'View classes', module: 'classes', action: 'view' },
      { name: 'classes.create', description: 'Create classes', module: 'classes', action: 'create' },
      { name: 'classes.update', description: 'Update classes', module: 'classes', action: 'update' },
      { name: 'classes.delete', description: 'Delete classes', module: 'classes', action: 'delete' },
      
      // Attendance
      { name: 'attendance.view', description: 'View attendance', module: 'attendance', action: 'view' },
      { name: 'attendance.create', description: 'Create attendance', module: 'attendance', action: 'create' },
      { name: 'attendance.update', description: 'Update attendance', module: 'attendance', action: 'update' },
      { name: 'attendance.manage', description: 'Manage attendance', module: 'attendance', action: 'manage' },
      
      // Grades
      { name: 'grades.view', description: 'View grades', module: 'grades', action: 'view' },
      { name: 'grades.create', description: 'Create grades', module: 'grades', action: 'create' },
      { name: 'grades.update', description: 'Update grades', module: 'grades', action: 'update' },
      { name: 'grades.delete', description: 'Delete grades', module: 'grades', action: 'delete' },
      
      // Homework
      { name: 'homework.view', description: 'View homework', module: 'homework', action: 'view' },
      { name: 'homework.create', description: 'Create homework', module: 'homework', action: 'create' },
      { name: 'homework.update', description: 'Update homework', module: 'homework', action: 'update' },
      { name: 'homework.delete', description: 'Delete homework', module: 'homework', action: 'delete' },
      
      // Schedule
      { name: 'schedule.view', description: 'View schedule', module: 'schedule', action: 'view' },
      { name: 'schedule.create', description: 'Create schedule', module: 'schedule', action: 'create' },
      { name: 'schedule.update', description: 'Update schedule', module: 'schedule', action: 'update' },
      { name: 'schedule.delete', description: 'Delete schedule', module: 'schedule', action: 'delete' },
      
      // Reports
      { name: 'reports.view', description: 'View reports', module: 'reports', action: 'view' },
      { name: 'reports.generate', description: 'Generate reports', module: 'reports', action: 'generate' },
      { name: 'reports.export', description: 'Export reports', module: 'reports', action: 'export' },
      
      // Notifications
      { name: 'notifications.view', description: 'View notifications', module: 'notifications', action: 'view' },
      { name: 'notifications.create', description: 'Create notifications', module: 'notifications', action: 'create' },
      { name: 'notifications.delete', description: 'Delete notifications', module: 'notifications', action: 'delete' },
      
      // Users
      { name: 'users.view', description: 'View users', module: 'users', action: 'view' },
      { name: 'users.create', description: 'Create users', module: 'users', action: 'create' },
      { name: 'users.update', description: 'Update users', module: 'users', action: 'update' },
      { name: 'users.delete', description: 'Delete users', module: 'users', action: 'delete' },
      
      // Roles
      { name: 'roles.view', description: 'View roles', module: 'roles', action: 'view' },
      { name: 'roles.create', description: 'Create roles', module: 'roles', action: 'create' },
      { name: 'roles.update', description: 'Update roles', module: 'roles', action: 'update' },
      { name: 'roles.delete', description: 'Delete roles', module: 'roles', action: 'delete' },
      
      // Permissions
      { name: 'permissions.view', description: 'View permissions', module: 'permissions', action: 'view' },
      
      // Parent Portal
      { name: 'parent_portal.view', description: 'View parent portal', module: 'parent_portal', action: 'view' },
      
      // Student Portal
      { name: 'student_portal.view', description: 'View student portal', module: 'student_portal', action: 'view' },
      
      // AI Copilot
      { name: 'ai_copilot.view', description: 'View AI copilot', module: 'ai_copilot', action: 'view' },
      { name: 'ai_copilot.use', description: 'Use AI copilot', module: 'ai_copilot', action: 'use' },
      { name: 'ai_copilot.approve', description: 'Approve AI suggestions', module: 'ai_copilot', action: 'approve' },
      
      // Sensitive Data
      { name: 'sensitive_data.view', description: 'View sensitive data', module: 'sensitive_data', action: 'view' },
      { name: 'sensitive_data.create', description: 'Create sensitive data', module: 'sensitive_data', action: 'create' },
      { name: 'sensitive_data.update', description: 'Update sensitive data', module: 'sensitive_data', action: 'update' },
      { name: 'sensitive_data.delete', description: 'Delete sensitive data', module: 'sensitive_data', action: 'delete' },
    ];

    const permissions: any = {};
    for (const perm of permissionData) {
      permissions[perm.name] = await this.prisma.permission.upsert({
        where: { name: perm.name },
        update: perm,
        create: perm,
      });
    }

    return permissions;
  }

  private async createRoles(permissions: any) {
    const roleData = {
      director: {
        name: 'director',
        nameKy: 'Директор',
        nameRu: 'Директор',
        nameUz: 'Direktor',
        description: 'School Director',
        permissions: [
          'students.view', 'students.create', 'students.update', 'students.delete',
          'teachers.view', 'teachers.create', 'teachers.update', 'teachers.delete',
          'classes.view', 'classes.create', 'classes.update', 'classes.delete',
          'attendance.view', 'attendance.manage',
          'grades.view', 'grades.create', 'grades.update', 'grades.delete',
          'homework.view', 'homework.create', 'homework.update', 'homework.delete',
          'schedule.view', 'schedule.create', 'schedule.update', 'schedule.delete',
          'reports.view', 'reports.generate', 'reports.export',
          'notifications.view', 'notifications.create', 'notifications.delete',
          'users.view', 'users.create', 'users.update', 'users.delete',
          'roles.view', 'roles.create', 'roles.update', 'roles.delete',
          'permissions.view',
          'sensitive_data.view', 'sensitive_data.create', 'sensitive_data.update', 'sensitive_data.delete',
        ],
      },
      vice_director: {
        name: 'vice_director',
        nameKy: 'Ортоңку директор',
        nameRu: 'Заместитель директора',
        nameUz: "O'quv ishlari bo'yicha direktor o'rinbosari",
        description: 'Vice Director',
        permissions: [
          'students.view', 'students.create', 'students.update',
          'teachers.view', 'teachers.create', 'teachers.update',
          'classes.view', 'classes.create', 'classes.update',
          'attendance.view', 'attendance.manage',
          'grades.view', 'grades.create', 'grades.update',
          'homework.view', 'homework.create', 'homework.update',
          'schedule.view', 'schedule.create', 'schedule.update',
          'reports.view', 'reports.generate', 'reports.export',
          'notifications.view', 'notifications.create',
          'sensitive_data.view', 'sensitive_data.create', 'sensitive_data.update',
        ],
      },
      academic_head: {
        name: 'academic_head',
        nameKy: 'Окуу бөлүмүнүн башчысы',
        nameRu: 'Завуч по учебной части',
        nameUz: "O'quv bo'limi boshlig'i",
        description: 'Academic Head',
        permissions: [
          'students.view',
          'teachers.view',
          'classes.view',
          'attendance.view', 'attendance.manage',
          'grades.view', 'grades.create', 'grades.update',
          'homework.view', 'homework.create', 'homework.update',
          'schedule.view', 'schedule.create', 'schedule.update',
          'reports.view', 'reports.generate',
          'notifications.view', 'notifications.create',
          'sensitive_data.view',
        ],
      },
      school_admin: {
        name: 'school_admin',
        nameKy: 'Администратор',
        nameRu: 'Администратор',
        nameUz: 'Administrator',
        description: 'School Administrator',
        permissions: [
          'students.view', 'students.create', 'students.update',
          'teachers.view', 'teachers.create', 'teachers.update',
          'classes.view', 'classes.create', 'classes.update',
          'attendance.view',
          'grades.view', 'grades.create', 'grades.update',
          'homework.view', 'homework.create', 'homework.update',
          'schedule.view',
          'reports.view', 'reports.generate',
          'notifications.view', 'notifications.create',
          'users.view', 'users.create', 'users.update',
        ],
      },
      teacher: {
        name: 'teacher',
        nameKy: 'Мугалим',
        nameRu: 'Учитель',
        nameUz: "O'qituvchi",
        description: 'Teacher',
        permissions: [
          'students.view',
          'classes.view',
          'attendance.view', 'attendance.create', 'attendance.update',
          'grades.view', 'grades.create', 'grades.update',
          'homework.view', 'homework.create', 'homework.update',
          'schedule.view',
          'reports.view',
          'notifications.view',
        ],
      },
      class_teacher: {
        name: 'class_teacher',
        nameKy: 'Класс жетекчиси',
        nameRu: 'Классный руководитель',
        nameUz: 'Sinf rahbari',
        description: 'Class Teacher',
        permissions: [
          'students.view', 'students.update',
          'classes.view',
          'attendance.view', 'attendance.create', 'attendance.update', 'attendance.manage',
          'grades.view', 'grades.create', 'grades.update',
          'homework.view', 'homework.create', 'homework.update',
          'schedule.view',
          'reports.view',
          'notifications.view', 'notifications.create',
          'parent_portal.view',
        ],
      },
      psychologist: {
        name: 'psychologist',
        nameKy: 'Психолог',
        nameRu: 'Психолог',
        nameUz: 'Psixolog',
        description: 'Psychologist',
        permissions: [
          'students.view',
          'sensitive_data.view', 'sensitive_data.create', 'sensitive_data.update',
          'notifications.view',
        ],
      },
      social_worker: {
        name: 'social_worker',
        nameKy: 'Социалдык ишмер',
        nameRu: 'Социальный работник',
        nameUz: 'Ijtimoiy ishchi',
        description: 'Social Worker',
        permissions: [
          'students.view',
          'sensitive_data.view', 'sensitive_data.create', 'sensitive_data.update',
          'notifications.view',
        ],
      },
      librarian: {
        name: 'librarian',
        nameKy: 'Китепканачы',
        nameRu: 'Библиотекарь',
        nameUz: 'Kutubxonachi',
        description: 'Librarian',
        permissions: [
          'students.view',
          'notifications.view',
        ],
      },
      accountant: {
        name: 'accountant',
        nameKy: 'Бухгалтер',
        nameRu: 'Бухгалтер',
        nameUz: 'Buxgalter',
        description: 'Accountant',
        permissions: [
          'reports.view', 'reports.generate', 'reports.export',
          'notifications.view',
        ],
      },
      medical_staff: {
        name: 'medical_staff',
        nameKy: 'Медицина кызматкери',
        nameRu: 'Медицинский работник',
        nameUz: 'Tibbiyot xodimi',
        description: 'Medical Staff',
        permissions: [
          'students.view',
          'sensitive_data.view', 'sensitive_data.create', 'sensitive_data.update',
          'notifications.view',
        ],
      },
      parent: {
        name: 'parent',
        nameKy: 'Ата-эне',
        nameRu: 'Родитель',
        nameUz: 'Ota-ona',
        description: 'Parent',
        permissions: [
          'parent_portal.view',
          'attendance.view',
          'grades.view',
          'homework.view',
          'schedule.view',
          'notifications.view',
        ],
      },
      student: {
        name: 'student',
        nameKy: 'Окуучу',
        nameRu: 'Ученик',
        nameUz: "O'quvchi",
        description: 'Student',
        permissions: [
          'student_portal.view',
          'attendance.view',
          'grades.view',
          'homework.view',
          'schedule.view',
          'notifications.view',
        ],
      },
    };

    const roles: any = {};
    for (const [key, role] of Object.entries(roleData)) {
      const { permissions: _, ...roleDataWithoutPermissions } = role;
      const createdRole = await this.prisma.role.create({
        data: {
          ...roleDataWithoutPermissions,
          isSystem: true,
        },
      });

      // Assign permissions to role
      for (const permName of role.permissions) {
        const permission = permissions[permName];
        if (permission) {
          await this.prisma.rolePermission.create({
            data: {
              roleId: createdRole.id,
              permissionId: permission.id,
            },
          });
        }
      }

      roles[key] = createdRole;
    }

    return roles;
  }
}