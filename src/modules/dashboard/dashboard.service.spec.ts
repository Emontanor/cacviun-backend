import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { Db } from 'mongodb';
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

describe('DashboardService', () => {
  let service: DashboardService;
  let db: Db;

  const mockCollection = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockDb = {
    collection: jest.fn().mockReturnValue(mockCollection),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: 'MONGO_DB',
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    db = module.get<Db>('MONGO_DB');

    // Reset mocks
    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLocations', () => {
    it('should return locations successfully', async () => {
      const mockReports = [
        {
          _id: new ObjectId(),
          user_email: 'user1@example.com',
          location: { latitud: '4.635', longitud: '-74.083' },
        },
        {
          _id: new ObjectId(),
          user_email: 'user2@example.com',
          location: { latitud: '4.636', longitud: '-74.084' },
        },
      ];

      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockReports),
      });

      const result = await service.getLocations();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({ latitud: '4.635', longitud: '-74.083' });
      expect(result.data[1]).toEqual({ latitud: '4.636', longitud: '-74.084' });
    });

    it('should filter out reports without location', async () => {
      const mockReports = [
        {
          _id: new ObjectId(),
          user_email: 'user1@example.com',
          location: { latitud: '4.635', longitud: '-74.083' },
        },
        {
          _id: new ObjectId(),
          user_email: 'user2@example.com',
          location: {},
        },
        {
          _id: new ObjectId(),
          user_email: 'user3@example.com',
        },
      ];

      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockReports),
      });

      const result = await service.getLocations();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({ latitud: '4.635', longitud: '-74.083' });
    });

    it('should return empty array when no reports exist', async () => {
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getLocations();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle error when fetching locations', async () => {
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const result = await service.getLocations();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error fetching locations');
    });
  });

  describe('getRecentViolenceReports', () => {
    it('should return recent violence reports successfully', async () => {
      const mockReports = [
        {
          _id: new ObjectId(),
          date: '2024-01-02',
          category: 2,
          creationTime: '2024-01-02T11:00:00Z',
          location: { latitud: '4.636', longitud: '-74.084' },
        },
        {
          _id: new ObjectId(),
          date: '2024-01-01',
          category: 1,
          creationTime: '2024-01-01T10:00:00Z',
          location: { latitud: '4.635', longitud: '-74.083' },
        },
      ];

      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockReports),
          }),
        }),
      });

      const result = await service.getRecentViolenceReports();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].categoryLabel).toBe('Psychological Violence');
      expect(result.data[1].categoryLabel).toBe('Physical Violence');
      expect(mockCollection.find).toHaveBeenCalledWith(
        {},
        {
          projection: {
            date: 1,
            category: 1,
            creationTime: 1,
            'location.latitud': 1,
            'location.longitud': 1,
          },
        },
      );
    });

    it('should limit results to 20 reports', async () => {
      const mockReports = Array.from({ length: 25 }, (_, i) => ({
        _id: new ObjectId(),
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        category: (i % 5) + 1,
        creationTime: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
        location: { latitud: '4.635', longitud: '-74.083' },
      }));

      const limitMock = jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockReports.slice(0, 20)),
      });

      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: limitMock,
        }),
      });

      const result = await service.getRecentViolenceReports();

      expect(result.success).toBe(true);
      expect(limitMock).toHaveBeenCalledWith(20);
      expect(result.data.length).toBeLessThanOrEqual(20);
    });

    it('should filter out reports with missing required fields', async () => {
      const mockReports = [
        {
          _id: new ObjectId(),
          date: '2024-01-01',
          category: 1,
          creationTime: '2024-01-01T10:00:00Z',
          location: { latitud: '4.635', longitud: '-74.083' },
        },
        {
          _id: new ObjectId(),
          // Missing date
          category: 2,
          creationTime: '2024-01-02T10:00:00Z',
          location: { latitud: '4.636', longitud: '-74.084' },
        },
        {
          _id: new ObjectId(),
          date: '2024-01-03',
          // Missing category
          creationTime: '2024-01-03T10:00:00Z',
          location: { latitud: '4.637', longitud: '-74.085' },
        },
        {
          _id: new ObjectId(),
          date: '2024-01-04',
          category: 3,
          creationTime: '2024-01-04T10:00:00Z',
          location: {},
        },
      ];

      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockReports),
          }),
        }),
      });

      const result = await service.getRecentViolenceReports();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].date).toBe('2024-01-01');
    });

    it('should map category IDs to labels correctly', async () => {
      const mockReports = [
        {
          _id: new ObjectId(),
          date: '2024-01-01',
          category: 1,
          creationTime: '2024-01-01T10:00:00Z',
          location: { latitud: '4.635', longitud: '-74.083' },
        },
        {
          _id: new ObjectId(),
          date: '2024-01-02',
          category: 2,
          creationTime: '2024-01-02T10:00:00Z',
          location: { latitud: '4.636', longitud: '-74.084' },
        },
        {
          _id: new ObjectId(),
          date: '2024-01-03',
          category: 3,
          creationTime: '2024-01-03T10:00:00Z',
          location: { latitud: '4.637', longitud: '-74.085' },
        },
        {
          _id: new ObjectId(),
          date: '2024-01-04',
          category: 4,
          creationTime: '2024-01-04T10:00:00Z',
          location: { latitud: '4.638', longitud: '-74.086' },
        },
        {
          _id: new ObjectId(),
          date: '2024-01-05',
          category: 5,
          creationTime: '2024-01-05T10:00:00Z',
          location: { latitud: '4.639', longitud: '-74.087' },
        },
      ];

      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockReports),
          }),
        }),
      });

      const result = await service.getRecentViolenceReports();

      expect(result.success).toBe(true);
      expect(result.data[0].categoryLabel).toBe('Physical Violence');
      expect(result.data[1].categoryLabel).toBe('Psychological Violence');
      expect(result.data[2].categoryLabel).toBe('Sexual Violence');
      expect(result.data[3].categoryLabel).toBe('Workplace Violence');
      expect(result.data[4].categoryLabel).toBe('Discrimination');
    });

    it('should handle unmapped category values', async () => {
      const mockReports = [
        {
          _id: new ObjectId(),
          date: '2024-01-01',
          category: 999,
          creationTime: '2024-01-01T10:00:00Z',
          location: { latitud: '4.635', longitud: '-74.083' },
        },
      ];

      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockReports),
          }),
        }),
      });

      const result = await service.getRecentViolenceReports();

      expect(result.success).toBe(true);
      expect(result.data[0].categoryLabel).toBe(999);
    });

    it('should return empty array when no reports exist', async () => {
      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getRecentViolenceReports();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle error when fetching recent reports', async () => {
      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            toArray: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      const result = await service.getRecentViolenceReports();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error fetching recent violence reports');
    });

    it('should sort by creationTime and _id in descending order', async () => {
      const sortMock = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
      });

      mockCollection.find.mockReturnValue({
        sort: sortMock,
      });

      await service.getRecentViolenceReports();

      expect(sortMock).toHaveBeenCalledWith({ creationTime: -1, _id: -1 });
    });
  });

  describe('reportAdminHistory', () => {
    it('should return all reports with mapped values successfully', async () => {
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

    it('should handle unmapped category and zone values', async () => {
      const mockReports = [
        {
          _id: new ObjectId(),
          user_email: 'user1@example.com',
          age: 25,
          description: 'Incident',
          date: '2024-01-01',
          category: 999,
          zone: 999,
          location: { latitud: '4.635', longitud: '-74.083' },
          creationTime: '2024-01-01T10:00:00Z',
          version: '1',
        },
      ];

      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockReports),
      });

      const result = await service.reportAdminHistory();

      expect(result.success).toBe(true);
      expect(result.reportHistory[0].category).toBe('999');
      expect(result.reportHistory[0].zone).toBe('999');
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

    it('should map all violence types correctly', async () => {
      const mockReports = [
        {
          _id: new ObjectId(),
          user_email: 'user1@example.com',
          category: 1,
          zone: 1,
          date: '2024-01-01',
        },
        {
          _id: new ObjectId(),
          user_email: 'user2@example.com',
          category: 2,
          zone: 2,
          date: '2024-01-02',
        },
        {
          _id: new ObjectId(),
          user_email: 'user3@example.com',
          category: 3,
          zone: 3,
          date: '2024-01-03',
        },
        {
          _id: new ObjectId(),
          user_email: 'user4@example.com',
          category: 4,
          zone: 4,
          date: '2024-01-04',
        },
        {
          _id: new ObjectId(),
          user_email: 'user5@example.com',
          category: 5,
          zone: 5,
          date: '2024-01-05',
        },
      ];

      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockReports),
      });

      const result = await service.reportAdminHistory();

      expect(result.success).toBe(true);
      expect(result.reportHistory[0].category).toBe('Physical Violence');
      expect(result.reportHistory[1].category).toBe('Psychological Violence');
      expect(result.reportHistory[2].category).toBe('Sexual Violence');
      expect(result.reportHistory[3].category).toBe('Workplace Violence');
      expect(result.reportHistory[4].category).toBe('Discrimination');
    });

    it('should map sample zones correctly', async () => {
      const mockReports = [
        {
          _id: new ObjectId(),
          user_email: 'user1@example.com',
          category: 1,
          zone: 1,
          date: '2024-01-01',
        },
        {
          _id: new ObjectId(),
          user_email: 'user2@example.com',
          category: 1,
          zone: 10,
          date: '2024-01-02',
        },
        {
          _id: new ObjectId(),
          user_email: 'user3@example.com',
          category: 1,
          zone: 30,
          date: '2024-01-03',
        },
      ];

      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockReports),
      });

      const result = await service.reportAdminHistory();

      expect(result.success).toBe(true);
      expect(result.reportHistory[0].zone).toBe('El Viejo');
      expect(result.reportHistory[1].zone).toBe('Humanas');
      expect(result.reportHistory[2].zone).toBe('Complejo Deportivo');
    });
  });
});
