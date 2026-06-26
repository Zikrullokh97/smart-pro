import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiCopilotService } from './ai-copilot.service';
import { AiCopilotController } from './ai-copilot.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AiCopilotController],
  providers: [AiCopilotService],
  exports: [AiCopilotService],
})
export class AiCopilotModule {}