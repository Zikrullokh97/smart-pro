import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { ClassesModule } from './classes/classes.module';
import { AttendanceModule } from './attendance/attendance.module';
import { GradesModule } from './grades/grades.module';
import { HomeworkModule } from './homework/homework.module';
import { ScheduleModule } from './schedule/schedule.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { ParentPortalModule } from './parent-portal/parent-portal.module';
import { StudentPortalModule } from './student-portal/student-portal.module';
import { AiCopilotModule } from './ai-copilot/ai-copilot.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { PsychologicalModule } from './psychological/psychological.module';
import { DisciplineModule } from './discipline/discipline.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { AuditInterceptor } from './audit/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    StudentsModule,
    TeachersModule,
    ClassesModule,
    AttendanceModule,
    GradesModule,
    HomeworkModule,
    ScheduleModule,
    NotificationsModule,
    ReportsModule,
    ParentPortalModule,
    StudentPortalModule,
    AiCopilotModule,
    AuditModule,
    HealthModule,
    PsychologicalModule,
    DisciplineModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}