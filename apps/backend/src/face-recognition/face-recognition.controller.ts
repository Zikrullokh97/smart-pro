import { Controller, Post, UseGuards, Request, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FaceRecognitionService } from './face-recognition.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('face-recognition')
@UseGuards(JwtAuthGuard)
export class FaceRecognitionController {
  constructor(private readonly faceRecognitionService: FaceRecognitionService) {}

  @Post('register')
  @Permissions('attendance.manage')
  @UseInterceptors(FileInterceptor('photo'))
  async registerFace(
    @Request() req,
    @UploadedFile() photo: Express.Multer.File,
    @Body('studentId') studentId: string
  ) {
    return this.faceRecognitionService.registerFace(studentId, photo, req.user.userId);
  }

  @Post('recognize')
  @Permissions('attendance.manage')
  @UseInterceptors(FileInterceptor('photo'))
  async recognizeFace(@UploadedFile() photo: Express.Multer.File) {
    return this.faceRecognitionService.recognizeFace(photo);
  }

  @Post('attendance/batch')
  @Permissions('attendance.manage')
  @UseInterceptors(FileInterceptor('photo'))
  async markAttendanceBatch(
    @Request() req,
    @UploadedFile() photo: Express.Multer.File,
    @Body('classId') classId: string
  ) {
    return this.faceRecognitionService.markAttendanceBatch(classId, photo, req.user.userId);
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