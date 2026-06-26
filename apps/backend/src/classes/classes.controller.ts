import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('classes')
@UseGuards(JwtAuthGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Permissions('classes.create')
  create(@Body() createClassDto: any, @Request() req) {
    return this.classesService.create(createClassDto, req.user.userId);
  }

  @Get()
  @Permissions('classes.view')
  findAll(@Request() req) {
    return this.classesService.findAll(req.user);
  }

  @Get(':id')
  @Permissions('classes.view')
  findOne(@Param('id') id: string, @Request() req) {
    return this.classesService.findOne(id, req.user);
  }

  @Patch(':id')
  @Permissions('classes.edit')
  update(@Param('id') id: string, @Body() updateClassDto: any, @Request() req) {
    return this.classesService.update(id, updateClassDto, req.user);
  }

  @Delete(':id')
  @Permissions('classes.delete')
  remove(@Param('id') id: string, @Request() req) {
    return this.classesService.remove(id, req.user);
  }
}