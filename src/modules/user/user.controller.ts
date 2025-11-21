import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { VerificationDto } from './Dtos/verification.dto';
import { UserDto } from './Dtos/user.dto';
import type { VerificationCodeDto } from './Dtos/verification-code.dto';
import { LoginDto } from './Dtos/login.dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('send-verification-code')
    async sendVerificationCode(@Body() data: VerificationDto) {
        return await this.userService.sendVerificationCode(data);
    }

    @Post('verify-code')
    async verifyCode(@Body() data : VerificationCodeDto) {
        return await this.userService.verifyCode(data);
    }

    @Post('register')
    async register(@Body() data : UserDto) {
        return await this.userService.register(data);
    }

    @Post('login')
    async login(@Body() data: LoginDto){
        return await this.userService.login(data)
    }

    @Post('reset-password')
    async resetPassword(@Body() data: {email: string, password: string}){
        return await this.userService.resetPassword(data);
    }

    @Post('define-admin')
    async defineAdmin(@Body() data: {email: string}){
        return await this.userService.defineAdmin(data);
    }

    @Get('exist-email/:email')
    async existEmail(@Param('email') email: string){
        return await this.userService.existEmail(email);
    }
}