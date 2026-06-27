import { Controller, Post, UseGuards, Request, Body, Get, Param, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AiAnalyticsService } from './ai-analytics.service';

@Controller('ai/analytics')
@UseGuards(JwtAuthGuard)
export class AiAnalyticsController {
  constructor(private readonly aiAnalyticsService: AiAnalyticsService) {}

  @Post('student-performance')
  @Permissions('ai.analytics.view')
  async analyzeStudentPerformance(@Request() req, @Body() body: { studentId: string }) {
    return this.aiAnalyticsService.analyzeStudentPerformance(req.user.userId, body.studentId);
  }

  @Post('class-performance')
  @Permissions('ai.analytics.view')
  async analyzeClassPerformance(@Request() req, @Body() body: { classId: string }) {
    return this.aiAnalyticsService.analyzeClassPerformance(req.user.userId, body.classId);
  }

  @Get('risk-students')
  @Permissions('ai.analytics.view')
  async getRiskStudents(@Request() req, @Query('threshold') threshold?: string) {
    return this.aiAnalyticsService.getRiskStudents(req.user.userId, threshold || 'medium');
  }

  @Get('predictions')
  @Permissions('ai.analytics.view')
  async getPredictions(@Request() req, @Query('type') type?: string) {
    return this.aiAnalyticsService.getPredictions(req.user.userId, type);
  }

  @Get('insights')
  @Permissions('ai.analytics.view')
  async getInsights(@Request() req) {
    return this.aiAnalyticsService.getInsights(req.user.userId);
  }
}