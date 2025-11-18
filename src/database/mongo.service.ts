import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';

@Injectable()
export class MongoService {
  constructor(
    @Inject("MONGO_DB") private readonly db: Db,
  ) {}

  getDb(): Db {
    return this.db;
  }

  
}
