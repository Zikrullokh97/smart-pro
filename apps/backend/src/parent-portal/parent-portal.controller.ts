import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
import { ParentPortalService } from './parent-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('parent-portal')
@UseGuards(JwtAuthGuard)
export class ParentPortalController {
  constructor(private readonly parentPortalService: ParentPortalService) {}

  @Get('children')
  @Permissions('parent_portal.view')
  getChildren(@Request() req) {
    return this.parentPortalService.getChildren(req.user.userId);
  }

  @Get('children/:studentId/attendance')
  @Permissions('attendance.view')
  getChildAttendance(@Param('studentId') studentId: string, @Request() req) {
    return this.parentPortalService.getChildAttendance(studentId, req.user.userId);
  }

  @Get('children/:studentId/grades')
  @Permissions('grades.view')
  getChildGrades(@Param('studentId') studentId: string, @Request() req) {
    return this.parentPortalService.getChildGrades(studentId, req.user.userId);
  }

  @Get('children/:studentId/homework')
  @Permissions('homework.view')
  getChildHomework(@Param('studentId') studentId: string, @Request() req) {
    return this.parentPortalService.getChildHomework(studentId, req.user.userId);
  }

  @Get('children/:studentId/schedule')
  @Permissions('schedule.view')
  getChildSchedule(@Param('studentId') studentId: string, @Request() req) {
    return this.parentPortalService.getChildSchedule(studentId, req.user.userId);
  }
}