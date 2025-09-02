import { Request, Response } from 'express';
import { DirectoryListing } from '../models/DirectoryListing';
import { DirectoryListingService } from '../services/DirectoryListingService';
import { RecentDirectoriesService } from '../services/RecentDirectoriesService'
import { errorHandler } from '../middleware/errorHandler';

const recentDirectoriesService = new RecentDirectoriesService();
const directoryListingService = new DirectoryListingService()

export class DirectoryListingController {

    static async getDirectoryListing(req: Request, res: Response): Promise<void> {
        try {
            const { path: directoryPath, page: pageStr, pageSize: pageSizeStr } = req.query;

            if (!directoryPath || typeof directoryPath !== 'string') {
                res.status(400).json({
                    error: 'Directory path is required as a query parameter'
                });
                return;
            }

            const page = pageStr ? parseInt(pageStr as string, 10) : 1;
            const pageSize = pageSizeStr ? parseInt(pageSizeStr as string, 10) : 1000;

            if (isNaN(page) || page < 1) {
                res.status(400).json({
                    error: 'Page must be a positive integer'
                });
                return;
            }

            if (isNaN(pageSize) || pageSize < 1 || pageSize > 5000) {
                res.status(400).json({
                    error: 'Page size must be between 1 and 5000'
                });
                return;
            }

            const directoryListing: DirectoryListing = await directoryListingService.getDirectoryListing(directoryPath, page, pageSize);
            recentDirectoriesService.addRecentDirectory(directoryPath);
            recentDirectoriesService.incrementAccessCount(directoryPath);
            
            res.json(directoryListing);

        } catch (error: any) {
            errorHandler(error, req, res);
        }
    }

  
}
