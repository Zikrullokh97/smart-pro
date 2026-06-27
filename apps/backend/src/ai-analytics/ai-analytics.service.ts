import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AiAnalyticsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async analyzeStudentPerformance(userId: string, studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        attendances: {
          where: {
            date: {
              gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Last 60 days
            },
          },
          orderBy: { date: 'desc' },
        },
        grades: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Calculate performance metrics
    const attendanceRate = student.attendances.length > 0
      ? (student.attendances.filter(a => a.status === 'PRESENT').length / student.attendances.length) * 100
      : 0;

    const avgGrade = student.grades.length > 0
      ? student.grades.reduce((sum, g) => sum + g.value, 0) / student.grades.length
      : 0;

    const gradeTrend = this.calculateGradeTrend(student.grades);
    const attendanceTrend = this.calculateAttendanceTrend(student.attendances);

    // AI Analysis
    const performance = {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      class: student.class.name,
      metrics: {
        attendanceRate: Math.round(attendanceRate),
        averageGrade: Math.round(avgGrade * 10) / 10,
        gradeTrend,
        attendanceTrend,
      },
      riskScore: this.calculateRiskScore(attendanceRate, avgGrade, gradeTrend, attendanceTrend),
      riskLevel: this.getRiskLevel(attendanceRate, avgGrade),
      insights: this.generateInsights(attendanceRate, avgGrade, gradeTrend, attendanceTrend),
      recommendations: this.generateRecommendations(attendanceRate, avgGrade, gradeTrend),
    };

    // Store analysis
    await this.prisma.aIRequest.create({
      data: {
        userId,
        agentType: 'academic_assistant',
        prompt: `Analyze performance for student ${student.firstName} ${student.lastName}`,
        response: JSON.stringify(performance),
        schoolId: student.schoolId,
      },
    });

    return performance;
  }

  async analyzeClassPerformance(userId: string, classId: string) {
    const classData = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: {
          include: {
            student: {
              include: {
                attendances: {
                  where: {
                    date: {
                      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                  },
                },
                grades: {
                  orderBy: { createdAt: 'desc' },
                  take: 10,
                },
              },
            },
          },
        },
      },
    });

    if (!classData) {
      throw new NotFoundException('Class not found');
    }

    const students = classData.students.map(s => s.student);
    const classAvgAttendance = students.reduce((sum, s) => {
      const rate = s.attendances.length > 0
        ? (s.attendances.filter(a => a.status === 'PRESENT').length / s.attendances.length) * 100
        : 0;
      return sum + rate;
    }, 0) / students.length;

    const classAvgGrade = students.reduce((sum, s) => {
      const avg = s.grades.length > 0
        ? s.grades.reduce((gSum, g) => gSum + g.value, 0) / s.grades.length
        : 0;
      return sum + avg;
    }, 0) / students.length;

    const analysis = {
      classId: classData.id,
      className: classData.name,
      totalStudents: students.length,
      averageAttendance: Math.round(classAvgAttendance),
      averageGrade: Math.round(classAvgGrade * 10) / 10,
      performanceDistribution: {
        excellent: students.filter(s => {
          const avg = s.grades.length > 0 ? s.grades.reduce((sum, g) => sum + g.value, 0) / s.grades.length : 0;
          return avg >= 4.5;
        }).length,
        good: students.filter(s => {
          const avg = s.grades.length > 0 ? s.grades.reduce((sum, g) => sum + g.value, 0) / s.grades.length : 0;
          return avg >= 4 && avg < 4.5;
        }).length,
        average: students.filter(s => {
          const avg = s.grades.length > 0 ? s.grades.reduce((sum, g) => sum + g.value, 0) / s.grades.length : 0;
          return avg >= 3 && avg < 4;
        }).length,
        belowAverage: students.filter(s => {
          const avg = s.grades.length > 0 ? s.grades.reduce((sum, g) => sum + g.value, 0) / s.grades.length : 0;
          return avg < 3;
        }).length,
      },
      recommendations: [
        'Focus on students with below average performance',
        'Provide additional support for struggling students',
        'Celebrate high performers',
        'Review teaching methods for difficult topics',
      ],
    };

    return analysis;
  }

  async getRiskStudents(userId: string, threshold: string = 'medium') {
    const schoolId = await this.getUserSchoolId(userId);
    
    const students = await this.prisma.student.findMany({
      where: { schoolId, isActive: true },
      include: {
        attendances: {
          where: {
            date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        grades: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    const riskStudents = students.map(student => {
      const attendanceRate = student.attendances.length > 0
        ? (student.attendances.filter(a => a.status === 'PRESENT').length / student.attendances.length) * 100
        : 0;

      const avgGrade = student.grades.length > 0
        ? student.grades.reduce((sum, g) => sum + g.value, 0) / student.grades.length
        : 0;

      const riskLevel = this.getRiskLevel(attendanceRate, avgGrade);
      
      if (threshold === 'high' && riskLevel !== 'high') return null;
      if (threshold === 'medium' && riskLevel === 'low') return null;

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        classId: student.classId,
        attendanceRate: Math.round(attendanceRate),
        averageGrade: Math.round(avgGrade * 10) / 10,
        riskLevel,
        riskFactors: this.getRiskFactors(attendanceRate, avgGrade),
      };
    }).filter(Boolean);

    return {
      threshold,
      totalAtRisk: riskStudents.length,
      students: riskStudents,
    };
  }

  async getPredictions(userId: string, type?: string) {
    const schoolId = await this.getUserSchoolId(userId);
    
    // Mock predictions - in production, use ML model
    const predictions = {
      attendance: {
        predictedAbsentees: 5,
        confidence: 85,
        basedOn: 'Historical attendance patterns',
      },
      grades: {
        predictedFailures: 3,
        subjects: ['Mathematics', 'Physics'],
        confidence: 78,
        basedOn: 'Current performance trends',
      },
      recommendations: [
        'Intervene for 5 students at risk',
        'Schedule parent meetings for 3 students',
        'Provide additional support in Mathematics',
      ],
    };

    return type ? predictions[type] : predictions;
  }

  async getInsights(userId: string) {
    const schoolId = await this.getUserSchoolId(userId);
    
    // Mock insights - in production, use AI to generate
    return {
      summary: {
        totalStudents: 100,
        averageAttendance: 92,
        averageGrade: 4.1,
        studentsAtRisk: 8,
      },
      trends: {
        attendance: 'improving',
        grades: 'stable',
        behavior: 'needs_attention',
      },
      topPerformers: [
        { studentId: '1', name: 'John Doe', grade: 4.9 },
        { studentId: '2', name: 'Jane Smith', grade: 4.8 },
      ],
      needsAttention: [
        { studentId: '3', name: 'Bob Johnson', reason: 'Low attendance' },
        { studentId: '4', name: 'Alice Brown', reason: 'Declining grades' },
      ],
      actionableInsights: [
        'Attendance has improved by 5% this month',
        'Mathematics grades need attention',
        'Consider reward system for perfect attendance',
      ],
    };
  }

  private calculateGradeTrend(grades: any[]): 'improving' | 'stable' | 'declining' {
    if (grades.length < 2) return 'stable';
    
    const recent = grades.slice(0, 5);
    const older = grades.slice(5, 10);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, g) => sum + g.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, g) => sum + g.value, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.3) return 'improving';
    if (recentAvg < olderAvg - 0.3) return 'declining';
    return 'stable';
  }

  private calculateAttendanceTrend(attendances: any[]): 'improving' | 'stable' | 'declining' {
    if (attendances.length < 2) return 'stable';
    
    const recent = attendances.slice(0, 10);
    const older = attendances.slice(10, 20);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentRate = (recent.filter(a => a.status === 'PRESENT').length / recent.length) * 100;
    const olderRate = (older.filter(a => a.status === 'PRESENT').length / older.length) * 100;
    
    if (recentRate > olderRate + 5) return 'improving';
    if (recentRate < olderRate - 5) return 'declining';
    return 'stable';
  }

  private calculateRiskScore(attendanceRate: number, avgGrade: number, gradeTrend: string, attendanceTrend: string): number {
    let score = 0;
    
    if (attendanceRate < 80) score += 40;
    else if (attendanceRate < 90) score += 20;
    
    if (avgGrade < 3) score += 40;
    else if (avgGrade < 4) score += 20;
    
    if (gradeTrend === 'declining') score += 10;
    if (attendanceTrend === 'declining') score += 10;
    
    return Math.min(score, 100);
  }

  private getRiskLevel(attendanceRate: number, avgGrade: number): 'low' | 'medium' | 'high' {
    if (attendanceRate < 80 || avgGrade < 3) return 'high';
    if (attendanceRate < 90 || avgGrade < 4) return 'medium';
    return 'low';
  }

  private getRiskFactors(attendanceRate: number, avgGrade: number): string[] {
    const factors = [];
    if (attendanceRate < 80) factors.push('Low attendance');
    if (attendanceRate < 90 && attendanceRate >= 80) factors.push('Attendance needs improvement');
    if (avgGrade < 3) factors.push('Grades significantly below average');
    if (avgGrade < 4 && avgGrade >= 3) factors.push('Grades need improvement');
    return factors;
  }

  private generateInsights(attendanceRate: number, avgGrade: number, gradeTrend: string, attendanceTrend: string): string[] {
    const insights = [];
    
    if (attendanceRate < 80) {
      insights.push('Attendance is critically low and requires immediate attention');
    } else if (attendanceRate < 90) {
      insights.push('Attendance is below optimal level');
    } else {
      insights.push('Attendance is satisfactory');
    }
    
    if (avgGrade < 3) {
      insights.push('Academic performance is significantly below expectations');
    } else if (avgGrade < 4) {
      insights.push('Academic performance needs improvement');
    } else {
      insights.push('Academic performance is good');
    }
    
    if (gradeTrend === 'declining') {
      insights.push('Grades are showing a declining trend');
    } else if (gradeTrend === 'improving') {
      insights.push('Grades are improving');
    }
    
    if (attendanceTrend === 'declining') {
      insights.push('Attendance is declining');
    } else if (attendanceTrend === 'improving') {
      insights.push('Attendance is improving');
    }
    
    return insights;
  }

  private generateRecommendations(attendanceRate: number, avgGrade: number, gradeTrend: string): string[] {
    const recommendations = [];
    
    if (attendanceRate < 80) {
      recommendations.push('Schedule parent meeting to discuss attendance');
      recommendations.push('Create attendance improvement plan');
    }
    
    if (avgGrade < 4) {
      recommendations.push('Provide additional learning materials');
      recommendations.push('Consider tutoring sessions');
      recommendations.push('Review and adapt teaching methods');
    }
    
    if (gradeTrend === 'declining') {
      recommendations.push('Identify topics causing difficulty');
      recommendations.push('Provide extra practice exercises');
    }
    
    recommendations.push('Monitor progress weekly');
    recommendations.push('Celebrate improvements and achievements');
    
    return recommendations;
  }

  private async getUserSchoolId(userId: string): Promise<string> {
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId },
    });

    if (teacher) {
      return teacher.schoolId;
    }

    const school = await this.prisma.school.findFirst();
    return school?.id || 'default-school-id';
  }
}