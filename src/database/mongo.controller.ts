import { Controller, Get } from '@nestjs/common';
import { MongoService } from './mongo.service';

@Controller('mongo')
export class MongoController {
  constructor(private readonly mongoService: MongoService) {}

  @Get()
  status() {
    return { message: 'Mongo module working' };
  }

  @Get('test-db')
  async testDb() {
    return this.mongoService.testDbConnection();
  }

  @Get('create-all')
  async createAllCollections() {
    return this.mongoService.createAll();
  }

  @Get('create-prueba')
  async createPruebaFile(){
    return this.mongoService.createPrueba();
  }

}