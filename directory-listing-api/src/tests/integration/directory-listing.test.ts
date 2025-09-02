import request from 'supertest';
import express from 'express';
import directoryListingRoutes from '../../routes/directoryListingRoutes';
import { DirectoryListingService } from '../../services/DirectoryListingService';
import { DirectoryListing } from '../../models/DirectoryListing';

jest.mock('../src/services/DirectoryListingService');

describe('Directory Listing API Integration Tests', () => {
  let app: express.Application;
  let directoryListingService: jest.Mocked<DirectoryListingService>;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/directoryListing', directoryListingRoutes);
  });

  beforeEach(() => {
    directoryListingService = new DirectoryListingService() as jest.Mocked<DirectoryListingService>;
    jest.clearAllMocks();
  });

  describe('Large directory endpoints', () => {
    it('GET /directory should handle large directories with pagination', async () => {
      const mockResponse = {
        path: '/large-dir',
        items: Array(1000).fill(0).map((_, i) => ({
          name: `file${i}.txt`,
          path: `/large-dir/file${i}.txt`,
          size: 1024,
          extension: '.txt',
          type: 'file',
          created: new Date(),
          permissions: '-rw-r--r--',
          attributes: ['file']
        })),
        totalCount: 100000,
        page: 1,
        pageSize: 1000,
        totalPages: 100
      } as DirectoryListing;

      directoryListingService.getDirectoryListing.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/api/directoryListing/directory')
        .query({ path: '/large-dir', page: 1, pageSize: 1000 });

      expect(response.status).toBe(200);
      expect(response.body.totalCount).toBe(100000);
      expect(response.body.items).toHaveLength(1000);
      expect(response.body.totalPages).toBe(100);
    });

    it('GET /directory should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/directoryListing/directory')
        .query({ path: '/large-dir', page: 0, pageSize: 10000 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Page must be');
    });

    it('GET /directory should handle timeouts gracefully', async () => {
      directoryListingService.getDirectoryListing.mockRejectedValue(
        new Error('Operation timed out')
      );

      const response = await request(app)
        .get('/api/directoryListing/directory')
        .query({ path: '/very-large-dir', page: 1, pageSize: 1000 });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Failed to retrieve');
    });
  });

  describe('Performance metrics', () => {
    it('should respond within acceptable time for large directories', async () => {
      const mockResponse = {
        path: '/large-dir',
        items: Array(1000).fill(0).map((_, i) => ({
          name: `file${i}.txt`,
          path: `/large-dir/file${i}.txt`,
          size: 1024,
          extension: '.txt',
          type: 'file',
          created: new Date(),
          permissions: '-rw-r--r--',
          attributes: ['file']
        })),
        totalCount: 100000,
        page: 1,
        pageSize: 1000,
        totalPages: 100
      } as DirectoryListing;

      directoryListingService.getDirectoryListing.mockResolvedValue(mockResponse);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/directoryListing/directory')
        .query({ path: '/large-dir', page: 1, pageSize: 1000 });
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});