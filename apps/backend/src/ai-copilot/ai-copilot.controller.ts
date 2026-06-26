import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { AiCopilotService } from './ai-copilot.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('ai-copilot')
@UseGuards(JwtAuthGuard)
export class AiCopilotController {
  constructor(private readonly aiCopilotService: AiCopilotService) {}

  @Post('suggestions')
  @Permissions('ai_copilot.create')
  createSuggestion(@Body() createSuggestionDto: any, @Request() req) {
    return this.aiCopilotService.createSuggestion(createSuggestionDto, req.user);
  }

  @Get('suggestions')
  @Permissions('ai_copilot.view')
  getSuggestions(@Request() req) {
    return this.aiCopilotService.getSuggestions(req.user.userId);
  }

  @Get('suggestions/:id')
  @Permissions('ai_copilot.view')
  getSuggestion(@Param('id') id: string, @Request() req) {
    return this.aiCopilotService.getSuggestion(id, req.user.userId);
  }

  @Patch('suggestions/:id/approve')
  @Permissions('ai_copilot.approve')
  approveSuggestion(@Param('id') id: string, @Request() req) {
    return this.aiCopilotService.approveSuggestion(id, req.user.userId);
  }

  @Patch('suggestions/:id/reject')
  @Permissions('ai_copilot.approve')
  rejectSuggestion(@Param('id') id: string, @Request() req) {
    return this.aiCopilotService.rejectSuggestion(id, req.user.userId);
  }

  @Patch('suggestions/:id/modify')
  @Permissions('ai_copilot.edit')
  modifySuggestion(@Param('id') id: string, @Body() modifyDto: any, @Request() req) {
    return this.aiCopilotService.modifySuggestion(id, modifyDto, req.user.userId);
  }
}