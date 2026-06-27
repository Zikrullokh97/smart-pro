import { Controller, Post, UseGuards, Request, Body, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AiTeacherAssistantService } from './ai-teacher-assistant.service';

@Controller('ai/teacher')
@UseGuards(JwtAuthGuard)
export class AiTeacherAssistantController {
  constructor(private readonly aiTeacherAssistantService: AiTeacherAssistantService) {}

  @Post('lesson-plan')
  @Permissions('ai.teacher.use')
  async generateLessonPlan(@Request() req, @Body() body: { subject: string; grade: number; topic: string; duration: number }) {
    return this.aiTeacherAssistantService.generateLessonPlan(req.user.userId, body);
  }

  @Post('homework-generator')
  @Permissions('ai.teacher.use')
  async generateHomework(@Request() req, @Body() body: { subject: string; grade: number; topic: string; difficulty: string; count: number }) {
    return this.aiTeacherAssistantService.generateHomework(req.user.userId, body);
  }

  @Post('quiz-generator')
  @Permissions('ai.teacher.use')
  async generateQuiz(@Request() req, @Body() body: { subject: string; grade: number; topic: string; questionCount: number; questionType: string }) {
    return this.aiTeacherAssistantService.generateQuiz(req.user.userId, body);
  }

  @Post('student-analysis')
  @Permissions('ai.analytics.view')
  async analyzeStudent(@Request() req, @Body() body: { studentId: string }) {
    return this.aiTeacherAssistantService.analyzeStudent(req.user.userId, body.studentId);
  }

  @Get('requests')
  @Permissions('ai.teacher.use')
  async getMyRequests(@Request() req) {
    return this.aiTeacherAssistantService.getUserRequests(req.user.userId);
  }

  @Get('requests/:id')
  @Permissions('ai.teacher.use')
  async getRequest(@Param('id') id: string) {
    return this.aiTeacherAssistantService.getRequestById(id);
  }

  @Post('requests/:id/approve')
  @Permissions('ai.teacher.use')
  async approveRequest(@Request() req, @Param('id') id: string, @Body() body: { modifications?: string }) {
    return this.aiTeacherAssistantService.approveRequest(req.user.userId, id, body.modifications);
  }

  @Post('requests/:id/reject')
  @Permissions('ai.teacher.use')
  async rejectRequest(@Request() req, @Param('id') id: string, @Body() body: { reason: string }) {
    return this.aiTeacherAssistantService.rejectRequest(req.user.userId, id, body.reason);
  }
}