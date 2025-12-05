import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import { ReportDto } from './Dtos/report.dot';
import { ObjectId } from 'mongodb';
import * as turf from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import * as mapData from './assets/map.json';


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
  1: "El Viejo",
  2: "La Playita",
  3: "El Jaguar",
  4: "Farmacia",
  5: "Quimica",
  6: "Medicina",
  7: "Veterinaria",
  8: "Enfermeria",
  9: "Derecho",
  10: "Humanas",
  11: "Freud",
  12: "Ondontologia y Ciencias Humanas",
  13: "Diseño Grafico",
  14: "Entrada de la 26",
  15: "Capilla",
  16: "Museo de Arte y Parque",
  17: "Museo de Arquitectura",
  18: "Plaza Che",
  19: "Parque Entrada 30",
  20: "Administrativos Calle 30",
  21: "Economia y Arquitectura",
  22: "Musica y Artes",
  23: "EM e Hidraulica",
  24: "Laboratorios de Ingenierias",
  25: "Aulas de Ingenieria",
  26: "CYT",
  27: "Ciencias",
  28: "Humbolt",
  29: "Parque CYT",
  30: "Complejo Deportivo",
  31: "IPARM",
  32: "Biologia",
  33: "Jardin UN",
  34: "Posgrados de Humanas y Geologia",
  35: "Edificio Gloria Galeano y Agronomia",
  36: "ICA",
  37: "Invernaderos",
  38: "Hemeroteca",
  39: "Administrativos"
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
    const zone = this.locationToZone(reportDto.location.latitud, reportDto.location.longitud);
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

  private locationToZone(latitud: string, longitud: string): number {
    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);

    let foundZone: number | null = null;

    // Iterar sobre las features del GeoJSON para encontrar la zona
    for (const feature of mapData.features) {
      if (booleanPointInPolygon(turf.point([lng, lat]), feature as any)) {
        foundZone = Number(feature.properties.Id);
        break;
      }
    }

    if (foundZone === null) {
      throw new Error('Location is not inside any valid zone');
    }

    return foundZone;
  } 

  private typeDtoToDb(type: string){
    const id = violenceTypeMap[type];

    if (!id) {
        throw new Error(`Tipo de violencia no válido: ${type}`);
    }
    return id;
  }
}