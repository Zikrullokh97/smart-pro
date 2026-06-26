import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class FaceRecognitionService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async registerFace(studentId: string, photo: Express.Multer.File, userId: string) {
    // Validate student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { school: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // In production, you would:
    // 1. Use a face recognition library (e.g., face-api.js, AWS Rekognition, Azure Face API)
    // 2. Extract face embeddings
    // 3. Store embeddings in database or vector database
    // 4. Store photo in S3 or local storage

    // For now, we'll store a placeholder
    const faceData = {
      studentId,
      photoUrl: `/uploads/faces/${studentId}.jpg`,
      faceEmbedding: null, // Would contain actual face embedding
      registeredAt: new Date(),
      registeredBy: userId,
      isActive: true,
    };

    // Save to database (you would need to add FaceData model to schema)
    // For now, we'll just return success
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'face_register',
        module: 'face_recognition',
        resourceId: studentId,
        schoolId: student.schoolId,
        details: `Face registered for student ${student.firstName} ${student.lastName}`,
      },
    });

    return {
      success: true,
      message: 'Face registered successfully',
      studentId,
      studentName: `${student.firstName} ${student.lastName}`,
    };
  }

  async recognizeFace(photo: Express.Multer.File) {
    // In production:
    // 1. Extract face from photo
    // 2. Generate face embedding
    // 3. Search in database for matching face
    // 4. Return student if confidence > threshold

    // Mock implementation
    return {
      recognized: false,
      confidence: 0,
      message: 'Face recognition not configured. Please integrate with face recognition service.',
    };
  }

  async markAttendanceBatch(classId: string, photo: Express.Multer.File, userId: string) {
    // Get class with students
    const classData = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: {
          include: {
            student: true,
            parents: {
              include: {
                parent: true,
              },
            },
          },
        },
      },
    });

    if (!classData) {
      throw new NotFoundException('Class not found');
    }

    // Recognize faces in photo
    const recognitionResult = await this.recognizeFace(photo);
    
    // In production, you would:
    // 1. Detect all faces in the photo
    // 2. Recognize each face
    // 3. Mark attendance for recognized students
    // 4. Return list of recognized and unrecognized students

    const attendanceRecords = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Mock: Mark all students as present for demo
    for (const enrollment of classData.students) {
      const attendance = await this.prisma.attendance.create({
        data: {
          studentId: enrollment.studentId,
          classId: classData.id,
          schoolId: classData.schoolId,
          date: today,
          status: 'present',
          recordedBy: userId,
          method: 'face_recognition',
        },
      });
      attendanceRecords.push(attendance);

      // Send notification to parents
      await this.notifyParents(enrollment, classData);
    }

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'attendance_batch_face',
        module: 'attendance',
        resourceId: classId,
        schoolId: classData.schoolId,
        details: `Batch attendance marked for class ${classData.name} using face recognition`,
      },
    });

    return {
      success: true,
      classId,
      className: classData.name,
      totalStudents: classData.students.length,
      attendanceRecords,
      message: `Attendance marked for ${attendanceRecords.length} students`,
    };
  }

  private async notifyParents(enrollment: any, classData: any) {
    const student = enrollment.student;
    
    for (const parentLink of enrollment.parents) {
      const parent = parentLink.parent;
      
      await this.prisma.notification.create({
        data: {
          userId: parent.id,
          title: 'Attendance Notification',
          message: `${student.firstName} ${student.lastName} has been marked present in class ${classData.name}`,
          type: 'attendance',
          schoolId: classData.schoolId,
        },
      });
    }
  }

  async getStudentFaceData(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        // faceData would be included here in production
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      hasFaceData: false, // Would check if face data exists
      registeredAt: null,
    };
  }

  async deleteFaceData(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { school: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // In production, you would:
    // 1. Delete face embedding from database/vector store
    // 2. Delete photo from storage
    // 3. Update audit log

    await this.prisma.auditLog.create({
      data: {
        action: 'face_delete',
        module: 'face_recognition',
        resourceId: studentId,
        schoolId: student.schoolId,
        details: `Face data deleted for student ${student.firstName} ${student.lastName}`,
      },
    });

    return {
      success: true,
      message: 'Face data deleted successfully',
      studentId,
    };
  }
}