import { apiFetch } from '../utils/apiClient.js';

const isEmail = (contact) => {
    const emailRegex = /^[^S@]+@[^S@]+\.[^S@]+$/;
    return emailRegex.test(contact);
}

export const sendOtp = async (contact, method) => {
    if (method === 'email') {
        console.log(`OTP requested for email: ${contact}`);
        return await apiFetch('/email/sendOtp', {
            method: 'POST',
            body: JSON.stringify({ email: contact }),
        });
    } else if (method === 'sms') {
        console.log(`OTP requested for sms: ${contact}`);
        return await apiFetch('/whatsapp/send-code', {
            method: 'POST',
            body: JSON.stringify({ number: contact }),
        });
    }
    throw new Error('Invalid OTP method');
};

export const resendOtp = async (req, res) => {
    const { contact } = req.body;
    const method = isEmail(contact) ? 'email' : 'sms';

    try {
        await sendOtp(contact, method);
        res.render('layout/main', {
            page: '../pages/auth/otpCode',
            titulo: 'Verificação de Código',
            mensagem: `Um novo código OTP foi enviado para ${contact}`,
            contact
        });
    } catch (error) {
        res.render('layout/main', {
            page: '../pages/auth/otpCode',
            titulo: 'Verificação de Código',
            mensagem: 'Falha ao reenviar o código OTP. Tente novamente.',
            contact,
            error: error.message
        });
    }
};

export const verifyOtp = async (req, res) => {
    const { contact, code } = req.body;
    const method = isEmail(contact) ? 'email' : 'sms';

    try {
        let response;
        if (method === 'email') {
            response = await apiFetch('/email/verifyCode', {
                method: 'POST',
                body: JSON.stringify({ email: contact, code }),
            });
        } else if (method === 'sms') {
            response = await apiFetch('/whatsapp/verify-code', {
                method: 'PUT',
                body: JSON.stringify({ number: contact, code }),
            });
        }

        if (!response) {
            return res.render('layout/main', {
                page: '../pages/auth/otpCode',
                titulo: 'Verificação de Código',
                mensagem: 'Falha na verificação do código OTP. Tente novamente.',
                contact
            });
        }

        req.session.user = response.user;

        return res.redirect('/')
    } catch (error) {
        res.render('layout/main', {
            page: '../pages/auth/otpCode',
            titulo: 'Verificação de Código',
            mensagem: 'Falha na verificação do código OTP. Tente novamente.',
            contact,
            error: error.message
        });
    }
};