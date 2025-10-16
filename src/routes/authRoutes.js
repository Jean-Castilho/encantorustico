import express from "express";

import { login, register, logout } from "../controllers/authController.js";
import { addFavorite, removeFavorite, addCart, getProductByIdsCart , removeCart} from "../controllers/usersController.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/logout", logout);

router.post("/addFavorite/:productId", addFavorite);
router.post("/removeFavorite/:productId", removeFavorite);

router.post("/cart/add/:productId", addCart);
router.get('/cart/products', getProductByIdsCart);
router.post("/cart/remove/:productId", removeCart);

export default router;
