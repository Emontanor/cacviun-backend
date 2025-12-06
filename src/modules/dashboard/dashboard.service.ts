import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';

const violenceTypeMapInverse: Record<number, string> = {
  1: 'Physical Violence',
  2: 'Psychological Violence',
  3: 'Sexual Violence',
  4: 'Workplace Violence',
  5: 'Discrimination',
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
export class DashboardService {

  constructor(
    @Inject("MONGO_DB") private readonly db: Db,
  ){}

  async getLocations() {
    try {
      const reports = await this.db.collection('Reports').find().toArray();
      
      const locations = reports.map((report: any) => ({
        latitud: report.location?.latitud,
        longitud: report.location?.longitud
      })).filter(loc => loc.latitud && loc.longitud);
      
      return { success: true, data: locations };
    } catch (error) {
      console.log('getLocations error', error);
      return { success: false, message: 'Error fetching locations' };
    }
  }

  async getRecentViolenceReports() {
  try {
    const reports = await this.db.collection('Reports')
      .find(
        {},
        {
          projection: {
            date: 1,
            category: 1,
            creationTime: 1,
            'location.latitud': 1,
            'location.longitud': 1,
          },
        },
      )
      .sort({ creationTime: -1, _id: -1 })
      .limit(20)
      .toArray();

    const data = reports
      .map((report: any) => ({
        date: report.date,
        categoryId: report.category,
        categoryLabel: violenceTypeMapInverse[report.category as number] ?? report.category,
        latitud: report.location?.latitud,
        longitud: report.location?.longitud,
      }))
      .filter(
        (item) =>
          item.date &&
          item.categoryId !== undefined &&
          item.categoryId !== null &&
          item.latitud &&
          item.longitud
      );

      return { success: true, data };
    } catch (error) {
      console.log('getRecentViolenceReports error', error);
      return { success: false, message: 'Error fetching recent violence reports' };
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
}