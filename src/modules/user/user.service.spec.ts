import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Db } from 'mongodb';
import { VerificationDto } from './Dtos/verification.dto';
import { UserDto } from './Dtos/user.dto';
import { LoginDto } from './Dtos/login.dto';
import { VerificationCodeDto } from './Dtos/verification-code.dto';

// Mock MailerSend module
jest.mock('mailersend', () => {
  return {
    MailerSend: jest.fn().mockImplementation(() => ({
      email: {
        send: jest.fn().mockResolvedValue({ statusCode: 202 }),
      },
    })),
    EmailParams: jest.fn().mockImplementation(() => ({
      setFrom: jest.fn().mockReturnThis(),
      setTo: jest.fn().mockReturnThis(),
      setSubject: jest.fn().mockReturnThis(),
      setHtml: jest.fn().mockReturnThis(),
    })),
    Sender: jest.fn(),
    Recipient: jest.fn(),
  };
});

// Suppress console logs globally for this test suite
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('UserService', () => {
  let service: UserService;
  let db: Db;

  const mockCollection = {
    findOne: jest.fn(),
    insertOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };

  const mockDb = {
    collection: jest.fn().mockReturnValue(mockCollection),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: 'MONGO_DB',
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    db = module.get<Db>('MONGO_DB');

    // Reset environment variables
    process.env.MAILERSEND_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationCode', () => {
    it('should send verification code successfully', async () => {
      const verificationDto: VerificationDto = {
        email: 'test@example.com',
        name: 'Test User',
        type: 'register',
      };

      mockCollection.findOne.mockResolvedValue(null);
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 });

      const result = await service.sendVerificationCode(verificationDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Verification code sent');
      expect(mockCollection.updateOne).toHaveBeenCalled();
    });

    it('should handle missing name by fetching from database', async () => {
      const verificationDto: VerificationDto = {
        email: 'test@example.com',
        type: 'register',
      };

      mockCollection.findOne.mockResolvedValue({ name: 'Database User' });
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 });

      const result = await service.sendVerificationCode(verificationDto);

      expect(result.success).toBe(true);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ email: verificationDto.email });
    });

    it('should handle errors during email sending', async () => {
      const verificationDto: VerificationDto = {
        email: 'test@example.com',
        name: 'Test User',
        type: 'register',
      };

      mockCollection.findOne.mockResolvedValue(null);
      mockCollection.updateOne.mockRejectedValue(new Error('Database error'));

      const result = await service.sendVerificationCode(verificationDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error sending verification code');
    });
  });

  describe('verifyCode', () => {
    it('should verify code successfully', async () => {
      const verificationCodeDto: VerificationCodeDto = {
        email: 'test@example.com',
        code: '123456',
        type: 'register',
      };

      mockCollection.findOne.mockResolvedValue({
        email: 'test@example.com',
        code: 'hashed-code',
        type: 'register',
      });

      jest.spyOn(service as any, 'compareEncrypted').mockResolvedValue(true);
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await service.verifyCode(verificationCodeDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Code verified');
      expect(mockCollection.deleteOne).toHaveBeenCalled();
    });

    it('should return error for invalid code', async () => {
      const verificationCodeDto: VerificationCodeDto = {
        email: 'test@example.com',
        code: '000000',
        type: 'register',
      };

      mockCollection.findOne.mockResolvedValue({
        email: 'test@example.com',
        code: 'hashed-code',
        type: 'register',
      });

      jest.spyOn(service as any, 'compareEncrypted').mockResolvedValue(false);

      const result = await service.verifyCode(verificationCodeDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid code');
    });

    it('should return error when no verification record found', async () => {
      const verificationCodeDto: VerificationCodeDto = {
        email: 'test@example.com',
        code: '123456',
        type: 'register',
      };

      mockCollection.findOne.mockResolvedValue(null);

      const result = await service.verifyCode(verificationCodeDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid code');
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

      mockCollection.findOne.mockResolvedValue(null);
      mockCollection.insertOne.mockResolvedValue({ insertedId: 'new-id' });

      const result = await service.register(userDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Usuario registrado correctamente');
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });

    it('should return error when user already exists', async () => {
      const userDto: UserDto = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        role: '0',
      };

      mockCollection.findOne.mockResolvedValue({
        email: 'existing@example.com',
      });

      const result = await service.register(userDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Usuario ya existente');
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should handle database errors during registration', async () => {
      const userDto: UserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: '0',
      };

      mockCollection.findOne.mockResolvedValue(null);
      mockCollection.insertOne.mockRejectedValue(new Error('Database error'));

      const result = await service.register(userDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error registrando usuario');
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockCollection.findOne.mockResolvedValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        role: '0',
      });

      jest.spyOn(service as any, 'compareEncrypted').mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result.success).toBe(true);
      expect(result.session).toEqual({
        name: 'Test User',
        email: 'test@example.com',
        role: '0',
      });
    });

    it('should return error for non-existent user', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockCollection.findOne.mockResolvedValue(null);

      const result = await service.login(loginDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No existe el usuario');
    });

    it('should return error for invalid password', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockCollection.findOne.mockResolvedValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        role: '0',
      });

      jest.spyOn(service as any, 'compareEncrypted').mockResolvedValue(false);

      const result = await service.login(loginDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Contraseña no coincide');
    });

    it('should handle database errors during login', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockCollection.findOne.mockRejectedValue(new Error('Database error'));

      const result = await service.login(loginDto);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Database error');
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetData = { email: 'test@example.com', password: 'newpassword123' };

      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 });

      const result = await service.resetPassword(resetData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Contraseña actualizada');
    });

    it('should return error when user not found', async () => {
      const resetData = { email: 'nonexistent@example.com', password: 'newpassword123' };

      mockCollection.updateOne.mockResolvedValue({ matchedCount: 0 });

      const result = await service.resetPassword(resetData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
    });

    it('should handle database errors during password reset', async () => {
      const resetData = {
        email: 'test@example.com',
        password: 'newpassword123',
      };

      mockCollection.updateOne.mockRejectedValue(new Error('Database error'));

      const result = await service.resetPassword(resetData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error buscando el correo');
    });
  });

  describe('existEmail', () => {
    it('should return true when email exists', async () => {
      mockCollection.findOne.mockResolvedValue({ email: 'existing@example.com' });

      const result = await service.existEmail('existing@example.com');

      expect(result.success).toBe(true);
      expect(result.exist).toBe(true);
    });

    it('should return false when email does not exist', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await service.existEmail('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result.exist).toBe(false);
    });

    it('should handle database errors', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('Database error'));

      const result = await service.existEmail('test@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error buscando el correo');
    });
  });

  describe('defineAdmin', () => {
    it('should define admin successfully', async () => {
      const adminData = { email: 'test@example.com' };

      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 });

      const result = await service.defineAdmin(adminData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Role updated');
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { email: adminData.email },
        { $set: { role: '1' } }
      );
    });

    it('should return error when user not found', async () => {
      const adminData = { email: 'nonexistent@example.com' };

      mockCollection.updateOne.mockResolvedValue({ matchedCount: 0 });

      const result = await service.defineAdmin(adminData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
    });

    it('should handle database errors', async () => {
      const adminData = { email: 'test@example.com' };

      mockCollection.updateOne.mockRejectedValue(new Error('Database error'));

      const result = await service.defineAdmin(adminData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error buscando el correo');
    });
  });

  describe('encryption methods', () => {
    it('should encrypt data', async () => {
      const data = 'password123';
      const encrypted = await service['encrypt'](data);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(data);
    });

    it('should compare encrypted data correctly', async () => {
      const data = 'password123';
      const encrypted = await service['encrypt'](data);
      const isMatch = await service['compareEncrypted'](data, encrypted);

      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const data = 'password123';
      const wrongData = 'wrongpassword';
      const encrypted = await service['encrypt'](data);
      const isMatch = await service['compareEncrypted'](wrongData, encrypted);

      expect(isMatch).toBe(false);
    });
  });
});
