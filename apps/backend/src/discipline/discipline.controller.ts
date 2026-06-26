import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { DisciplineService } from './discipline.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('discipline')
@UseGuards(JwtAuthGuard)
export class DisciplineController {
  constructor(private readonly disciplineService: DisciplineService) {}

  @Post()
  @Permissions('sensitive_data.create')
  create(@Body() createRecordDto: any, @Request() req) {
    return this.disciplineService.create(createRecordDto, req.user.userId);
  }

  @Get()
  @Permissions('sensitive_data.view')
  findAll(@Request() req) {
    return this.disciplineService.findAll(req.user);
  }

  @Get(':id')
  @Permissions('sensitive_data.view')
  findOne(@Param('id') id: string, @Request() req) {
    return this.disciplineService.findOne(id, req.user);
  }

  @Patch(':id')
  @Permissions('sensitive_data.edit')
  update(@Param('id') id: string, @Body() updateRecordDto: any, @Request() req) {
    return this.disciplineService.update(id, updateRecordDto, req.user);
  }

  @Delete(':id')
  @Permissions('sensitive_data.delete')
  remove(@Param('id') id: string, @Request() req) {
    return this.disciplineService.remove(id, req.user);
  }
}