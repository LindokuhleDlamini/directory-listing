import path from 'path';
import fs from 'fs';
import { BookmarkService } from '../services/BookmarkService';

jest.mock('fs');
jest.mock('path');

describe('BookmarkService', () => {
  let bookmarkService: any;
  const mockDataDir = './test-data';
  beforeEach(() => {
    jest.clearAllMocks();
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    (path.dirname as jest.Mock).mockImplementation((filePath) => {
      return filePath.split('/').slice(0, -1).join('/');
    });
    bookmarkService = new BookmarkService(mockDataDir);
  });

  it('should add and retrieve a bookmark', () => {
    const mockPath = '/valid/directory/path';
    const mockName = 'Test Directory';
    // Mock fs.existsSync to return true for the path
    (fs.existsSync as jest.Mock).mockImplementation((filePath) => {
      return filePath === mockPath;
    });

    // Mock fs.statSync to return directory stats
    (fs.statSync as jest.Mock).mockImplementation((filePath) => {
      return {
        isDirectory: () => filePath === mockPath,
        isFile: () => false
      };
    });

    // Mock file reading/writing
    (fs.readFileSync as jest.Mock).mockReturnValue('[]');
    (fs.writeFileSync as jest.Mock).mockImplementation(() => { });
    const bookmark = bookmarkService.addBookmark(mockName, mockPath);
    expect(bookmark.name).toBe(mockName);
    expect(bookmark.path).toBe(mockPath);

    const bookmarks = bookmarkService.getAllBookmarks();
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].name).toBe(mockName);
  });

  it('should update bookmark access time', () => {
        const mockPath = '/valid/directory/path';
    const mockName = 'Test Directory';
        // Mock fs.existsSync to return true for the path
    (fs.existsSync as jest.Mock).mockImplementation((filePath) => {
      return filePath === mockPath;
    });

    // Mock fs.statSync to return directory stats
    (fs.statSync as jest.Mock).mockImplementation((filePath) => {
      return {
        isDirectory: () => filePath === mockPath,
        isFile: () => false
      };
    });

    // Mock file reading/writing
    (fs.readFileSync as jest.Mock).mockReturnValue('[]');
    (fs.writeFileSync as jest.Mock).mockImplementation(() => { });
    const bookmark = bookmarkService.addBookmark(mockName, mockPath);
    const initialAccess = bookmark.lastAccessed;

    bookmarkService.updateBookmarkAccess(bookmark.id);
    const updatedBookmark = bookmarkService.getBookmark(bookmark.id);

    expect(updatedBookmark?.lastAccessed).not.toBe(initialAccess);
  });
});