import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Call, CallSchema } from '../calls/schemas/call.schema';
import { PatientsModule } from '../patients/patients.module';
import { ContextBuilderService } from './context-builder.service';
import { FlowVariantSelectorService } from './flow-variant-selector.service';
import { ScreeningQuestionSelectorService } from './screening-question-selector.service';
import { PromptAssemblerService } from './prompt-assembler.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Call.name, schema: CallSchema }]),
    PatientsModule,
  ],
  providers: [
    ContextBuilderService,
    FlowVariantSelectorService,
    ScreeningQuestionSelectorService,
    PromptAssemblerService,
  ],
  exports: [PromptAssemblerService],
})
export class DynamicPromptModule {}
