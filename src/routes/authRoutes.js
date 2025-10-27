import express from "express";
import https from "https";

import {
  getLoginPage, getRegisterPage, getOtpPage,
  getProfilePage,
  getFavoritesPage,
  getCartPage, login, register, logout
} from "../controllers/authController.js";
import { addFavorite, removeFavorite, addCart, getProductByIdsCart, removeCart } from "../controllers/usersController.js";
import { apiFetch } from "../utils/apiClient.js";

const router = express.Router();


router.get('/login', getLoginPage);
router.get('/register', getRegisterPage);
router.get('/otpCode', getOtpPage);

router.post("/login", login);
router.post("/register", register);
router.get("/logout", logout);

// Rotas de usuário autenticado;
router.get('/profile', getProfilePage);
router.get('/favorites', getFavoritesPage);
router.get('/cart', getCartPage);

router.post("/addFavorite/:id", addFavorite);
router.post("/removeFavorite/:id", removeFavorite);

router.post("/cart/add/:id", addCart);
router.get('/cart/products', getProductByIdsCart);
router.post("/cart/remove/:id", removeCart);







router.post("/notifiqUserForShipped", async (req, res) => {
  const { orderId } = req.body;

  const response = await apiFetch(`/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'shipped' }),
  });

  return {messagem: "produto saiu para entrega"}
});









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

router.post("/sendOtp", async (req, res) => {
  const { email } = req.body;

  console.log(`OTP requested for email: ${email}`);

  const response = await apiFetch('/email/sendOtp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

  res.send("OTP sent");
});

router.get("/resendOtp/:email", async (req, res) => {
  const { email } = req.params;

  console.log(`OTP requested for email: ${email}`);

  const response = await apiFetch('/email/sendOtp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

  console.log(`OTP resend response: ${response}`);

  res.redirect('/otpCode');
});

router.post("/verifyOtp", async (req, res) => {
  const { email, code } = req.body;

  console.log(`OTP verification requested for email: ${email} with OTP: ${code}`);

  const response = await apiFetch('/email/verifyCode', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });

  console.log(response);

  if (!response) {
    return res.render('layout/main', {
      page: '../pages/public/otpCode',
      titulo: 'Verificação de Código',
      mensagem: 'Falha na verificação do código OTP. Tente novamente.',
      email
    });
  }

  req.session.user = response.user;

  return res.redirect('/')

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
