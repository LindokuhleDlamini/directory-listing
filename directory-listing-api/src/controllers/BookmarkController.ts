import { Request, Response } from 'express';
import { BookmarkService } from '../services/BookmarkService';
import { errorHandler } from '../middleware/errorHandler';

const bookmarkService = new BookmarkService();

export class BookmarkController {
  static async getAllBookmarks(req: Request, res: Response): Promise<void> {
    try {
      const bookmarks = bookmarkService.getAllBookmarks();
      res.json(bookmarks);

    } catch (error: any) {
      errorHandler(error, req, res);
    }
  }

  static async getBookmark(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const bookmark = bookmarkService.getBookmark(id);
      
      if (!bookmark) {
        res.status(404).json({ error: 'Bookmark not found' });
        return;
      }
      
      res.json(bookmark);
    } catch (error: any) {
      errorHandler(error, req, res);
    }
  }

  static async createBookmark(req: Request, res: Response): Promise<void> {
    try {
      const { name, path } = req.body;
      
      if (!name || !path) {
        res.status(400).json({ error: 'Name and path are required' });
        return;
      }
      
      const bookmark = bookmarkService.addBookmark(name, path);
      res.status(201).json(bookmark);
    } catch (error: any) {
      errorHandler(error, req, res);
    }
  }

  static async deleteBookmark(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = bookmarkService.removeBookmark(id);
      
      if (!deleted) {
        res.status(404).json({ error: 'Bookmark not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error: any) {
      errorHandler(error, req, res);
    }
  }

  static async updateBookmarkAccess(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updatedBookmark = bookmarkService.updateBookmarkAccess(id);
      res.status(200).json(updatedBookmark);

    } catch (error: any) {
      errorHandler(error, req, res);
    }
  }
}
