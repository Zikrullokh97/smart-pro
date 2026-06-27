import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getWidgets(user: any) {
    const roles = user?.roles || [];
    const permissions = user?.permissions || [];

    const [studentsCount, teachersCount, classesCount, parentsCount, attendanceRecords, notificationsCount] = await Promise.all([
      this.prisma.student.count({ where: { isActive: true } }),
      this.prisma.teacher.count({ where: { isActive: true } }),
      this.prisma.class.count({ where: { isActive: true } }),
      this.prisma.parent.count(),
      this.prisma.attendance.findMany({
        where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        select: { status: true },
      }),
      this.prisma.notification.count({ where: { userId: user?.userId } }),
    ]);

    const widgets: Array<{ id: string; title: string; value: string | number; permission: string }> = [];

    const hasPermission = (permission: string) => permissions.includes(permission);

    if (roles.includes('admin') || roles.includes('director') || roles.includes('school_admin')) {
      widgets.push(
        { id: 'students', title: 'Total Students', value: studentsCount, permission: 'students.view' },
        { id: 'teachers', title: 'Total Teachers', value: teachersCount, permission: 'teachers.view' },
        { id: 'classes', title: 'Total Classes', value: classesCount, permission: 'classes.view' },
        { id: 'parents', title: 'Total Parents', value: parentsCount, permission: 'parent_portal.view' },
        { id: 'attendance-rate', title: 'Attendance Rate', value: this.getAttendanceRate(attendanceRecords), permission: 'attendance.view' },
        { id: 'active-users', title: 'Active Users', value: studentsCount + teachersCount, permission: 'users.view' },
      );
    } else if (roles.includes('teacher') || roles.includes('class_teacher')) {
      const [myClassesCount, pendingGradesCount, pendingHomeworkCount] = await Promise.all([
        this.prisma.class.count({ where: { classTeacherId: { not: null } } }),
        this.prisma.grade.count(),
        this.prisma.homework.count({ where: { isActive: true } }),
      ]);

      widgets.push(
        { id: 'my-classes', title: 'My Classes', value: myClassesCount, permission: 'classes.view' },
        { id: 'pending-grades', title: 'Pending Grades', value: pendingGradesCount, permission: 'grades.view' },
        { id: 'pending-homework', title: 'Pending Homework', value: pendingHomeworkCount, permission: 'homework.view' },
      );
    } else if (roles.includes('student')) {
      const [myAttendanceRecords, pendingHomeworkCount, recentGradesCount] = await Promise.all([
        this.prisma.attendance.findMany({
          where: { student: { userId: user?.userId } },
          select: { status: true },
        }),
        this.prisma.homework.count({ where: { isActive: true } }),
        this.prisma.grade.count({ where: { student: { userId: user?.userId } } }),
      ]);

      widgets.push(
        { id: 'my-attendance', title: 'My Attendance Rate', value: this.getAttendanceRate(myAttendanceRecords), permission: 'attendance.view' },
        { id: 'pending-homework', title: 'Pending Homework', value: pendingHomeworkCount, permission: 'homework.view' },
        { id: 'recent-grades', title: 'Recent Grades', value: recentGradesCount, permission: 'grades.view' },
      );
    } else if (roles.includes('parent')) {
      const [childrenCount, recentNotificationsCount] = await Promise.all([
        this.prisma.studentParent.count({ where: { parent: { userId: user?.userId } } }),
        this.prisma.notification.count({ where: { userId: user?.userId, isRead: false } }),
      ]);

      widgets.push(
        { id: 'children', title: 'Children Count', value: childrenCount, permission: 'parent_portal.view' },
        { id: 'recent-notifications', title: 'Recent Notifications', value: recentNotificationsCount, permission: 'notifications.view' },
      );
    }

    return {
      widgets: widgets.filter((widget) => hasPermission(widget.permission)),
    };
  }

  private getAttendanceRate(records: Array<{ status: string }>) {
    if (!records || records.length === 0) {
      return 0;
    }

    const presentCount = records.filter((record) => record.status === 'PRESENT').length;
    return Math.round((presentCount / records.length) * 100);
  }
}
