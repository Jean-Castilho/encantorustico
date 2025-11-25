
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { Router } from "express";
import UsersControllers from "../controllers/UsersControllers.js";
import { generateOTP, verifyCode, armazenCodeOtp } from "../services/otpCodeService.js";

dotenv.config();

const usersController = new UsersControllers();

// Configurar o transporte do Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

function getCurrentTime() {
    const now = new Date();
    return {
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
    };
}

const router = Router();

router.post('/sendFedback', async (req, res) => {

    const {email,subject,message} = req.body;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: subject,
        text: message
    };

    try {
        const emailSend = await transporter.sendMail(mailOptions);

        return res.status(200).json({ messagem: "feedback enviado com sucesso!", emailSend})
    } catch (error) {
        return res.status(500).json({mensagem: "erro ao enviar email"})
    }

})

router.post("/sendOtp", async (req, res) => {
    const { email } = req.body;

    const otp = generateOTP();

    if (!email || !otp) {
        return res.status(400).json({ mensagem: "Email e OTP são obrigatórios." });
    }

    await armazenCodeOtp(email, otp);

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Seu código OTP",
        text: `Seu código OTP é: ${otp}`,
    };

    // Enviar o email;
    try {
        const emailsend = await transporter.sendMail(mailOptions);

        return res.status(200).json({ mensagem: "OTP enviado com sucesso!", emailsend });
    } catch (error) {
        console.error("Erro ao enviar OTP:", error);
        return res.status(500).json({ mensagem: "Erro ao enviar OTP." });
    }
});

router.post("/verifyCode", async (req, res) => {
    const { email, code } = req.body;

    if (!email) {
        return res.status(400).json({ mensagem: "Email é obrigatório." });
    }
    if (!code) {
        return res.status(400).json({ mensagem: "Código é obrigatório." });
    }

    const lastMoment = getCurrentTime();

    const isCodeValid = await verifyCode(email, code);

    if (!isCodeValid) {
        return res.status(201).json({ mensagem: "Código inválido ou expirado." });
    }

    const user = await usersController.getUserByEmail(email);
    if (!user) {
        return res.status(202).json({ mensagem: "Usuário não encontrado." });
    }

    await usersController.updateUser(user._id, { email: { verified: true, endereco: email } });

    const userUpdated = await usersController.getUserByEmail(email);

    return res.status(200).json({ mensagem: "Código verificado com sucesso!", user: userUpdated });

});

export default router;