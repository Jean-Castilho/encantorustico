
import { apiFetch } from '../utils/apiClient.js';

const renderPage = (res, page, options = {}) => {
    res.render(res.locals.layout, {
        page,
        ...options,
        apiBaseUrl: process.env.API_BASE_URL
    });
};

export default class deliveryController {

    getDeliveryPage = async (req, res) => {
        const pageOptions = {
            titulo: 'Página de Entrega',
            mensagem: 'Página de entrega é rota',
            apiKey: process.env.GOOGLE_MAPS_API_KEY,
            orders: [],
        };

        try {
            const resApi = await apiFetch('/orders/');

            const ordernsShipped = resApi.data.filter(order => order.status === 'shipped');
            const ordernsApproved = resApi.data.filter(order => order.status === 'approved');

            pageOptions.orders = [...ordernsShipped, ...ordernsApproved] || [];

            renderPage(res, '../pages/delivery/dashboard', { ...pageOptions, mensagem: 'Página de entrega é rota' });
        } catch (error) {
            console.error('Erro ao buscar pedidos para entrega:', error);
            renderPage(res, '../pages/delivery/delivery', { ...pageOptions, mensagem: 'Erro ao carregar pedidos para entrega.' });
        }
    };
}