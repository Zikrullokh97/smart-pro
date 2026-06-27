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
  create(@Body() createTeacherDto: any) {
    return this.teachersService.create(createTeacherDto);
  }

  @Get()
  @Permissions('teachers.view')
  findAll() {
    return this.teachersService.findAll();
  }

  @Get(':id')
  @Permissions('teachers.view')
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  @Permissions('teachers.edit')
  update(@Param('id') id: string, @Body() updateTeacherDto: any) {
    return this.teachersService.update(id, updateTeacherDto);
  }

  @Delete(':id')
  @Permissions('teachers.delete')
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }
}