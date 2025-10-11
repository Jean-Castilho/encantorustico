import { Router } from 'express';
import { 
    createOrder,
    getCheckoutPage,
    getOrdersPage 
} from '../controllers/orderController.js';

const router = Router();

// Rota para exibir a página de checkout
router.get('/checkout', getCheckoutPage);

// Rota para exibir o histórico de pedidos do usuário
router.get('/pedidos', getOrdersPage);

// Rota para criar um novo pedido (Endpoint da API)
router.post('/', createOrder);


export default router;