import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';

@Injectable()
export class DashboardService {

  constructor(
    @Inject("MONGO_DB") private readonly db: Db,
  ){}

}
