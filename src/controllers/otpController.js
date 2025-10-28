
import { apiFetch } from '../utils/apiClient.js';

const renderPage = (res, page, options = {}) => {
    res.render(res.locals.layout, {
        page,
        ...options,
        apiBaseUrl: process.env.API_BASE_URL
    });
};

export const getOtpPage = (req, res) => {

    const user = req.session.user;

    if (!user) {
        return res.redirect('/login');
    }

    renderPage(res, '../pages/auth/otpCode', {
        titulo: 'Código OTP - Encanto Rústico',
        estilo: 'auth',
        mensagem: 'Insira o código OTP enviado ao seu email.',
    });
}

export const sendOtp = async (req, res) => {
    const { email } = req.body;

    console.log(`OTP requested for email: ${email}`);

    const response = await apiFetch('/email/sendOtp', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });

    res.send("OTP sent");
};


export const resendOtp = async (req, res) => {
    const { email } = req.params;

    console.log(`OTP requested for email: ${email}`);

    const response = await apiFetch('/email/sendOtp', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });

    console.log(`OTP resend response: ${response}`);

    res.redirect('/otpCode');
};


export const verifyOtp = async (req, res) => {
    const { email, code } = req.body;

    console.log(`OTP verification requested for email: ${email} with OTP: ${code}`);

    const response = await apiFetch('/email/verifyCode', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
    });

    if (!response) {
        return res.render('layout/main', {
            page: '../pages/auth/otpCode',
            titulo: 'Verificação de Código',
            mensagem: 'Falha na verificação do código OTP. Tente novamente.',
            email
        });
    }

    req.session.user = response.user;

    return res.redirect('/')

};
