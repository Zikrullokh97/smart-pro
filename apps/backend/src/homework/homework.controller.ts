import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { HomeworkService } from './homework.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('homework')
@UseGuards(JwtAuthGuard)
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Post()
  @Permissions('homework.create')
  create(@Body() createHomeworkDto: any, @Request() req) {
    return this.homeworkService.create(createHomeworkDto, req.user.userId);
  }

  @Get()
  @Permissions('homework.view')
  findAll(@Request() req) {
    return this.homeworkService.findAll(req.user);
  }

  @Get(':id')
  @Permissions('homework.view')
  findOne(@Param('id') id: string, @Request() req) {
    return this.homeworkService.findOne(id, req.user);
  }

  @Patch(':id')
  @Permissions('homework.edit')
  update(@Param('id') id: string, @Body() updateHomeworkDto: any, @Request() req) {
    return this.homeworkService.update(id, updateHomeworkDto, req.user);
  }

  @Delete(':id')
  @Permissions('homework.delete')
  remove(@Param('id') id: string, @Request() req) {
    return this.homeworkService.remove(id, req.user);
  }
}