import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-db')
  async testDb() {
    return this.appService.testDbConnection();
  }

  @Get('init-roles')
  async initRoles() {
    return this.appService.initRoles();
  }
}
