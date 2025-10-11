import mainRouter from './mainRouter.js';
import adminRouter from './adminRouter.js';
import orderRoutes from './orderRoutes.js';

/**
 * Centraliza e carrega todas as rotas da aplicação.
 * @param {import('express').Express} app - A instância do aplicativo Express.
 */
export default function loadRoutes(app) {
  app.use('/', mainRouter);
  app.use('/admin', adminRouter);
  app.use('/orders', orderRoutes);
  // Adicione outros roteadores de nível superior aqui (ex: /api);
};