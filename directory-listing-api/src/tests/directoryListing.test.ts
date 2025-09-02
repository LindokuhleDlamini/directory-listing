import { FileItem } from '../models/FileItem';
import { DirectoryListingService } from '../services/DirectoryListingService';
import { DirectoryListingUtils } from '../utils/DirectoryListingUtils';
import fs from 'fs';
import path from 'path';

jest.mock('../utils/DirectoryListingUtils');
jest.mock('fs');

describe('DirectoryListingService', () => {
  let directoryListingService: DirectoryListingService;
  beforeEach(() => {
    directoryListingService = new DirectoryListingService();
    jest.clearAllMocks();
  });

  describe('getDirectoryListing', () => {
    it('should return directory listing for valid path', async () => {
      const mockFiles = ['file1.txt', 'file2.jpg', 'folder1'];
      (DirectoryListingUtils.readDirectory as jest.Mock).mockResolvedValue(mockFiles);

      (DirectoryListingUtils.getFileItem as jest.Mock)
        .mockResolvedValueOnce({
          name: 'file1.txt',
          path: '/test/file1.txt',
          size: 100,
          extension: '.txt',
          type: 'file',
          created: new Date(),
          permissions: '-rw-r--r--',
          attributes: ['file']
        })
        .mockResolvedValueOnce({
          name: 'file2.jpg',
          path: '/test/file2.jpg',
          size: 200,
          extension: '.jpg',
          type: 'file',
          created: new Date(),
          permissions: '-rw-r--r--',
          attributes: ['file']
        })
        .mockResolvedValueOnce({
          name: 'folder1',
          path: '/test/folder1',
          size: 0,
          extension: 'directory',
          type: 'directory',
          created: new Date(),
          permissions: 'drwxr-xr-x',
          attributes: ['directory']
        });

      const result = await directoryListingService.getDirectoryListing('/test');

      expect(result.path).toBe('/test');
      expect(result.items).toHaveLength(3);
      expect(result.totalCount).toBe(3);
      expect(DirectoryListingUtils.readDirectory).toHaveBeenCalledWith('/test');
    });

    it('should handle errors when reading directory', async () => {
      (DirectoryListingUtils.readDirectory as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      await expect(directoryListingService.getDirectoryListing('/invalid')).rejects.toThrow('Failed to read directory');
    });
  });

  describe('Large directory handling', () => {
    it('should handle directories with 100,000+ files', async () => {
      const mockFiles = Array(100000).fill(0).map((_, i) => `file${i}.txt`) as any;

      jest.spyOn(fs, 'readdir').mockImplementation((dir, undefined, callback) => {
        callback(null, mockFiles);
      });

      jest.spyOn(fs, 'stat').mockImplementation((filePath, undefined, callback) => {
        callback(null, {
          isDirectory: () => false,
          isFile: () => true,
          size: 1024,
          birthtime: new Date(),
          mode: 0o644
        } as any);
      });

      const result = await directoryListingService.getDirectoryListing('/large-dir', 1, 1000);

      expect(result.totalCount).toBe(100000);
      expect(result.items).toHaveLength(1000);
      expect(result.totalPages).toBe(100);
    });

    it('should use streaming for very large directories', async () => {
      const mockFiles = Array(50000).fill(0).map((_, i) => `file${i}.txt`);

      jest.spyOn(directoryListingService, 'getDirectorySize').mockResolvedValue(50000);
      jest.spyOn(directoryListingService, 'processFilesWithOpendir').mockResolvedValue({
        path: '/large-dir',
        items: mockFiles.slice(0, 1000).map(name => ({
          name,
          path: `/large-dir/${name}`,
          size: 1024,
          extension: '.txt',
          type: 'file',
          created: new Date(),
          permissions: '-rw-r--r--',
          attributes: ['file']
        })) as FileItem[],
        totalCount: 50000,
        page: 1,
        pageSize: 1000,
        totalPages: 50
      });

      const result = await directoryListingService.getDirectoryListing('/large-dir', 1, 1000);

      expect(directoryListingService.processFilesWithOpendir).toHaveBeenCalled();
      expect(result.totalCount).toBe(50000);
    });

    it('should handle timeouts gracefully', async () => {
      jest.spyOn(directoryListingService, 'getDirectorySize').mockResolvedValue(100000);
      jest.spyOn(directoryListingService, 'processFilesWithOpendir').mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              path: '/large-dir',
              items: [],
              totalCount: 5000,
              page: 1,
              pageSize: 1000,
              totalPages: 5
            });
          }, 50000); 
        });
      });

      const result = await directoryListingService.getDirectoryListing('/large-dir', 1, 1000);

      expect(result.totalCount).toBe(5000);
      expect(result.items).toHaveLength(0);
    });
  });

  describe('Caching', () => {
    it('should cache directory listings', async () => {
      const mockFiles = ['file1.txt', 'file2.txt'] as any;

      jest.spyOn(fs, 'readdir').mockImplementation((dir, undefined, callback) => {
        callback(null, mockFiles);
      });

      jest.spyOn(fs, 'stat').mockImplementation((filePath, undefined, callback) => {
        callback(null, {
          isDirectory: () => false,
          isFile: () => true,
          size: 1024,
          birthtime: new Date(),
          mode: 0o644
        } as any);
      });

      const result1 = await directoryListingService.getDirectoryListing('/test-dir');
      const result2 = await directoryListingService.getDirectoryListing('/test-dir');

      expect(fs.readdir).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    it('should respect cache TTL', async () => {
      jest.useFakeTimers();

      const mockFiles = ['file1.txt'] as any;
      jest.spyOn(fs, 'readdir').mockImplementation((dir, undefined, callback) => {
        callback(null, mockFiles);
      });

      jest.spyOn(fs, 'stat').mockImplementation((filePath, undefined, callback) => {
        callback(null, {
          isDirectory: () => false,
          isFile: () => true,
          size: 1024,
          birthtime: new Date(),
          mode: 0o644
        } as any);
      });

      await directoryListingService.getDirectoryListing('/test-dir');

      jest.advanceTimersByTime(31000);

      await directoryListingService.getDirectoryListing('/test-dir');

      expect(fs.readdir).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });
});
