import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  const mockDashboardService = {
    getLocations: jest.fn(),
    getRecentViolenceReports: jest.fn(),
    reportAdminHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLocations', () => {
    it('should return locations successfully', async () => {
      const expectedResult = {
        success: true,
        data: [
          { latitud: '4.635', longitud: '-74.083' },
          { latitud: '4.636', longitud: '-74.084' },
        ],
      };

      mockDashboardService.getLocations.mockResolvedValue(expectedResult);

      const result = await controller.getLocations();

      expect(result).toEqual(expectedResult);
      expect(service.getLocations).toHaveBeenCalled();
    });

    it('should return empty array when no locations exist', async () => {
      const expectedResult = {
        success: true,
        data: [],
      };

      mockDashboardService.getLocations.mockResolvedValue(expectedResult);

      const result = await controller.getLocations();

      expect(result).toEqual(expectedResult);
    });

    it('should handle error when fetching locations', async () => {
      const expectedResult = {
        success: false,
        message: 'Error fetching locations',
      };

      mockDashboardService.getLocations.mockResolvedValue(expectedResult);

      const result = await controller.getLocations();

      expect(result).toEqual(expectedResult);
    });
  });

  describe('getRecentViolence', () => {
    it('should return recent violence reports successfully', async () => {
      const expectedResult = {
        success: true,
        data: [
          {
            date: '2024-01-01',
            categoryId: 1,
            categoryLabel: 'Physical Violence',
            latitud: '4.635',
            longitud: '-74.083',
          },
          {
            date: '2024-01-02',
            categoryId: 2,
            categoryLabel: 'Psychological Violence',
            latitud: '4.636',
            longitud: '-74.084',
          },
        ],
      };

      mockDashboardService.getRecentViolenceReports.mockResolvedValue(expectedResult);

      const result = await controller.getRecentViolence();

      expect(result).toEqual(expectedResult);
      expect(service.getRecentViolenceReports).toHaveBeenCalled();
    });

    it('should return empty array when no recent reports exist', async () => {
      const expectedResult = {
        success: true,
        data: [],
      };

      mockDashboardService.getRecentViolenceReports.mockResolvedValue(expectedResult);

      const result = await controller.getRecentViolence();

      expect(result).toEqual(expectedResult);
    });

    it('should handle error when fetching recent violence reports', async () => {
      const expectedResult = {
        success: false,
        message: 'Error fetching recent violence reports',
      };

      mockDashboardService.getRecentViolenceReports.mockResolvedValue(expectedResult);

      const result = await controller.getRecentViolence();

      expect(result).toEqual(expectedResult);
    });
  });

  describe('reportAdminHistory', () => {
    it('should return admin report history successfully', async () => {
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

      mockDashboardService.reportAdminHistory.mockResolvedValue(expectedResult);

      const result = await controller.reportAdminHistory();

      expect(result).toEqual(expectedResult);
      expect(service.reportAdminHistory).toHaveBeenCalled();
    });

    it('should return empty array when no reports exist', async () => {
      const expectedResult = {
        success: true,
        reportHistory: [],
      };

      mockDashboardService.reportAdminHistory.mockResolvedValue(expectedResult);

      const result = await controller.reportAdminHistory();

      expect(result).toEqual(expectedResult);
    });

    it('should handle error when fetching admin history', async () => {
      const expectedResult = {
        success: false,
        message: 'Error fetching report history from DB',
      };

      mockDashboardService.reportAdminHistory.mockResolvedValue(expectedResult);

      const result = await controller.reportAdminHistory();

      expect(result).toEqual(expectedResult);
    });
  });
});
