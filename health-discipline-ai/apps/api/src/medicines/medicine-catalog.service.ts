import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MedicineCatalog, MedicineCatalogDocument } from './schemas/medicine-catalog.schema';

@Injectable()
export class MedicineCatalogService {
  constructor(
    @InjectModel(MedicineCatalog.name) private catalogModel: Model<MedicineCatalogDocument>,
  ) {}

  async findByBrandName(brandName: string): Promise<MedicineCatalogDocument | null> {
    // Exact match first
    let result = await this.catalogModel.findOne({
      brandName: { $regex: new RegExp(`^${this.escapeRegex(brandName)}$`, 'i') },
    });

    if (result) return result;

    // Try text search (fuzzy)
    const results = await this.catalogModel
      .find({ $text: { $search: brandName } }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(1);

    return results.length > 0 ? results[0] : null;
  }

  async search(query: string, limit = 10): Promise<MedicineCatalogDocument[]> {
    if (!query || query.length < 2) return [];

    // Try text search first
    const textResults = await this.catalogModel
      .find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit);

    if (textResults.length > 0) return textResults;

    // Fallback to regex search
    const regex = new RegExp(this.escapeRegex(query), 'i');
    return this.catalogModel
      .find({
        $or: [
          { brandName: regex },
          { genericName: regex },
          { aliases: regex },
        ],
      })
      .limit(limit);
  }

  async seedCatalog(): Promise<void> {
    const count = await this.catalogModel.countDocuments();
    if (count > 0) return;

    const medicines = [
      { brandName: 'Telma 40', genericName: 'Telmisartan 40mg', category: 'antihypertensive', linkedConditions: ['hypertension'], commonDosages: ['20mg', '40mg', '80mg'], aliases: ['Telma', 'Telmisartan'] },
      { brandName: 'Telma-AM', genericName: 'Telmisartan + Amlodipine', category: 'antihypertensive', linkedConditions: ['hypertension'], isCombination: true, components: ['telmisartan', 'amlodipine'], commonDosages: ['40/5mg', '80/5mg'], aliases: ['Telma AM'] },
      { brandName: 'Metformin 500', genericName: 'Metformin 500mg', category: 'antidiabetic', linkedConditions: ['diabetes'], commonDosages: ['250mg', '500mg', '1000mg'], aliases: ['Glycomet', 'Glucophage'] },
      { brandName: 'Glycomet GP', genericName: 'Glimepiride + Metformin', category: 'antidiabetic', linkedConditions: ['diabetes'], isCombination: true, components: ['glimepiride', 'metformin'], commonDosages: ['1/500mg', '2/500mg'], aliases: ['Glycomet GP1', 'Glycomet GP2'] },
      { brandName: 'Amlodipine 5', genericName: 'Amlodipine 5mg', category: 'antihypertensive', linkedConditions: ['hypertension', 'heart_disease'], commonDosages: ['2.5mg', '5mg', '10mg'], aliases: ['Amlong', 'Amlip', 'Stamlo'] },
      { brandName: 'Atorvastatin 10', genericName: 'Atorvastatin 10mg', category: 'statin', linkedConditions: ['cholesterol', 'heart_disease'], commonDosages: ['10mg', '20mg', '40mg'], aliases: ['Atorva', 'Lipitor', 'Storvas'] },
      { brandName: 'Ecosprin 75', genericName: 'Aspirin 75mg', category: 'antiplatelet', linkedConditions: ['heart_disease'], commonDosages: ['75mg', '150mg'], aliases: ['Ecosprin', 'Aspirin', 'Disprin'] },
      { brandName: 'Thyronorm 50', genericName: 'Levothyroxine 50mcg', category: 'thyroid', linkedConditions: ['thyroid'], commonDosages: ['25mcg', '50mcg', '75mcg', '100mcg'], aliases: ['Thyronorm', 'Eltroxin', 'Thyrox'] },
      { brandName: 'Clopidogrel 75', genericName: 'Clopidogrel 75mg', category: 'antiplatelet', linkedConditions: ['heart_disease'], commonDosages: ['75mg'], aliases: ['Clopilet', 'Plavix', 'Clopivas'] },
      { brandName: 'Losartan 50', genericName: 'Losartan 50mg', category: 'antihypertensive', linkedConditions: ['hypertension'], commonDosages: ['25mg', '50mg', '100mg'], aliases: ['Losar', 'Losacar', 'Repace'] },
      { brandName: 'Pantoprazole 40', genericName: 'Pantoprazole 40mg', category: 'ppi', linkedConditions: ['acidity'], commonDosages: ['20mg', '40mg'], aliases: ['Pan 40', 'Pantop', 'Pan-D'] },
      { brandName: 'Rosuvastatin 10', genericName: 'Rosuvastatin 10mg', category: 'statin', linkedConditions: ['cholesterol'], commonDosages: ['5mg', '10mg', '20mg'], aliases: ['Rosulip', 'Crestor', 'Rosuvas'] },
      { brandName: 'Telmisartan 40', genericName: 'Telmisartan 40mg', category: 'antihypertensive', linkedConditions: ['hypertension'], commonDosages: ['20mg', '40mg', '80mg'], aliases: ['Telma', 'Telmikind', 'Telday'] },
      { brandName: 'Glimepiride 1', genericName: 'Glimepiride 1mg', category: 'antidiabetic', linkedConditions: ['diabetes'], commonDosages: ['1mg', '2mg', '4mg'], aliases: ['Amaryl', 'Glimisave', 'Glimy'] },
      { brandName: 'Metoprolol 25', genericName: 'Metoprolol 25mg', category: 'beta_blocker', linkedConditions: ['hypertension', 'heart_disease'], commonDosages: ['25mg', '50mg', '100mg'], aliases: ['Betaloc', 'Met XL', 'Metolar'] },
      { brandName: 'Ramipril 5', genericName: 'Ramipril 5mg', category: 'ace_inhibitor', linkedConditions: ['hypertension', 'heart_disease'], commonDosages: ['2.5mg', '5mg', '10mg'], aliases: ['Cardace', 'Ramistar', 'Ramace'] },
      { brandName: 'Insulin Glargine', genericName: 'Insulin Glargine', category: 'insulin', linkedConditions: ['diabetes'], commonDosages: ['100 IU/ml'], aliases: ['Lantus', 'Basalog', 'Glaritus'] },
      { brandName: 'Sitagliptin 100', genericName: 'Sitagliptin 100mg', category: 'antidiabetic', linkedConditions: ['diabetes'], commonDosages: ['25mg', '50mg', '100mg'], aliases: ['Januvia', 'Istavel', 'Zita'] },
      { brandName: 'Calcium + D3', genericName: 'Calcium Carbonate + Vitamin D3', category: 'supplement', linkedConditions: ['arthritis'], commonDosages: ['500mg/250IU', '500mg/500IU'], aliases: ['Shelcal', 'Calcimax', 'CCM'] },
      { brandName: 'Diclofenac 50', genericName: 'Diclofenac 50mg', category: 'nsaid', linkedConditions: ['arthritis'], commonDosages: ['50mg'], aliases: ['Voveran', 'Diclomol', 'Reactin'] },
      { brandName: 'Pregabalin 75', genericName: 'Pregabalin 75mg', category: 'neuropathic', linkedConditions: ['neuropathy'], commonDosages: ['75mg', '150mg'], aliases: ['Lyrica', 'Pregaba', 'Pregalin'] },
      { brandName: 'Empagliflozin 10', genericName: 'Empagliflozin 10mg', category: 'antidiabetic', linkedConditions: ['diabetes'], commonDosages: ['10mg', '25mg'], aliases: ['Jardiance', 'Gibtulio'] },
      { brandName: 'Bisoprolol 5', genericName: 'Bisoprolol 5mg', category: 'beta_blocker', linkedConditions: ['hypertension', 'heart_disease'], commonDosages: ['2.5mg', '5mg', '10mg'], aliases: ['Concor', 'Bisogamma'] },
      { brandName: 'Vildagliptin 50', genericName: 'Vildagliptin 50mg', category: 'antidiabetic', linkedConditions: ['diabetes'], commonDosages: ['50mg'], aliases: ['Galvus', 'Zomelis', 'Jalra'] },
      { brandName: 'Olmesartan 20', genericName: 'Olmesartan 20mg', category: 'antihypertensive', linkedConditions: ['hypertension'], commonDosages: ['20mg', '40mg'], aliases: ['Olmy', 'Olmezest', 'Benicar'] },
    ];

    await this.catalogModel.insertMany(
      medicines.map((m) => ({
        ...m,
        isCombination: m.isCombination || false,
        components: m.components || [],
        aliases: m.aliases || [],
      }))
    );
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
