import { Router } from 'express';
import { BookmarkController } from '../controllers/BookmarkController';

const router = Router();

router.get('/all', BookmarkController.getAllBookmarks);
router.get('/byId/:id', BookmarkController.getBookmark);
router.post('/add', BookmarkController.createBookmark);
router.delete('/delete/:id', BookmarkController.deleteBookmark);
router.patch('/update/:id/access', BookmarkController.updateBookmarkAccess);

export default router;
