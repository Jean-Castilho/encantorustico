import express from 'express';
import { checkUserRole } from '../middleware/authMiddleware.js';
import { 
    getHomePage,
    getAboutPage,
    getContactPage,
    getCartPage,
    getFavoritesPage,
    getLoginPage,
    getRegisterPage,
    getProfilePage,
    getProductsPage,
    getAddProductPage,
    getDetalheProductPage,
    getPaymentPage,
    getDeliveryDashboardPage,
    getPaymentConfirmationPage
} from '../controllers/pagesController.js';

import { getCheckoutPage, getOrdersPage } from '../controllers/orderController.js';


const router = express.Router();

router.use(checkUserRole);

router.get('/', getHomePage);
router.get("/about", getAboutPage);
router.get("/contact", getContactPage);
router.get("/cart", getCartPage);
router.get("/favorites", getFavoritesPage);
router.get("/login", getLoginPage);
router.get("/register", getRegisterPage);
router.get("/profile", getProfilePage);
router.get("/products", getProductsPage);
router.get("/product/add", getAddProductPage);
router.get("/product/:id", getDetalheProductPage);
router.get("/payment", getPaymentPage);
router.get("/payment-confirmation", getPaymentConfirmationPage);

// Rotas de Checkout;
router.get("/checkout", getCheckoutPage);
router.get("/orders", getOrdersPage);

router.get("/delivery/dashboard", getDeliveryDashboardPage);

export default router;