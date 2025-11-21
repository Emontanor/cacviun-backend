import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportDto } from './Dtos/report.dot';

@Controller('report')
export class ReportController {
    constructor(private readonly reportService: ReportService) {}

    @Post('save-report')
    async saveReport(@Body() data: ReportDto){
        return await this.reportService.saveReport(data);
    }

    @Get('history/:email')
    async reportHistory(@Param('email') email: string){
        return await this.reportService.reportHistory(email);
    }

    @Get('admin-history')
    async reportAdminHistory(){
        return await this.reportService.reportAdminHistory();
    }
}