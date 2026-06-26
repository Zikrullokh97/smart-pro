import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @Permissions('schedule.create')
  create(@Body() createScheduleDto: any, @Request() req) {
    return this.scheduleService.create(createScheduleDto, req.user.userId);
  }

  @Get()
  @Permissions('schedule.view')
  findAll(@Request() req) {
    return this.scheduleService.findAll(req.user);
  }

  @Get(':id')
  @Permissions('schedule.view')
  findOne(@Param('id') id: string, @Request() req) {
    return this.scheduleService.findOne(id, req.user);
  }

  @Patch(':id')
  @Permissions('schedule.edit')
  update(@Param('id') id: string, @Body() updateScheduleDto: any, @Request() req) {
    return this.scheduleService.update(id, updateScheduleDto, req.user);
  }

  @Delete(':id')
  @Permissions('schedule.delete')
  remove(@Param('id') id: string, @Request() req) {
    return this.scheduleService.remove(id, req.user);
  }
}