import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentPortalService } from './student-portal.service';
import { StudentPortalController } from './student-portal.controller';

@Module({
  imports: [PrismaModule],
  controllers: [StudentPortalController],
  providers: [StudentPortalService],
  exports: [StudentPortalService],
})
export class StudentPortalModule {}