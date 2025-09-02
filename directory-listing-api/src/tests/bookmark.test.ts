import { BookmarkService } from '../services/BookmarkService';
import fs from 'fs';
const bookmarkService = new BookmarkService('./test-data');

jest.mock('fs');

describe('BookmarkService', () => {
  //let bookmarkService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
  });

  it('should add and retrieve a bookmark', () => {
    const bookmark = bookmarkService.addBookmark('Test', '/tmp');
    expect(bookmark.name).toBe('Test');
    expect(bookmark.path).toBe('/tmp');

    const bookmarks = bookmarkService.getAllBookmarks();
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].name).toBe('Test');
  });

  it('should update bookmark access time', () => {
    const bookmark = bookmarkService.addBookmark('Test', '/tmp');
    const initialAccess = bookmark.lastAccessed;

    bookmarkService.updateBookmarkAccess(bookmark.id);
    const updatedBookmark = bookmarkService.getBookmark(bookmark.id);
    
    expect(updatedBookmark?.lastAccessed).not.toBe(initialAccess);
  });
});