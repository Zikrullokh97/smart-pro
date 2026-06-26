import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { StudentPortalService } from './student-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('student-portal')
@UseGuards(JwtAuthGuard)
export class StudentPortalController {
  constructor(private readonly studentPortalService: StudentPortalService) {}

  @Get('profile')
  @Permissions('student_portal.view')
  getProfile(@Request() req) {
    return this.studentPortalService.getProfile(req.user.userId);
  }

  @Get('attendance')
  @Permissions('attendance.view')
  getAttendance(@Request() req) {
    return this.studentPortalService.getAttendance(req.user.userId);
  }

  @Get('grades')
  @Permissions('grades.view')
  getGrades(@Request() req) {
    return this.studentPortalService.getGrades(req.user.userId);
  }

  @Get('homework')
  @Permissions('homework.view')
  getHomework(@Request() req) {
    return this.studentPortalService.getHomework(req.user.userId);
  }

  @Get('schedule')
  @Permissions('schedule.view')
  getSchedule(@Request() req) {
    return this.studentPortalService.getSchedule(req.user.userId);
  }
}