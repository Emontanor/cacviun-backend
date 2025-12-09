import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service';
import { Db } from 'mongodb';
import { ReportDto } from './Dtos/report.dot';
import { ObjectId } from 'mongodb';

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

describe('ReportService', () => {
  let service: ReportService;
  let db: Db;

  const mockCollection = {
    findOne: jest.fn(),
    find: jest.fn(),
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
        ReportService,
        {
          provide: 'MONGO_DB',
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    db = module.get<Db>('MONGO_DB');

    // Reset mocks
    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveReport', () => {
    it('should save report successfully', async () => {
      const reportDto: ReportDto = {
        email: 'test@example.com',
        age: 25,
        description: 'Test incident',
        date: '2024-01-01',
        type: 'Physical Violence',
        location: {
          latitud: '4.635858',
          longitud: '-74.083284',
        },
        sendTime: new Date().toISOString(),
      };

      mockCollection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

      // Mock locationToZone to return a valid zone
      jest.spyOn(service as any, 'locationToZone').mockReturnValue(1);

      const result = await service.saveReport(reportDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Report created assigned to test@example.com');
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });

    it('should handle error when saving report', async () => {
      const reportDto: ReportDto = {
        email: 'test@example.com',
        age: 25,
        description: 'Test incident',
        date: '2024-01-01',
        type: 'Physical Violence',
        location: {
          latitud: '4.635858',
          longitud: '-74.083284',
        },
        sendTime: new Date().toISOString(),
      };

      mockCollection.insertOne.mockRejectedValue(new Error('Database error'));
      jest.spyOn(service as any, 'locationToZone').mockReturnValue(1);

      const result = await service.saveReport(reportDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error creation report on DB');
    });

    it('should handle invalid violence type', async () => {
      const reportDto: ReportDto = {
        email: 'test@example.com',
        age: 25,
        description: 'Test incident',
        date: '2024-01-01',
        type: 'Invalid Type',
        location: {
          latitud: '4.635858',
          longitud: '-74.083284',
        },
        sendTime: new Date().toISOString(),
      };

      jest.spyOn(service as any, 'locationToZone').mockReturnValue(1);

      const result = await service.saveReport(reportDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error creation report on DB');
    });

    it('should handle location outside valid zones', async () => {
      const reportDto: ReportDto = {
        email: 'test@example.com',
        age: 25,
        description: 'Test incident',
        date: '2024-01-01',
        type: 'Physical Violence',
        location: {
          latitud: '0.0',
          longitud: '0.0',
        },
        sendTime: new Date().toISOString(),
      };

      // Let locationToZone throw error for invalid location
      jest.spyOn(service as any, 'locationToZone').mockImplementation(() => {
        throw new Error('Location is not inside any valid zone');
      });

      const result = await service.saveReport(reportDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error creation report on DB');
    });
  });

  describe('reportHistory', () => {
    it('should retrieve user report history successfully', async () => {
      const email = 'test@example.com';
      const mockReports = [
        {
          _id: new ObjectId(),
          user_email: email,
          age: 25,
          description: 'Test incident',
          date: '2024-01-01',
          category: 1,
          zone: 1,
          location: { latitud: '4.635', longitud: '-74.083' },
          creationTime: '2024-01-01T10:00:00Z',
          version: '1',
        },
      ];

      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockReports),
      });

      const result = await service.reportHistory(email);

      expect(result.success).toBe(true);
      expect(result.reportHistory).toBeDefined();
      expect(result.reportHistory[0].category).toBe('Physical Violence');
      expect(result.reportHistory[0].zone).toBe('El Viejo');
      expect(mockCollection.find).toHaveBeenCalledWith({ user_email: email });
    });

    it('should return empty array when user has no reports', async () => {
      const email = 'newuser@example.com';

      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });

      const result = await service.reportHistory(email);

      expect(result.success).toBe(true);
      expect(result.reportHistory).toEqual([]);
    });

    it('should handle error when fetching user history', async () => {
      const email = 'test@example.com';

      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const result = await service.reportHistory(email);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error fetching report history from DB');
    });

    it('should handle unmapped category and zone values', async () => {
      const email = 'test@example.com';
      const mockReports = [
        {
          _id: new ObjectId(),
          user_email: email,
          age: 25,
          description: 'Test incident',
          date: '2024-01-01',
          category: 999, // Unknown category
          zone: 999, // Unknown zone
          location: { latitud: '4.635', longitud: '-74.083' },
          creationTime: '2024-01-01T10:00:00Z',
          version: '1',
        },
      ];

      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockReports),
      });

      const result = await service.reportHistory(email);

      expect(result.success).toBe(true);
      expect(result.reportHistory[0].category).toBe(999); // Falls back to original
      expect(result.reportHistory[0].zone).toBe(999); // Falls back to original
    });
  });

  describe('reportAdminHistory', () => {
    it('should retrieve all reports successfully', async () => {
      const mockReports = [
        {
          _id: new ObjectId(),
          user_email: 'user1@example.com',
          age: 25,
          description: 'Incident 1',
          date: '2024-01-01',
          category: 1,
          zone: 1,
          location: { latitud: '4.635', longitud: '-74.083' },
          creationTime: '2024-01-01T10:00:00Z',
          version: '1',
        },
        {
          _id: new ObjectId(),
          user_email: 'user2@example.com',
          age: 30,
          description: 'Incident 2',
          date: '2024-01-02',
          category: 2,
          zone: 2,
          location: { latitud: '4.636', longitud: '-74.084' },
          creationTime: '2024-01-02T11:00:00Z',
          version: '1',
        },
      ];

      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockReports),
      });

      const result = await service.reportAdminHistory();

      expect(result.success).toBe(true);
      expect(result.reportHistory).toHaveLength(2);
      expect(result.reportHistory[0].category).toBe('Physical Violence');
      expect(result.reportHistory[0].zone).toBe('El Viejo');
      expect(result.reportHistory[1].category).toBe('Psychological Violence');
      expect(result.reportHistory[1].zone).toBe('La Playita');
      expect(mockCollection.find).toHaveBeenCalledWith({});
    });

    it('should return empty array when no reports exist', async () => {
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });

      const result = await service.reportAdminHistory();

      expect(result.success).toBe(true);
      expect(result.reportHistory).toEqual([]);
    });

    it('should handle error when fetching admin history', async () => {
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const result = await service.reportAdminHistory();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error fetching report history from DB');
    });
  });

  describe('deleteReportById', () => {
    it('should delete report successfully', async () => {
      const reportId = '507f1f77bcf86cd799439011';
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await service.deleteReportById(reportId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Report deleted');
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: new ObjectId(reportId),
      });
    });

    it('should return error when report not found', async () => {
      const reportId = '507f1f77bcf86cd799439011';
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await service.deleteReportById(reportId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Report not found');
    });

    it('should handle invalid ObjectId', async () => {
      const reportId = 'invalid-id';

      const result = await service.deleteReportById(reportId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error deleting report');
    });

    it('should handle database error', async () => {
      const reportId = '507f1f77bcf86cd799439011';
      mockCollection.deleteOne.mockRejectedValue(new Error('Database error'));

      const result = await service.deleteReportById(reportId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error deleting report');
    });
  });

  describe('updateReportById', () => {
    it('should update report category successfully', async () => {
      const reportId = '507f1f77bcf86cd799439011';
      const updates = { category: 'Sexual Violence' };

      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 });
      mockCollection.findOne.mockResolvedValue({
        _id: new ObjectId(reportId),
        user_email: 'test@example.com',
        age: 25,
        description: 'Test incident',
        date: '2024-01-01',
        category: 3,
        zone: 1,
        location: { latitud: '4.635', longitud: '-74.083' },
        creationTime: '2024-01-01T10:00:00Z',
        version: '1',
      });

      const result = await service.updateReportById(reportId, updates);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Report updated');
      expect(result.report.category).toBe('Sexual Violence');
      expect(mockCollection.updateOne).toHaveBeenCalled();
    });

    it('should update report description successfully', async () => {
      const reportId = '507f1f77bcf86cd799439011';
      const updates = { description: 'Updated description' };

      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 });
      mockCollection.findOne.mockResolvedValue({
        _id: new ObjectId(reportId),
        user_email: 'test@example.com',
        age: 25,
        description: 'Updated description',
        date: '2024-01-01',
        category: 1,
        zone: 1,
        location: { latitud: '4.635', longitud: '-74.083' },
        creationTime: '2024-01-01T10:00:00Z',
        version: '1',
      });

      const result = await service.updateReportById(reportId, updates);

      expect(result.success).toBe(true);
      expect(result.report.description).toBe('Updated description');
    });

    it('should update both category and description', async () => {
      const reportId = '507f1f77bcf86cd799439011';
      const updates = {
        category: 'Workplace Violence',
        description: 'Updated description',
      };

      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 });
      mockCollection.findOne.mockResolvedValue({
        _id: new ObjectId(reportId),
        user_email: 'test@example.com',
        age: 25,
        description: 'Updated description',
        date: '2024-01-01',
        category: 4,
        zone: 1,
        location: { latitud: '4.635', longitud: '-74.083' },
        creationTime: '2024-01-01T10:00:00Z',
        version: '1',
      });

      const result = await service.updateReportById(reportId, updates);

      expect(result.success).toBe(true);
      expect(result.report.category).toBe('Workplace Violence');
      expect(result.report.description).toBe('Updated description');
    });

    it('should return error when report not found', async () => {
      const reportId = '507f1f77bcf86cd799439011';
      const updates = { category: 'Physical Violence' };

      mockCollection.updateOne.mockResolvedValue({ matchedCount: 0 });

      const result = await service.updateReportById(reportId, updates);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Report not found');
    });

    it('should return error when no updates provided', async () => {
      const reportId = '507f1f77bcf86cd799439011';
      const updates = {};

      const result = await service.updateReportById(reportId, updates);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No updates provided');
    });

    it('should handle error when updated document not found after update', async () => {
      const reportId = '507f1f77bcf86cd799439011';
      const updates = { category: 'Physical Violence' };

      mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 });
      mockCollection.findOne.mockResolvedValue(null);

      const result = await service.updateReportById(reportId, updates);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Report not found');
    });

    it('should handle invalid ObjectId', async () => {
      const reportId = 'invalid-id';
      const updates = { category: 'Physical Violence' };

      const result = await service.updateReportById(reportId, updates);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error updating report');
    });

    it('should handle database errors', async () => {
      const reportId = '507f1f77bcf86cd799439011';
      const updates = { category: 'Physical Violence' };

      mockCollection.updateOne.mockRejectedValue(new Error('Database error'));

      const result = await service.updateReportById(reportId, updates);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error updating report');
    });
  });

  describe('private methods', () => {
    describe('typeDtoToDb', () => {
      it('should convert valid violence types to IDs', () => {
        expect(service['typeDtoToDb']('Physical Violence')).toBe(1);
        expect(service['typeDtoToDb']('Psychological Violence')).toBe(2);
        expect(service['typeDtoToDb']('Sexual Violence')).toBe(3);
        expect(service['typeDtoToDb']('Workplace Violence')).toBe(4);
        expect(service['typeDtoToDb']('Discrimination')).toBe(5);
      });

      it('should throw error for invalid violence type', () => {
        expect(() => service['typeDtoToDb']('Invalid Type')).toThrow(
          'Tipo de violencia no válido: Invalid Type'
        );
      });
    });
  });
});
