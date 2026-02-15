import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MedicineCatalogDocument = MedicineCatalog & Document;

@Schema({ timestamps: true })
export class MedicineCatalog {
  @Prop({ required: true })
  brandName: string;

  @Prop({ required: true })
  genericName: string;

  @Prop({ required: true })
  category: string;

  @Prop({ type: [String], default: [] })
  linkedConditions: string[];

  @Prop({ default: false })
  isCombination: boolean;

  @Prop({ type: [String], default: [] })
  components: string[];

  @Prop({ type: [String], default: [] })
  commonDosages: string[];

  @Prop({ type: [String], default: [] })
  aliases: string[];
}

export const MedicineCatalogSchema = SchemaFactory.createForClass(MedicineCatalog);

MedicineCatalogSchema.index(
  { brandName: 'text', genericName: 'text', aliases: 'text' },
  { weights: { brandName: 10, genericName: 5, aliases: 1 } }
);
