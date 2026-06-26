import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { PsychologicalService } from './psychological.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('psychological')
@UseGuards(JwtAuthGuard)
export class PsychologicalController {
  constructor(private readonly psychologicalService: PsychologicalService) {}

  @Post()
  @Permissions('sensitive_data.create')
  create(@Body() createNoteDto: any, @Request() req) {
    return this.psychologicalService.create(createNoteDto, req.user.userId);
  }

  @Get()
  @Permissions('sensitive_data.view')
  findAll(@Request() req) {
    return this.psychologicalService.findAll(req.user);
  }

  @Get(':id')
  @Permissions('sensitive_data.view')
  findOne(@Param('id') id: string, @Request() req) {
    return this.psychologicalService.findOne(id, req.user);
  }

  @Patch(':id')
  @Permissions('sensitive_data.edit')
  update(@Param('id') id: string, @Body() updateNoteDto: any, @Request() req) {
    return this.psychologicalService.update(id, updateNoteDto, req.user);
  }

  @Delete(':id')
  @Permissions('sensitive_data.delete')
  remove(@Param('id') id: string, @Request() req) {
    return this.psychologicalService.remove(id, req.user);
  }
}