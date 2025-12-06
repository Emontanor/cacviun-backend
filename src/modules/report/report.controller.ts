import { Controller, Post, Get, Body, Param, Delete, Put} from '@nestjs/common';
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

    @Delete('delete/:id')
    async deleteReport(@Param('id') id: string) {
        return this.reportService.deleteReportById(id);
    }

    @Put('edit/:id')
    async replaceReport(@Param('id') id: string, @Body() body: { category?: string; description?: string }) {
        // body.category is expected as string name, e.g. "Physical Violence"
        return this.reportService.updateReportById(id, body);
    }
}