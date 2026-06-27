import { Controller, Post, Get, Body, Request, UseGuards, Param, Query } from '@nestjs/common';
import { AiWarningService } from './ai-warning.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('ai/warning')
@UseGuards(JwtAuthGuard)
export class AiWarningController {
  constructor(private readonly aiWarningService: AiWarningService) {}

  @Get('alerts')
  @Permissions('ai.analytics.view')
  async getAlerts(@Request() req, @Query('status') status?: string) {
    return this.aiWarningService.getAlerts(req.user.userId, status);
  }

  @Post('check')
  @Permissions('ai.analytics.view')
  async runCheck(@Request() req) {
    return this.aiWarningService.runWarningCheck(req.user.userId);
  }

  @Post('alerts/:id/acknowledge')
  @Permissions('ai.analytics.view')
  async acknowledgeAlert(@Request() req, @Param('id') id: string) {
    return this.aiWarningService.acknowledgeAlert(req.user.userId, id);
  }

  @Get('rules')
  @Permissions('ai.analytics.view')
  async getRules(@Request() req) {
    return this.aiWarningService.getWarningRules(req.user.userId);
  }

  @Post('rules')
  @Permissions('ai.analytics.view')
  async updateRule(@Request() req, @Body() body: { ruleId: string; enabled: boolean; threshold?: number }) {
    return this.aiWarningService.updateWarningRule(req.user.userId, body);
  }
}