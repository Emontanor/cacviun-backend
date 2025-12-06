import { Controller, Post, Get, Body, Param, Delete, Put} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
// import { DashboardDto } from './Dtos/dashboard.dot';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}
    @Get('get-locations')
    async getLocations() {
        return this.dashboardService.getLocations();
    }

    @Get('recent-violence')
    async getRecentViolence() {
        return this.dashboardService.getRecentViolenceReports();
    }

    @Get('get-data')
    async reportAdminHistory(){
        return await this.dashboardService.reportAdminHistory();
    }
}