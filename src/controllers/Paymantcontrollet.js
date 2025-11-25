import dotenv from "dotenv";
import { MercadoPagoConfig, Payment } from 'mercadopago';

dotenv.config();

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

export const gerarPix = async (valor) => {

    if (!valor) {
        return { mensagem: 'O campo "valor" é obrigatório.' }
    }

    const data = { email: "jeancastilho646@gmail.com", nome: "jean", sobrenome: "castilho", cpf: 17984881758 }
    const valorInteiro = parseFloat(valor).toFixed(2);
    const payment_data = {
        transaction_amount: parseFloat(valorInteiro),
        description: 'Pagamento PIX',
        payment_method_id: 'pix',
        payer: {
            email: data.email,
            first_name: data.nome,
            last_name: data.sobrenome,
            identification: {
                type: 'CPF',
                number: data.cpf,
            },
        },
    };
    try {
        const payment = new Payment(client);
        console.log(payment);
        const result = await payment.create({ body: payment_data });
        const { qr_code, qr_code_base64 } = result.point_of_interaction.transaction_data;

        return {
            id: result.id,
            status: result.status,
            qr_code,
            qr_code_base64,
        }

    } catch (error) {
        return { error: 'Erro ao gerar PIX' };
    }
};

export const consultarPix = async (id) => {
    if (!id) {
        return { mensagem: 'O campo "id" é obrigatório.' }
    }
    try {
        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id });

        return { status: paymentInfo.status };
        
    } catch (error) {
        console.error('Erro ao consultar PIX:', error);
        return { error: 'Erro ao consultar PIX' };
    }
};