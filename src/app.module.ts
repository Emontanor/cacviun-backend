import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongoModule } from './database/mongo.module';
import { UserModule } from './modules/user/user.module';
import { ReportModule } from './modules/report/report.module'
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    MongoModule,
    UserModule,
    ReportModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
