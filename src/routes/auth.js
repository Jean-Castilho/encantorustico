import express from "express";
import UserControllers from "../controllers/userControllers.js";
// 1. Importe o middleware de validação CSRF
import {
  validateCsrfToken,
  generateCsrfToken,
} from "../middleware/csrfMiddleware.js";

import {ensureAuthenticated} from "../middleware/authMiddleware.js"

import { ObjectId } from "mongodb";

const userControllers = new UserControllers();
const router = express.Router();

router.post("/register", generateCsrfToken, async (req, res, next) => {
  try {
    const creatUser = await userControllers.creatUser(req, res);

    return res
      .cookie("token", creatUser.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Use 'secure' apenas em produção;
        sameSite: "strict",
      })
      .status(201) // 201 Created é mais apropriado aqui;
      .json({ message: "Usuário criado com sucesso.", user: creatUser.user });
  } catch (error) {
    next(error); // Passa o erro para o middleware de erro;
  }
});

router.post("/login", generateCsrfToken, async (req, res, next) => {
  try {
    const dataLogin = await userControllers.login(req, res);

    return res
      .cookie("token", dataLogin.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .status(200)
      .json({ message: "Login realizado", user: dataLogin.user });
  } catch (error) {
    next(error); // Passa o erro para o middleware de erro;
  }
});

router.put("/updatedUser", ensureAuthenticated, validateCsrfToken, async (req, res, next) => {
  try {
    const id = req.session.user._id;
    const userUpdated = await userControllers.updateUser(id, req.body);

    req.session.user = userUpdated;

    return res.status(200).json({ message: "Usuario atualizado", userUpdated });
  } catch (error) {
    next(error);
  }
});

router.post("/forgot-password", validateCsrfToken, async (req, res, next) => {

  console.log("req.body:", req.body);

  const {contact, send_method } = req.body;

  


})

router.post("/favorites/add", ensureAuthenticated, validateCsrfToken, async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    // Usando o fluxo de erro padronizado
    return next(new GeneralError("ID do produto é obrigatório.", 400));
  }

  try {
    const updatedUser = await userControllers.getCollection().findOneAndUpdate(
      { _id: new ObjectId(req.userId) },
      { $addToSet: { favorites: productId } },
      { returnDocument: "after" }
    );

    if (updatedUser) {
      req.session.user = updatedUser; // Atualiza a sessão
      return res.status(200).json({ success: true, message: "Produto adicionado aos favoritos.", favorites: updatedUser.favorites });
    }
    // Se não encontrou o usuário, lança um erro 404
    throw new GeneralError("Usuário não encontrado.", 404);
  } catch (error) {
    next(error);
  }
});

router.post("/favorites/remove", ensureAuthenticated, validateCsrfToken, async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ success: false, message: "ID do produto é obrigatório." });
  }

  try {
    const updatedUser = await userControllers.getCollection().findOneAndUpdate(
      { _id: new ObjectId(req.userId) },
      { $pull: { favorites: productId } },
      { returnDocument: "after" }
    );

    if (updatedUser) {
      req.session.user = updatedUser; // Atualiza a sessão
      return res.status(200).json({ success: true, message: "Produto removido dos favoritos.", favorites: updatedUser.favorites });
    }
    throw new GeneralError("Usuário não encontrado.", 404);
  } catch (error) {
    next(error);
  }
});

router.post("/cart/add", ensureAuthenticated, validateCsrfToken, async (req, res, next) => {
  const { productId } = req.body;
  const userId = req.userId;

  if (!productId) {
    return res.status(400).json({ success: false, message: "ID do produto é obrigatório." });
  }

  try {
    const updatedUser = await userControllers.getCollection().findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $addToSet: { cart: productId } },
      { returnDocument: "after" }
    );

    if (updatedUser) {
      req.session.user = updatedUser; // Atualiza a sessão
      return res.status(200).json({ success: true, message: "Produto adicionado ao carrinho.", cart: updatedUser.cart });
    }
    throw new GeneralError("Usuário não encontrado.", 404);
  } catch (error) {
    next(error);
  }
});

router.post("/cart/remove", ensureAuthenticated, validateCsrfToken, async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ success: false, message: "ID do produto é obrigatório." });
  }

  try {
    const updatedUser = await userControllers.getCollection().findOneAndUpdate(
      { _id: new ObjectId(req.userId) },
      { $pull: { cart: productId } },
      { returnDocument: "after" }
    );

    if (updatedUser) {
      req.session.user = updatedUser; // Atualiza a sessão
      return res.status(200).json({ success: true, message: "Produto removido do carrinho.", cart: updatedUser.cart });
    }
    throw new GeneralError("Usuário não encontrado.", 404);
  } catch (error) {
    next(error);
  }
});

router.post("/create-order", ensureAuthenticated, validateCsrfToken, async (req, res, next) => {

  console.log(req.body);



});

export default router;
