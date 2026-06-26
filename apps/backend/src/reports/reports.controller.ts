import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @Permissions('reports.generate')
  generateReport(@Body() generateReportDto: any, @Request() req) {
    return this.reportsService.generateReport(generateReportDto, req.user);
  }

  @Get('attendance')
  @Permissions('reports.view')
  getAttendanceReport(@Request() req) {
    return this.reportsService.getAttendanceReport(req.user);
  }

  @Get('grades')
  @Permissions('reports.view')
  getGradesReport(@Request() req) {
    return this.reportsService.getGradesReport(req.user);
  }

  @Get('students')
  @Permissions('reports.view')
  getStudentsReport(@Request() req) {
    return this.reportsService.getStudentsReport(req.user);
  }
}