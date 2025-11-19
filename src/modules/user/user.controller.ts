import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { VerificationDto } from './Dtos/verification.dto';
import { UserDto } from './Dtos/user.dto';
import type { VerificationCodeDto } from './Dtos/verification-code.dto';

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




}