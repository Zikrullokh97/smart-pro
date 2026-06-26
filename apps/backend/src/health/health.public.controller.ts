import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthPublicController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Public health check endpoint' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Service is healthy' })
  async check() {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'EduSphere Pro API',
        version: '1.0.0',
        database: 'connected',
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'EduSphere Pro API',
        version: '1.0.0',
        database: 'disconnected',
        error: error.message,
      }
    }
  }
}