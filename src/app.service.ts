import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';

@Injectable()
export class AppService {

  constructor(
    @Inject("MONGO_DB") private readonly db: Db,
  ){}

  getHello(): string {
    return 'Hello World! dani homsex';
  }

}
