
import pagesRoutes from './routes/pagesRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRouter from './routes/adminRouter.js';
import orderRoutes from './routes/orderRoutes.js';
import otpRoutes from './routes/otpRoutes.js';
import deliveryRouter from './routes/deliveryRouter.js';


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
  app.use('/', otpRoutes);
  app.use('/', deliveryRouter);
};