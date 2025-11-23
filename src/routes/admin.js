import express from "express";
import multer from 'multer';
import {
    generateCsrfToken,
    validateCsrfToken
} from '../middleware/csrfMiddleware.js';
import {
    ensureAuthenticated,
    ensureAdmin
} from '../middleware/authMiddleware.js';



const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

import {
    getAdminDashboard,
    getInventoryPage,
    getOrdersPage,
    getUsersPage,
    getAddProductPage,
    getDelivery,
    getEditProductPage,
    postEditProduct,
    deleteProduct,
    getEditUserPage,
    updateUser,
    deleteUser
} from '../controllers/adminControllers.js';

router.get('/dashboard', getAdminDashboard);
router.get('/inventory', generateCsrfToken, getInventoryPage);
router.get('/orders', getOrdersPage); 

router.get('/users', generateCsrfToken, getUsersPage);
router.get("/user/edit/:id", generateCsrfToken, getEditUserPage);
router.put("/user/edit/:id", ensureAuthenticated, ensureAdmin, validateCsrfToken, updateUser);
router.delete('/users/:id', ensureAuthenticated, ensureAdmin, validateCsrfToken, deleteUser);

router.get('/add-product', generateCsrfToken,  getAddProductPage);

router.get('/products/edit/:id', generateCsrfToken, getEditProductPage);
router.post('/products/edit/:id', upload.array('imagens', 5), validateCsrfToken, postEditProduct);
router.post('/products/delete', ensureAuthenticated, ensureAdmin, validateCsrfToken, deleteProduct);


router.get('/delivery', getDelivery);


export default router;