import { armazenCodeOtp , generateOTP } from "../services/otpCodeService.js"

const WHATSAPP_TOKEN = "EAA1BR5qp0TMBP5gN408BxXEDdA2FBhZBeCrARA0PjBggbz8f7rO3WEEpHgq80dhsGZCZBigtCBNbzcPisu64PxXuGSP4xZAoZAE3Du1a6FnJEZAJc6MR8ZCa4EpR2WF12FjZBM0tky54OG0HSoAhZBSKJONXphuTCgx5qIn0Pqb2gvS6HpVJkO7BiTMmc6hr4ApXgMwJ5404OS2ZClFtetKB82nHktobehR25sqNucasjJ2IvLcmSqJZCjdA8SBjywozbGoplKTBAt2EVLBJH7ZAEkMzY20mywZDZD";
const WHATSAPP_PHONE_NUMBER_ID = "892056613982326";
const WHATSAPP_API_URL = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

const createMessagandCode = async (to) => {
  const otp = generateOTP();

  const payload = {
    messaging_product: "whatsapp",
    to: to,
    type: "template",
    template: {
      name: "verifycode",
      language: {
        code: "en_US",
      },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: otp }],
        },
        {
          type: "button",
          sub_type: "url",
          index: 0,
          parameters: [
            {
              type: "text",
              text: otp,
            },
          ],
        },
      ],
    },
  };

  await armazenCodeOtp(to, otp);

  const fetchOptions = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };

  return fetchOptions;

};

export const sendCodeWhatzapp = async (number) => {
  
  if (!number) {
    throw new ValidationError("Número de telefone não fornecido.");
  }

  if (!WHATSAPP_TOKEN || !WHATSAPP_API_URL) {
    console.error("Variáveis de ambiente do WhatsApp não configuradas.");
    throw new Error(
      "A configuração do servidor para envio de mensagens está incompleta.",
    );
  }

  const fetchOptions = createMessagandCode(number);

  try {
    const response = await fetch(WHATSAPP_API_URL, fetchOptions);
    const data = await response.json();  

    return data;

  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    throw new Error("Erro ao enviar mensagem");
  }
};