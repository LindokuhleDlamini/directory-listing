import { Router } from 'express';
import { SearchController } from '../controllers/SearchController';

const router = Router();

router.get('/directory', SearchController.searchDirectory);
router.get('/quick', SearchController.quickSearch);

export default router;