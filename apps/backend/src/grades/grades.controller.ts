import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { GradesService } from './grades.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('grades')
@UseGuards(JwtAuthGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @Permissions('grades.create')
  create(@Body() createGradeDto: any, @Request() req) {
    return this.gradesService.create(createGradeDto, req.user.userId);
  }

  @Get()
  @Permissions('grades.view')
  findAll(@Request() req) {
    return this.gradesService.findAll(req.user);
  }

  @Get(':id')
  @Permissions('grades.view')
  findOne(@Param('id') id: string, @Request() req) {
    return this.gradesService.findOne(id, req.user);
  }

  @Patch(':id')
  @Permissions('grades.edit')
  update(@Param('id') id: string, @Body() updateGradeDto: any, @Request() req) {
    return this.gradesService.update(id, updateGradeDto, req.user);
  }

  @Delete(':id')
  @Permissions('grades.delete')
  remove(@Param('id') id: string, @Request() req) {
    return this.gradesService.remove(id, req.user);
  }
}