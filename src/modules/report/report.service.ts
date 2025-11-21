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