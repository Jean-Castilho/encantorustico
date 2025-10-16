
import pagesRoutes from './pagesRoutes.js';
import authRoutes from './authRoutes.js';
import adminRouter from './adminRouter.js';
import orderRoutes from './orderRoutes.js';

/**
 * Centraliza e carrega todas as rotas da aplicação.
 * @param {import('express').Express} app - A instância do aplicativo Express.
 */
export default function loadRoutes(app) {
  app.use('/', pagesRoutes);
  // Rotas de administração (protegidas por autenticação e autorização)
  app.use('/', authRoutes);
  app.use('/admin', adminRouter);
  app.use('/orders', orderRoutes);
};