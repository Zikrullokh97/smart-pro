import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Permissions('attendance.create')
  create(@Body() createAttendanceDto: any, @Request() req) {
    return this.attendanceService.create(createAttendanceDto, req.user.userId);
  }

  @Get()
  @Permissions('attendance.view')
  findAll(@Request() req) {
    return this.attendanceService.findAll(req.user);
  }

  @Get(':id')
  @Permissions('attendance.view')
  findOne(@Param('id') id: string, @Request() req) {
    return this.attendanceService.findOne(id, req.user);
  }

  @Patch(':id')
  @Permissions('attendance.edit')
  update(@Param('id') id: string, @Body() updateAttendanceDto: any, @Request() req) {
    return this.attendanceService.update(id, updateAttendanceDto, req.user);
  }

  @Delete(':id')
  @Permissions('attendance.delete')
  remove(@Param('id') id: string, @Request() req) {
    return this.attendanceService.remove(id, req.user);
  }
}