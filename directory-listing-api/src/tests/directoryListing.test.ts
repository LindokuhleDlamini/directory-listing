import { DirectoryListingService } from '../services/DirectoryListingService';
import fs from 'fs';
import path from 'path';

jest.mock('fs');
jest.mock('path');
jest.mock('../utils/DirectoryListingUtils');

import  {DirectoryListingUtils} from '../utils/DirectoryListingUtils';

describe('DirectoryListingService', () => {
  let directoryListingService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    (path.isAbsolute as jest.Mock).mockReturnValue(true);
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

    directoryListingService = new DirectoryListingService();
  });

  describe('Basic directory listing', () => {
    it('should return directory listing for valid path', async () => {
      const mockFiles = ['file1.txt', 'file2.jpg', 'folder1'];
      
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });

      (DirectoryListingUtils.readDirectory as jest.Mock).mockResolvedValue(mockFiles);
      
      (DirectoryListingUtils.getFileItem as jest.Mock).mockResolvedValue({
        name: 'test',
        path: '/test',
        size: 100,
        extension: '.txt',
        type: 'file',
        created: new Date(),
        permissions: '-rw-r--r--',
        attributes: ['file']
      });

      const result = await directoryListingService.getDirectoryListing('/valid/path');
      
      expect(result.path).toBe('/valid/path');
      expect(result.items).toHaveLength(3);
      expect(result.totalCount).toBe(3);
    });

    it('should handle errors when reading directory', async () => {

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });

      (DirectoryListingUtils.readDirectory as jest.Mock).mockRejectedValue(new Error('Directory does not exist'));

      await expect(directoryListingService.getDirectoryListing('/invalid')).rejects.toThrow('Directory does not exist');
    });

    it('should throw error for non-existent directory', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(directoryListingService.getDirectoryListing('/nonexistent')).rejects.toThrow('Directory does not exist');
    });

    it('should throw error for file path (not directory)', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false });

      await expect(directoryListingService.getDirectoryListing('/file.txt')).rejects.toThrow('Path is not a directory');
    });
  });

  describe('Caching', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should cache directory listings', async () => {
      const mockFiles = ['file1.txt', 'file2.txt'];
      (DirectoryListingUtils.readDirectory as jest.Mock).mockResolvedValue(mockFiles);
      (DirectoryListingUtils.getFileItem as jest.Mock).mockResolvedValue({
        name: 'test',
        path: '/test',
        size: 100,
        extension: '.txt',
        type: 'file',
        created: new Date(),
        permissions: '-rw-r--r--',
        attributes: ['file']
      });


      const result1 = await directoryListingService.getDirectoryListing('/cached/path');
      const result2 = await directoryListingService.getDirectoryListing('/cached/path');

      expect(DirectoryListingUtils.readDirectory).toHaveBeenCalledTimes(2);
      expect(result1).toEqual(result2);
    });

    it('should respect cache expiry', async () => {
      const mockFiles = ['file1.txt'];
      (DirectoryListingUtils.readDirectory as jest.Mock).mockResolvedValue(mockFiles);
      (DirectoryListingUtils.getFileItem as jest.Mock).mockResolvedValue({
        name: 'test',
        path: '/test',
        size: 100,
        extension: '.txt',
        type: 'file',
        created: new Date(),
        permissions: '-rw-r--r--',
        attributes: ['file']
      });

      const result1 = await directoryListingService.getDirectoryListing('/expiring/path');
      
      jest.advanceTimersByTime(31000);

      const result2 = await directoryListingService.getDirectoryListing('/expiring/path');

      expect(DirectoryListingUtils.readDirectory).toHaveBeenCalledTimes(2);
    });

    it('should use different cache for different page sizes', async () => {
      const mockFiles = Array(10).fill('file.txt');
      (DirectoryListingUtils.readDirectory as jest.Mock).mockResolvedValue(mockFiles);
      (DirectoryListingUtils.getFileItem as jest.Mock).mockResolvedValue({
        name: 'test',
        path: '/test',
        size: 100,
        extension: '.txt',
        type: 'file',
        created: new Date(),
        permissions: '-rw-r--r--',
        attributes: ['file']
      });

      // Call with different page sizes
      await directoryListingService.getDirectoryListing('/path', 1, 10);
      await directoryListingService.getDirectoryListing('/path', 1, 20);
      await directoryListingService.getDirectoryListing('/path', 2, 10);

      expect(DirectoryListingUtils.readDirectory).toHaveBeenCalledTimes(6);
    });
  });

  describe('Pagination', () => {
    it('should handle pagination parameters correctly', async () => {
      const mockFiles = Array(100).fill('file.txt');
      (DirectoryListingUtils.readDirectory as jest.Mock).mockResolvedValue(mockFiles);
      (DirectoryListingUtils.getFileItem as jest.Mock).mockResolvedValue({
        name: 'test',
        path: '/test',
        size: 100,
        extension: '.txt',
        type: 'file',
        created: new Date(),
        permissions: '-rw-r--r--',
        attributes: ['file']
      });

      const result = await directoryListingService.getDirectoryListing('/large', 2, 10);

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.totalCount).toBe(100);
      expect(result.totalPages).toBe(10);
    });

    it('should validate pagination parameters', async () => {
      await expect(directoryListingService.getDirectoryListing('/path', 0, 10)).rejects.toThrow('Page must be greater than 0');
      await expect(directoryListingService.getDirectoryListing('/path', 1, 0)).rejects.toThrow('Page size must be between 1 and 5000');
      await expect(directoryListingService.getDirectoryListing('/path', 1, 10000)).rejects.toThrow('Page size must be between 1 and 5000');
    });
  });
});