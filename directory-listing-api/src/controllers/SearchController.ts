import { Request, Response } from 'express';
import { SearchService } from '../services/SearchService';
import { errorHandler } from '../middleware/errorHandler';
import { SearchResult } from '../models/SearchResult';

export class SearchController {
  static async searchDirectory(req: Request, res: Response): Promise<void> {
    try {
      const { path: directoryPath, searchTerm, limit: limitStr } = req.query;
      
      if (!directoryPath || typeof directoryPath !== 'string') {
        res.status(400).json({ error: 'Directory path is required' });
        return;
      }

      if (!searchTerm || typeof searchTerm !== 'string') {
        res.status(400).json({ error: 'Search term is required' });
        return;
      }

      const limit = limitStr ? parseInt(limitStr as string, 10) : 100;
      
      if (limit < 1 || limit > 1000) {
        res.status(400).json({ error: 'Limit must be between 1 and 1000' });
        return;
      }

      const results: SearchResult = await SearchService.search(directoryPath, searchTerm, limit);
      res.json(results);
    } catch (error:any) {
      errorHandler(error, req, res);
    }
  }

  static async quickSearch(req: Request, res: Response): Promise<void> {
    try {
      const { path: directoryPath, searchText: searchTerm, limit: limitStr } = req.query;
      
      if (!directoryPath || typeof directoryPath !== 'string') {
        res.status(400).json({ error: 'Directory path is required' });
        return;
      }

      if (!searchTerm || typeof searchTerm !== 'string') {
        res.status(400).json({ error: 'Search term is required' });
        return;
      }

      const limit = limitStr ? parseInt(limitStr as string, 10) : 50;
      
      const results: SearchResult = await SearchService.search(directoryPath, searchTerm, limit);
      res.json(results);
    } catch (error: any) {
     errorHandler(error, req, res);;
    }
  }
}