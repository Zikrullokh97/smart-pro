import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions('roles.create')
  create(@Body() createRoleDto: any, @Request() req) {
    return this.rolesService.create(createRoleDto, req.user.userId);
  }

  @Get()
  @Permissions('roles.view')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Permissions('roles.view')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('roles.edit')
  update(@Param('id') id: string, @Body() updateRoleDto: any, @Request() req) {
    return this.rolesService.update(id, updateRoleDto, req.user.userId);
  }

  @Delete(':id')
  @Permissions('roles.delete')
  remove(@Param('id') id: string, @Request() req) {
    return this.rolesService.remove(id, req.user.userId);
  }
}