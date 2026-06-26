import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateStudentDto } from './dto/create-student.dto';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Permissions('students.create')
  create(@Body() createStudentDto: CreateStudentDto, @Request() req) {
    return this.studentsService.create(createStudentDto, req.user.userId);
  }

  @Get()
  @Permissions('students.view')
  findAll(@Request() req) {
    return this.studentsService.findAll(req.user);
  }

  @Get(':id')
  @Permissions('students.view')
  findOne(@Param('id') id: string, @Request() req) {
    return this.studentsService.findOne(id, req.user);
  }

  @Patch(':id')
  @Permissions('students.edit')
  update(@Param('id') id: string, @Body() updateStudentDto: any, @Request() req) {
    return this.studentsService.update(id, updateStudentDto, req.user);
  }

  @Delete(':id')
  @Permissions('students.delete')
  remove(@Param('id') id: string, @Request() req) {
    return this.studentsService.remove(id, req.user);
  }
}