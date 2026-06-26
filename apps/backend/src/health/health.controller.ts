import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { HealthService } from './health.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('health')
@UseGuards(JwtAuthGuard)
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Post()
  @Permissions('sensitive_data.create')
  create(@Body() createRecordDto: any, @Request() req) {
    return this.healthService.create(createRecordDto, req.user.userId);
  }

  @Get()
  @Permissions('sensitive_data.view')
  findAll(@Request() req) {
    return this.healthService.findAll(req.user);
  }

  @Get(':id')
  @Permissions('sensitive_data.view')
  findOne(@Param('id') id: string, @Request() req) {
    return this.healthService.findOne(id, req.user);
  }

  @Patch(':id')
  @Permissions('sensitive_data.edit')
  update(@Param('id') id: string, @Body() updateRecordDto: any, @Request() req) {
    return this.healthService.update(id, updateRecordDto, req.user);
  }

  @Delete(':id')
  @Permissions('sensitive_data.delete')
  remove(@Param('id') id: string, @Request() req) {
    return this.healthService.remove(id, req.user);
  }
}