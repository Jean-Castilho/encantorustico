import express from 'express';
const router = express.Router();

import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.resolve(process.cwd(), 'uploads');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Admin Controllers
import {
    getAdminDashboard,
    getInventoryPage,
    getOrdersPage,
    getUsersPage
} from '../controllers/adminController.js';

// products Controllers
import {
    postAddProduct,
    deleteProduct
} from '../controllers/productsController.js';

router.get('/dashboard', getAdminDashboard);
router.get('/inventory', getInventoryPage);
router.get('/orders', getOrdersPage);
router.get('/users', getUsersPage);


router.post('/products/new', upload.array('imagens', 5), postAddProduct);
router.post('/products/delete', deleteProduct);

export default router;