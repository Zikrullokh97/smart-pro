import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('teachers')
@UseGuards(JwtAuthGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @Permissions('teachers.create')
  create(@Body() createTeacherDto: any, @Request() req) {
    return this.teachersService.create(createTeacherDto, req.user.userId);
  }

  @Get()
  @Permissions('teachers.view')
  findAll(@Request() req) {
    return this.teachersService.findAll(req.user);
  }

  @Get(':id')
  @Permissions('teachers.view')
  findOne(@Param('id') id: string, @Request() req) {
    return this.teachersService.findOne(id, req.user);
  }

  @Patch(':id')
  @Permissions('teachers.edit')
  update(@Param('id') id: string, @Body() updateTeacherDto: any, @Request() req) {
    return this.teachersService.update(id, updateTeacherDto, req.user);
  }

  @Delete(':id')
  @Permissions('teachers.delete')
  remove(@Param('id') id: string, @Request() req) {
    return this.teachersService.remove(id, req.user);
  }
}