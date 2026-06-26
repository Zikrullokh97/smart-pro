import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { HealthPublicController } from './health.public.controller';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController, HealthPublicController],
  providers: [HealthService],
  exports: [HealthService, PrismaModule],
})
export class HealthModule {}
