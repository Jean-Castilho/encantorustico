import express from 'express';
import { checkUserRole } from '../middleware/authMiddleware.js';
import {
    getHomePage,
    getContactPage,
    getAboutPage,
    getProductsPage,
    getAddProductPage,
    getDetalheProductPage,
    getPaymentPage,
    getPaymentConfirmationPage,
    updateCartDetails,
    getEditProductPage
    } from '../controllers/pagesController.js';

import { getCheckoutPage, getOrdersPage } from '../controllers/orderController.js';

const router = express.Router();

// Middleware para verificar o papel do usuário;
router.use(checkUserRole);

// Rotas públicas;
router.get('/', getHomePage);
router.get('/about', getAboutPage);
router.get('/contact', getContactPage);

// Rotas de produtos;
router.get('/products', getProductsPage);
router.get('/product/add', getAddProductPage);
router.get('/product/:id', getDetalheProductPage);
router.get('/product/edit/:id', getEditProductPage);

// Rota para atualizar os detalhes do carrinho;
router.get('/cart/update', updateCartDetails);

// Rotas de pagamento;
router.get('/payment', getPaymentPage);
router.get('/payment-confirmation', getPaymentConfirmationPage);

// Rotas de pedido;
router.get('/checkout', getCheckoutPage);
router.get('/orders', getOrdersPage);


export default router;
