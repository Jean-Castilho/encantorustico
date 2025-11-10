import { Router } from 'express';
import {
    createOrder,
    getOrdersPage,
    payOrder,
    cancelOrder,
    getDetailsOrderPage
} from '../controllers/orderController.js';

const router = Router();

router.get('/', getOrdersPage);

router.get("/:id/details", getDetailsOrderPage);
// Rota para criar um novo pedido (Endpoint da API);
router.post('/', createOrder);

// Iniciar pagamento (página ou redirecionamento);
router.get('/pay/:id', async (req, res, next) => {
    try {
        return payOrder(req, res, next);
    } catch (e) {
        next(e);
    }
});

// Cancelar pedido;
router.get('/cancel/:id', async (req, res, next) => {
    try {
        return cancelOrder(req, res, next);
    } catch (e) {
        next(e);
    }
});

// Baixar fatura / gerar invoice;
router.get('/invoice/:id', async (req, res, next) => {
    try {
        const { getInvoice } = await import('../controllers/orderController.js');
        return getInvoice(req, res, next);
    } catch (e) {
        next(e);
    }
});

export default router;
