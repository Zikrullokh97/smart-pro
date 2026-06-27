import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default school
  const school = await prisma.school.upsert({
    where: { id: 'default-school' },
    update: {},
    create: {
      id: 'default-school',
      name: 'EduSphere Pro School',
      nameKy: 'EduSphere Pro Мектеби',
      nameRu: 'EduSphere Pro Школа',
      nameUz: 'EduSphere Pro Maktab',
      address: '123 Education Street',
      phone: '+996 555 123 456',
      email: 'admin@edusphere.local',
      isActive: true,
    },
  });
  console.log('✅ School created:', school.name);

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { id: 'admin-role' },
    update: {},
    create: {
      id: 'admin-role',
      name: 'admin',
      nameKy: 'Администратор',
      nameRu: 'Администратор',
      nameUz: 'Administrator',
      description: 'System administrator with full access',
      isSystem: true,
    },
  });

  const teacherRole = await prisma.role.upsert({
    where: { id: 'teacher-role' },
    update: {},
    create: {
      id: 'teacher-role',
      name: 'teacher',
      nameKy: 'Мугалим',
      nameRu: 'Учитель',
      nameUz: "O'qituvchi",
      description: 'Teacher with classroom access',
      isSystem: true,
    },
  });

  const studentRole = await prisma.role.upsert({
    where: { id: 'student-role' },
    update: {},
    create: {
      id: 'student-role',
      name: 'student',
      nameKy: 'Окуучу',
      nameRu: 'Ученик',
      nameUz: "O'quvchi",
      description: 'Student with limited access',
      isSystem: true,
    },
  });

  const parentRole = await prisma.role.upsert({
    where: { id: 'parent-role' },
    update: {},
    create: {
      id: 'parent-role',
      name: 'parent',
      nameKy: 'Ата-эне',
      nameRu: 'Родитель',
      nameUz: 'Ota-ona',
      description: 'Parent with child access',
      isSystem: true,
    },
  });

  console.log('✅ Roles created:', [adminRole.name, teacherRole.name, studentRole.name, parentRole.name].join(', '));

  // Create permissions
  const permissions = [
    { id: 'perm-dashboard', name: 'dashboard.view', module: 'dashboard', action: 'view', description: 'View dashboard' },
    { id: 'perm-students-view', name: 'students.view', module: 'students', action: 'view', description: 'View students' },
    { id: 'perm-students-create', name: 'students.create', module: 'students', action: 'create', description: 'Create students' },
    { id: 'perm-students-edit', name: 'students.edit', module: 'students', action: 'edit', description: 'Edit students' },
    { id: 'perm-students-delete', name: 'students.delete', module: 'students', action: 'delete', description: 'Delete students' },
    { id: 'perm-teachers-view', name: 'teachers.view', module: 'teachers', action: 'view', description: 'View teachers' },
    { id: 'perm-teachers-create', name: 'teachers.create', module: 'teachers', action: 'create', description: 'Create teachers' },
    { id: 'perm-teachers-edit', name: 'teachers.edit', module: 'teachers', action: 'edit', description: 'Edit teachers' },
    { id: 'perm-attendance-view', name: 'attendance.view', module: 'attendance', action: 'view', description: 'View attendance' },
    { id: 'perm-attendance-edit', name: 'attendance.edit', module: 'attendance', action: 'edit', description: 'Edit attendance' },
    { id: 'perm-grades-view', name: 'grades.view', module: 'grades', action: 'view', description: 'View grades' },
    { id: 'perm-grades-edit', name: 'grades.edit', module: 'grades', action: 'edit', description: 'Edit grades' },
    { id: 'perm-reports-view', name: 'reports.view', module: 'reports', action: 'view', description: 'View reports' },
    { id: 'perm-settings-view', name: 'settings.view', module: 'settings', action: 'view', description: 'View settings' },
    { id: 'perm-settings-edit', name: 'settings.edit', module: 'settings', action: 'edit', description: 'Edit settings' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { id: perm.id },
      update: {},
      create: perm,
    });
  }
  console.log(`✅ ${permissions.length} permissions created`);

  // Assign all permissions to admin role
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        id: `${adminRole.id}_${perm.id}`,
      },
      update: {},
      create: {
        id: `${adminRole.id}_${perm.id}`,
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log('✅ Admin role assigned all permissions');

  // Hash password
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { id: 'admin-user' },
    update: {},
    create: {
      id: 'admin-user',
      email: 'admin@edusphere.local',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+996 555 000 000',
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', adminUser.email);

  // Assign admin role to admin user
  await prisma.userRole.upsert({
    where: {
      id: `${adminUser.id}_${adminRole.id}`,
    },
    update: {},
    create: {
      id: `${adminUser.id}_${adminRole.id}`,
      userId: adminUser.id,
      roleId: adminRole.id,
      isActive: true,
    },
  });
  console.log('✅ Admin role assigned to admin user');

  // Create school settings
  await prisma.schoolSettings.upsert({
    where: { id: 'school-settings' },
    update: {},
    create: {
      id: 'school-settings',
      schoolId: school.id,
      academicYear: '2024-2025',
      currentTerm: 1,
      maxStudentsPerClass: 30,
      gradingSystem: '5-point',
      defaultLanguage: 'kg',
      timezone: 'Asia/Bishkek',
    },
  });
  console.log('✅ School settings created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('📧 Admin login: admin@edusphere.local');
  console.log('🔑 Password: Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });