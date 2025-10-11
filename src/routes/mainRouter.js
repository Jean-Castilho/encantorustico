import express from 'express';
import pagesRoutes from './pagesRoutes.js';
import authRoutes from './authRoutes.js';

const router = express.Router();

router.use('/', pagesRoutes);
router.use('/', authRoutes);

export default router;