import { Router } from 'express';
import { DirectoryListingController } from '../controllers/DirectoryListingController';

const router = Router();

router.get('/directory', DirectoryListingController.getDirectoryListing);

export default router;