import express from "express";
import https from "https";

import {
  getLoginPage, getRegisterPage,
  getProfilePage,
  getFavoritesPage,
  getCartPage, login, register, logout, changePasswordPage, forgotPassword
} from "../controllers/authController.js";
import { addFavorite, removeFavorite, addCart, getProductByIdsCart, removeCart } from "../controllers/usersController.js";
import { apiFetch } from "../utils/apiClient.js";

const router = express.Router();


router.get('/login', getLoginPage);
router.get('/register', getRegisterPage);

router.post("/login", login);
router.post("/register", register);
router.get("/logout", logout);


router.get('/change-password', changePasswordPage);
router.post('/forgot-password', forgotPassword);

// Rotas de usuário autenticado;
router.get('/profile', getProfilePage);
router.get('/favorites', getFavoritesPage);
router.get('/cart', getCartPage);

router.post("/addFavorite/:id", addFavorite);
router.post("/removeFavorite/:id", removeFavorite);

router.post("/cart/add/:id", addCart);
router.get('/cart/products', getProductByIdsCart);
router.post("/cart/remove/:id", removeCart);








router.post("/contact", async (req, res) => {
  const { email, subject, message } = req.body;

  // Here you would typically handle the contact form submission,
  // e.g., save the data to a database or send an email.

  console.log(`Contact form submitted by email: ${email}: subject: ${subject}, message: ${message}`);

  const response = await apiFetch('/email/sendFedback', {
    method: 'POST',
    body: JSON.stringify({ email, subject, message }),
  });

  return res.send("email");

});



router.post("/sendCodforDelivery", async (req, res) => {
  const { number } = req.body;

  const response = await apiFetch(`/watsapp/send-code`, {
    method: 'PUT',
    body: JSON.stringify({number}),
  });

  console.log("nu,ber",email);

});

router.post("/confirmDelivery", async (req, res) => {
  const { number, code } = req.body;

  const response = await apiFetch(`/verifyCode`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'shipped' }),
  });

  return { messagem: "produto saiu para entrega" }
});





router.get("/cep/:cep", (req, res) => {
  const cep = req.params.cep;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return sendError(res, "A chave da API do Google Maps não está configurada no servidor.", 500);
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${cep}&key=${apiKey}`;

  https.get(url, (apiRes) => {

    let data = "";
    apiRes.on("data", (chunk) => {
      data += chunk;
    });

    apiRes.on("end", () => {
      try {
        const jsonData = JSON.parse(data);
        if (jsonData.status === "OK" && jsonData.results.length > 0) {
          const addressComponents = jsonData.results[0].address_components;

          console.log(addressComponents);

          const getComponent = (type) => {

            if (type == "short_name") {

              const component = addressComponents.find((c) => c.types.includes("administrative_area_level_1"));
              return component ? component.short_name : "";
            }

            const component = addressComponents.find((c) => c.types.includes(type));
            return component ? component.long_name : "";
          };

          const address = {
            rua: getComponent("route"),
            bairro: getComponent("sublocality_level_1") || getComponent("political"),
            cidade: getComponent("administrative_area_level_2"),
            estado: getComponent("administrative_area_level_1"),
            cep: getComponent("postal_code"),
            short_UF: getComponent("short_name"),
          };

          return res.json({ success: true, mensagem: "Endereço encontrado com sucesso.", data: address });
        } else {
          return res.status(203).json({ error: "Endereço não encontrado." });
        }
      } catch (e) {
        return res.status(500).json({ error: "Erro ao processar a resposta da API de geocodificação." });
      }
    });

  }).on("error", (e) => {
    return res.status(500).json({ error: "Erro ao se conectar à API de geocodificação." });
  });
});

export default router;
