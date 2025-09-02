import fs from 'fs';
import path from 'path';
import { Bookmark } from '../models/Bookmark';

export class BookmarkService {
  private bookmarksFile: string;
  private bookmarks: Map<string, Bookmark>;

  constructor(dataDir: string = './data') {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.bookmarksFile = path.join(dataDir, 'bookmarks.json');
    this.bookmarks = new Map();
    

    this.loadBookmarks();
  }

  private loadBookmarks(): void {
    try {
      if (fs.existsSync(this.bookmarksFile)) {
        const data = fs.readFileSync(this.bookmarksFile, 'utf8');
        const bookmarksArray: Bookmark[] = JSON.parse(data);
        this.bookmarks = new Map(bookmarksArray.map(b => [b.id, b]));
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  }

  private saveBookmarks(): void {
    try {
      const bookmarksArray = Array.from(this.bookmarks.values());
      fs.writeFileSync(this.bookmarksFile, JSON.stringify(bookmarksArray, null, 2));
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  }

  getAllBookmarks(): Bookmark[] {
    return Array.from(this.bookmarks.values()).sort((a, b) =>
      (b.lastAccessed?.getTime() || 0) - (a.lastAccessed?.getTime() || 0)
    );
  }

  getBookmark(id: string): Bookmark | undefined {
    return this.bookmarks.get(id);
  }

  addBookmark(name: string, path: string): Bookmark {
    if (!fs.existsSync(path)) {
      throw new Error('Path does not exist');
    }

    const stats = fs.statSync(path);
    if (!stats.isDirectory()) {
      throw new Error('Path is not a directory');
    }

    const id = this.generateId();
    const bookmark: Bookmark = {
      id,
      name,
      path,
      createdAt: new Date()
    };

    this.bookmarks.set(id, bookmark);
    this.saveBookmarks();
    return bookmark;
  }

  updateBookmarkAccess(id: string): Bookmark | undefined {
    const bookmark = this.bookmarks.get(id);
    if (bookmark) {
      bookmark.lastAccessed = new Date();
      this.bookmarks.set(id, bookmark);
      this.saveBookmarks();
      return bookmark
    }
  }

  removeBookmark(id: string): boolean {
    const result = this.bookmarks.delete(id);
    if (result) {
      this.saveBookmarks();
    }
    return result;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}

