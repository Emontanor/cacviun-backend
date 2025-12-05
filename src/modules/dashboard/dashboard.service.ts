import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';

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
}
