import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import { ReportDto } from './Dtos/report.dot';
import { ObjectId } from 'mongodb';


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
  1: "Plaza Central Che", // Zona icónica de encuentro
  2: "Edificio Uriel Gutiérrez (Medicina)", // Edificio de posgrados y ciencias de la salud
  3: "Biblioteca Central (Hemeroteca)", // Zona de estudio y conocimiento
  4: "Facultad de Ingeniería (Edificio 401)", // Área de ingeniería y tecnología
  5: "Edificio de Ciencia y Tecnología (CYT)", // Área de laboratorios y desarrollo
  6: "Bosque de la Memoria", // Zona verde y de descanso
  7: "Maloka (Intercambiador - Ciudad Universitaria)", // Zona cercana a la entrada y transporte
  8: "Estadio Alfonso López", // Zona deportiva
  9: "Facultad de Artes (Taller de Arquitectura)", // Área creativa y de diseño
  10: "Museo de Arquitectura Leopoldo Rother", // Zona cultural y patrimonial
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
  async deleteReportById(id: string) {
      try {
        const _id = new ObjectId(id);
        const result = await this.db.collection('Reports').deleteOne({ _id });
        if (result.deletedCount === 1) {
          return { success: true, message: 'Report deleted' };
        } else {
          return { success: false, message: 'Report not found' };
        }
      } catch (error) {
        console.log('deleteReportById error', error);
        return { success: false, message: 'Error deleting report' };
      }
    }
  async updateReportById(id: string, updates: { category?: string; description?: string }) {
  try {
    const _id = new ObjectId(id);
    const setObj: any = {};
    if (typeof updates.category === 'string') {
      setObj.category = this.typeDtoToDb(updates.category);
    }
    if (typeof updates.description === 'string') {
      setObj.description = updates.description;
    }
    // Si no hay campos para actualizar, salir temprano
    if (Object.keys(setObj).length === 0) {
      return { success: false, message: 'No updates provided' };
    }

    const res = await this.db.collection('Reports').updateOne({ _id }, { $set: setObj });
    if (res.matchedCount === 0) return { success: false, message: 'Report not found' };

    // Obtener doc actualizado para devolverlo (y mapear category)
    const updated = await this.db.collection('Reports').findOne({ _id });
    if (!updated) {
      // El documento pudo ser eliminado entre la actualización y la lectura
      return { success: false, message: 'Report not found' };
    }

    const transformed = { ...updated } as any;
    // Asegurar el tipo al indexar los mapas
    transformed.category = violenceTypeMapInverse[updated.category as number] ?? updated.category;
    transformed.zone = zoneMap[updated.zone as number] ?? updated.zone;

    return { success: true, message: 'Report updated', report: transformed };
  } catch (error) {
    console.log('updateReportById error', error);
    return { success: false, message: 'Error updating report' };
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