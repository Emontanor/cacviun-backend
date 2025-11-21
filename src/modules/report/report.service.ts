import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import { ReportDto } from './Dtos/report.dot';

const violenceTypeMap: Record<string, number> = {
  "Physical Violence": 1,
  "Psychological Violence": 2,
  "Sexual Violence": 3,
  "Workplace Violence": 4,
  "Discrimination": 5
};

const violenceTypeMapInverse: Record<number, string> = {
  1 : "Physical Violence",
  2 : "Psychological Violence",
  3 : "Sexual Violence",
  4 : "Workplace Violence",
  5: "Discrimination"
};

const zoneMap: Record<number, string> = {
  1 : "Universidad Nacional"
}

@Injectable()
export class ReportService {
  constructor(
    @Inject("MONGO_DB") private readonly db: Db,
  ) {}

  async saveReport(data: ReportDto){
    try {
        const reportDb = await this.reportDtoToDb(data);
        await this.db.collection('Reports').insertOne(reportDb);
        return { success: true, message: `Report created assigned to ${data.email}`}
    } catch(error){
        console.log(error);
        return { success: false, message: "Error creation report on DB"}
    }
  }

  async reportHistory(email: string) {
    try {
      const reports = await this.db.collection('Reports').find({ user_email: email }).toArray();

      const reportsWithMappedValues = reports.map((report: any) => {
        const transformed = { ...report };

        transformed.category =violenceTypeMapInverse[report.category] ?? report.category;

        // Mapear zone (string -> string)
        transformed.zone =zoneMap[report.zone] ?? report.zone;return transformed;
      });

      return { success: true, reportHistory: reportsWithMappedValues };

    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: "Error fetching report history from DB"
      };
    }
  }

  async reportAdminHistory() {
    try {
      const reports = await this.db.collection('Reports').find({}).toArray();

      const reportsWithMappedValues = reports.map((report: any) => {
        const transformed = { ...report };

        transformed.category =violenceTypeMapInverse[report.category] ?? report.category;

        // Mapear zone (string -> string)
        transformed.zone =zoneMap[report.zone] ?? report.zone;return transformed;
      });

      return { success: true, reportHistory: reportsWithMappedValues };

    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: "Error fetching report history from DB"
      };
    }
  }

  private async reportDtoToDb(reportDto: ReportDto){
    const zone = 1;
    const category = this.typeDtoToDb(reportDto.type);
    return({
        user_email: reportDto.email,
        age: reportDto.age,
        description: reportDto.description,
        date: reportDto.date,
        category: category,
        zone: zone,
        location: reportDto.location,
        creationTime: reportDto.sendTime,
        version: "1"
    });
  }

  private typeDtoToDb(type: string){
    const id = violenceTypeMap[type];

    if (!id) {
        throw new Error(`Tipo de violencia no válido: ${type}`);
    }
    return id;
  }
}