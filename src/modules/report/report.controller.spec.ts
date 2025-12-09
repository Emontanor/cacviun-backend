import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportDto } from './Dtos/report.dot';

describe('ReportController', () => {
  let controller: ReportController;
  let service: ReportService;

  const mockReportService = {
    saveReport: jest.fn(),
    reportHistory: jest.fn(),
    reportAdminHistory: jest.fn(),
    deleteReportById: jest.fn(),
    updateReportById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        {
          provide: ReportService,
          useValue: mockReportService,
        },
      ],
    }).compile();

    controller = module.get<ReportController>(ReportController);
    service = module.get<ReportService>(ReportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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
          latitud: '4.635',
          longitud: '-74.083',
        },
        sendTime: new Date().toISOString(),
      };

      const expectedResult = {
        success: true,
        message: 'Report created assigned to test@example.com',
      };

      mockReportService.saveReport.mockResolvedValue(expectedResult);

      const result = await controller.saveReport(reportDto);

      expect(result).toEqual(expectedResult);
      expect(service.saveReport).toHaveBeenCalledWith(reportDto);
    });

    it('should handle error when saving report', async () => {
      const reportDto: ReportDto = {
        email: 'test@example.com',
        age: 25,
        description: 'Test incident',
        date: '2024-01-01',
        type: 'Physical Violence',
        location: {
          latitud: '4.635',
          longitud: '-74.083',
        },
        sendTime: new Date().toISOString(),
      };

      const expectedResult = {
        success: false,
        message: 'Error creation report on DB',
      };

      mockReportService.saveReport.mockResolvedValue(expectedResult);

      const result = await controller.saveReport(reportDto);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('reportHistory', () => {
    it('should retrieve user report history successfully', async () => {
      const email = 'test@example.com';
      const expectedResult = {
        success: true,
        reportHistory: [
          {
            _id: '123',
            user_email: email,
            age: 25,
            description: 'Test incident',
            date: '2024-01-01',
            category: 'Physical Violence',
            zone: 'El Viejo',
            location: { latitud: '4.635', longitud: '-74.083' },
            creationTime: '2024-01-01T10:00:00Z',
            version: '1',
          },
        ],
      };

      mockReportService.reportHistory.mockResolvedValue(expectedResult);

      const result = await controller.reportHistory(email);

      expect(result).toEqual(expectedResult);
      expect(service.reportHistory).toHaveBeenCalledWith(email);
    });

    it('should return empty history when user has no reports', async () => {
      const email = 'newuser@example.com';
      const expectedResult = {
        success: true,
        reportHistory: [],
      };

      mockReportService.reportHistory.mockResolvedValue(expectedResult);

      const result = await controller.reportHistory(email);

      expect(result).toEqual(expectedResult);
    });

    it('should handle error when fetching user history', async () => {
      const email = 'test@example.com';
      const expectedResult = {
        success: false,
        message: 'Error fetching report history from DB',
      };

      mockReportService.reportHistory.mockResolvedValue(expectedResult);

      const result = await controller.reportHistory(email);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('reportAdminHistory', () => {
    it('should retrieve all reports for admin successfully', async () => {
      const expectedResult = {
        success: true,
        reportHistory: [
          {
            _id: '123',
            user_email: 'user1@example.com',
            age: 25,
            description: 'Incident 1',
            date: '2024-01-01',
            category: 'Physical Violence',
            zone: 'El Viejo',
            location: { latitud: '4.635', longitud: '-74.083' },
            creationTime: '2024-01-01T10:00:00Z',
            version: '1',
          },
          {
            _id: '124',
            user_email: 'user2@example.com',
            age: 30,
            description: 'Incident 2',
            date: '2024-01-02',
            category: 'Psychological Violence',
            zone: 'La Playita',
            location: { latitud: '4.636', longitud: '-74.084' },
            creationTime: '2024-01-02T11:00:00Z',
            version: '1',
          },
        ],
      };

      mockReportService.reportAdminHistory.mockResolvedValue(expectedResult);

      const result = await controller.reportAdminHistory();

      expect(result).toEqual(expectedResult);
      expect(service.reportAdminHistory).toHaveBeenCalled();
    });

    it('should handle error when fetching admin history', async () => {
      const expectedResult = {
        success: false,
        message: 'Error fetching report history from DB',
      };

      mockReportService.reportAdminHistory.mockResolvedValue(expectedResult);

      const result = await controller.reportAdminHistory();

      expect(result).toEqual(expectedResult);
    });
  });

  describe('deleteReport', () => {
    it('should delete report successfully', async () => {
      const reportId = '507f1f77bcf86cd799439011';
      const expectedResult = {
        success: true,
        message: 'Report deleted',
      };

      mockReportService.deleteReportById.mockResolvedValue(expectedResult);

      const result = await controller.deleteReport(reportId);

      expect(result).toEqual(expectedResult);
      expect(service.deleteReportById).toHaveBeenCalledWith(reportId);
    });

    it('should return error when report not found', async () => {
      const reportId = '507f1f77bcf86cd799439011';
      const expectedResult = {
        success: false,
        message: 'Report not found',
      };

      mockReportService.deleteReportById.mockResolvedValue(expectedResult);

      const result = await controller.deleteReport(reportId);

      expect(result).toEqual(expectedResult);
    });

    it('should handle error when deleting report', async () => {
      const reportId = 'invalid-id';
      const expectedResult = {
        success: false,
        message: 'Error deleting report',
      };

      mockReportService.deleteReportById.mockResolvedValue(expectedResult);

      const result = await controller.deleteReport(reportId);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('replaceReport', () => {
    it('should update report category successfully', async () => {
      const reportId = '507f1f77bcf86cd799439011';
      const updateBody = { category: 'Sexual Violence' };

      const expectedResult = {
        success: true,
        message: 'Report updated',
        report: {
          _id: reportId,
          user_email: 'test@example.com',
          age: 25,
          description: 'Original description',
          date: '2024-01-01',
          category: 'Sexual Violence',
          zone: 'El Viejo',
          location: { latitud: '4.635', longitud: '-74.083' },
          creationTime: '2024-01-01T10:00:00Z',
          version: '1',
        },
      };

      mockReportService.updateReportById.mockResolvedValue(expectedResult);

      const result = await controller.replaceReport(reportId, updateBody);

      expect(result).toEqual(expectedResult);
      expect(service.updateReportById).toHaveBeenCalledWith(reportId, updateBody);
    });

    it('should update report description successfully', async () => {
      const reportId = '507f1f77bcf86cd799439011';
      const updateBody = { description: 'Updated description' };

      const expectedResult = {
        success: true,
        message: 'Report updated',
        report: {
          _id: reportId,
          user_email: 'test@example.com',
          age: 25,
          description: 'Updated description',
          date: '2024-01-01',
          category: 'Physical Violence',
          zone: 'El Viejo',
          location: { latitud: '4.635', longitud: '-74.083' },
          creationTime: '2024-01-01T10:00:00Z',
          version: '1',
        },
      };

      mockReportService.updateReportById.mockResolvedValue(expectedResult);

      const result = await controller.replaceReport(reportId, updateBody);

      expect(result).toEqual(expectedResult);
    });

    it('should update both category and description', async () => {
      const reportId = '507f1f77bcf86cd799439011';
      const updateBody = {
        category: 'Workplace Violence',
        description: 'Updated description',
      };

      const expectedResult = {
        success: true,
        message: 'Report updated',
        report: {
          _id: reportId,
          user_email: 'test@example.com',
          age: 25,
          description: 'Updated description',
          date: '2024-01-01',
          category: 'Workplace Violence',
          zone: 'El Viejo',
          location: { latitud: '4.635', longitud: '-74.083' },
          creationTime: '2024-01-01T10:00:00Z',
          version: '1',
        },
      };

      mockReportService.updateReportById.mockResolvedValue(expectedResult);

      const result = await controller.replaceReport(reportId, updateBody);

      expect(result).toEqual(expectedResult);
      expect(service.updateReportById).toHaveBeenCalledWith(reportId, updateBody);
    });

    it('should return error when report not found', async () => {
      const reportId = '507f1f77bcf86cd799439011';
      const updateBody = { category: 'Physical Violence' };

      const expectedResult = {
        success: false,
        message: 'Report not found',
      };

      mockReportService.updateReportById.mockResolvedValue(expectedResult);

      const result = await controller.replaceReport(reportId, updateBody);

      expect(result).toEqual(expectedResult);
    });

    it('should return error when no updates provided', async () => {
      const reportId = '507f1f77bcf86cd799439011';
      const updateBody = {};

      const expectedResult = {
        success: false,
        message: 'No updates provided',
      };

      mockReportService.updateReportById.mockResolvedValue(expectedResult);

      const result = await controller.replaceReport(reportId, updateBody);

      expect(result).toEqual(expectedResult);
    });

    it('should handle error when updating report', async () => {
      const reportId = 'invalid-id';
      const updateBody = { category: 'Physical Violence' };

      const expectedResult = {
        success: false,
        message: 'Error updating report',
      };

      mockReportService.updateReportById.mockResolvedValue(expectedResult);

      const result = await controller.replaceReport(reportId, updateBody);

      expect(result).toEqual(expectedResult);
    });
  });
});
