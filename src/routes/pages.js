import express from "express";

import { 
  getHome, 
  getRegister,
  getLogin, 
  getProfile, 
  getResetPassword,
  postResetPassword,
  getFavoritesPage, 
  getCartPage, 
  getContact, 
  getAbout, 
  getProducts,
  getOrders, 
  getCheckout,
  } from "../controllers/pagesControllers.js";

import {
  generateCsrfToken,
  validateCsrfToken
} from "../middleware/csrfMiddleware.js";
import { checkUserRole, ensureAuthenticated } from "../middleware/authMiddleware.js";


const router = express.Router();

router.use(checkUserRole);

router.get("/", generateCsrfToken, getHome);
router.get("/register", getRegister);
router.get("/login", getLogin);

router.get("/reset-password", generateCsrfToken, getResetPassword);
router.post("/atualiz", generateCsrfToken, getResetPassword);

router.get("/contact", getContact);
router.get("/about", getAbout);
router.get("/products", generateCsrfToken, getProducts);

router.get("/profile", ensureAuthenticated, generateCsrfToken, getProfile);
router.get("/orders", getOrders);

router.post("/checkout", getCheckout);

router.get("/change-password", generateCsrfToken, getResetPassword);

router.get('/favorites', generateCsrfToken, getFavoritesPage);
router.get('/cart', generateCsrfToken, getCartPage);



export default router;