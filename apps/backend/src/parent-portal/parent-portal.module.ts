import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ParentPortalService } from './parent-portal.service';
import { ParentPortalController } from './parent-portal.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ParentPortalController],
  providers: [ParentPortalService],
  exports: [ParentPortalService],
})
export class ParentPortalModule {}