import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { VerificationDto } from './Dtos/verification.dto';
import { UserDto } from './Dtos/user.dto';
import { VerificationCodeDto } from './Dtos/verification-code.dto';
import { LoginDto } from './Dtos/login.dto';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    sendVerificationCode: jest.fn(),
    verifyCode: jest.fn(),
    register: jest.fn(),
    login: jest.fn(),
    resetPassword: jest.fn(),
    defineAdmin: jest.fn(),
    existEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendVerificationCode', () => {
    it('should send verification code successfully', async () => {
      const verificationDto: VerificationDto = {
        email: 'test@example.com',
        name: 'Test User',
        type: 'register',
      };

      const expectedResult = { success: true, message: 'Verification code sent' };
      mockUserService.sendVerificationCode.mockResolvedValue(expectedResult);

      const result = await controller.sendVerificationCode(verificationDto);

      expect(result).toEqual(expectedResult);
      expect(service.sendVerificationCode).toHaveBeenCalledWith(verificationDto);
    });

    it('should handle error when sending verification code', async () => {
      const verificationDto: VerificationDto = {
        email: 'test@example.com',
        name: 'Test User',
        type: 'register',
      };

      const expectedResult = { success: false, message: 'Error sending verification code' };
      mockUserService.sendVerificationCode.mockResolvedValue(expectedResult);

      const result = await controller.sendVerificationCode(verificationDto);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('verifyCode', () => {
    it('should verify code successfully', async () => {
      const verificationCodeDto: VerificationCodeDto = {
        email: 'test@example.com',
        code: '123456',
        type: 'register',
      };

      const expectedResult = { success: true, message: 'Code verified' };
      mockUserService.verifyCode.mockResolvedValue(expectedResult);

      const result = await controller.verifyCode(verificationCodeDto);

      expect(result).toEqual(expectedResult);
      expect(service.verifyCode).toHaveBeenCalledWith(verificationCodeDto);
    });

    it('should return error for invalid code', async () => {
      const verificationCodeDto: VerificationCodeDto = {
        email: 'test@example.com',
        code: '000000',
        type: 'register',
      };

      const expectedResult = { success: false, message: 'Invalid code' };
      mockUserService.verifyCode.mockResolvedValue(expectedResult);

      const result = await controller.verifyCode(verificationCodeDto);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const userDto: UserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: '0',
      };

      const expectedResult = { success: true, message: 'Usuario registrado correctamente' };
      mockUserService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(userDto);

      expect(result).toEqual(expectedResult);
      expect(service.register).toHaveBeenCalledWith(userDto);
    });

    it('should return error when user already exists', async () => {
      const userDto: UserDto = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        role: '0',
      };

      const expectedResult = { success: false, message: 'Usuario ya existente' };
      mockUserService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(userDto);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResult = {
        success: true,
        session: {
          name: 'Test User',
          email: 'test@example.com',
          role: '0',
        },
      };
      mockUserService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResult);
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });

    it('should return error for invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const expectedResult = { success: false, message: 'Contraseña no coincide' };
      mockUserService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResult);
    });

    it('should return error for non-existent user', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const expectedResult = { success: false, message: 'No existe el usuario' };
      mockUserService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetData = { email: 'test@example.com', password: 'newpassword123' };

      const expectedResult = { success: true, message: 'Contraseña actualizada' };
      mockUserService.resetPassword.mockResolvedValue(expectedResult);

      const result = await controller.resetPassword(resetData);

      expect(result).toEqual(expectedResult);
      expect(service.resetPassword).toHaveBeenCalledWith(resetData);
    });

    it('should return error when user not found', async () => {
      const resetData = { email: 'nonexistent@example.com', password: 'newpassword123' };

      const expectedResult = { success: false, message: 'User not found' };
      mockUserService.resetPassword.mockResolvedValue(expectedResult);

      const result = await controller.resetPassword(resetData);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('defineAdmin', () => {
    it('should define admin successfully', async () => {
      const adminData = { email: 'test@example.com' };

      const expectedResult = { success: true, message: 'Role updated' };
      mockUserService.defineAdmin.mockResolvedValue(expectedResult);

      const result = await controller.defineAdmin(adminData);

      expect(result).toEqual(expectedResult);
      expect(service.defineAdmin).toHaveBeenCalledWith(adminData);
    });

    it('should return error when user not found', async () => {
      const adminData = { email: 'nonexistent@example.com' };

      const expectedResult = { success: false, message: 'User not found' };
      mockUserService.defineAdmin.mockResolvedValue(expectedResult);

      const result = await controller.defineAdmin(adminData);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('existEmail', () => {
    it('should return true when email exists', async () => {
      const email = 'existing@example.com';

      const expectedResult = { success: true, exist: true };
      mockUserService.existEmail.mockResolvedValue(expectedResult);

      const result = await controller.existEmail(email);

      expect(result).toEqual(expectedResult);
      expect(service.existEmail).toHaveBeenCalledWith(email);
    });

    it('should return false when email does not exist', async () => {
      const email = 'nonexistent@example.com';

      const expectedResult = { success: true, exist: false };
      mockUserService.existEmail.mockResolvedValue(expectedResult);

      const result = await controller.existEmail(email);

      expect(result).toEqual(expectedResult);
    });

    it('should handle error when checking email', async () => {
      const email = 'test@example.com';

      const expectedResult = { success: false, message: 'Error buscando el correo' };
      mockUserService.existEmail.mockResolvedValue(expectedResult);

      const result = await controller.existEmail(email);

      expect(result).toEqual(expectedResult);
    });
  });
});
