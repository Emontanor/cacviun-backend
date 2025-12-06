import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';

const violenceTypeMapInverse: Record<number, string> = {
  1: 'Physical Violence',
  2: 'Psychological Violence',
  3: 'Sexual Violence',
  4: 'Workplace Violence',
  5: 'Discrimination',
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
}