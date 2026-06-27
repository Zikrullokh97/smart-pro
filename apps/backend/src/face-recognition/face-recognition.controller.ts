import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { FaceRecognitionService } from './face-recognition.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('face-recognition')
@UseGuards(JwtAuthGuard)
export class FaceRecognitionController {
  constructor(private readonly faceRecognitionService: FaceRecognitionService) {}

  @Post('register')
  @Permissions('students.manage')
  async registerFace(@Body() registerDto: any, @Request() req) {
    return this.faceRecognitionService.registerFace(registerDto, req.user.userId);
  }

  @Post('verify')
  @Permissions('attendance.manage')
  async verifyFace(@Body() verifyDto: any) {
    return this.faceRecognitionService.verifyFace(verifyDto);
  }

  @Get('students/:studentId')
  @Permissions('students.view')
  async getStudentFaceData(@Param('studentId') studentId: string) {
    return this.faceRecognitionService.getStudentFaceData(studentId);
  }

  @Delete('students/:studentId')
  @Permissions('attendance.manage')
  async deleteFaceData(@Param('studentId') studentId: string) {
    return this.faceRecognitionService.deleteFaceData(studentId);
  }
}