import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Permissions('notifications.create')
  create(@Body() createNotificationDto: any, @Request() req) {
    return this.notificationsService.create(createNotificationDto, req.user.userId);
  }

  @Get()
  @Permissions('notifications.view')
  findAll(@Request() req) {
    return this.notificationsService.findAll(req.user.userId);
  }

  @Get(':id')
  @Permissions('notifications.view')
  findOne(@Param('id') id: string, @Request() req) {
    return this.notificationsService.findOne(id, req.user.userId);
  }

  @Patch(':id/read')
  @Permissions('notifications.edit')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Delete(':id')
  @Permissions('notifications.delete')
  remove(@Param('id') id: string, @Request() req) {
    return this.notificationsService.remove(id, req.user.userId);
  }
}