import express from "express";

import { 
  getHome, 
  getRegister,
  getLogin, 
  getProfile, 
  getVerifyOtp,
  getResetPassword,
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
router.get("/verifyOtp", getVerifyOtp)

router.get('/favorites', generateCsrfToken, getFavoritesPage);
router.get('/cart', generateCsrfToken, getCartPage);


router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erro ao destruir a sessão:", err);
      return res.status(500).redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

export default router;