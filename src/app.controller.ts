import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('Try-connection')
  async getHello(): Promise<{ message: string }> {
    return { message: "CACVIUN Backend is running!" };
  }

}
