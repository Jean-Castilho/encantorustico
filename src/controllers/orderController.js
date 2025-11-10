import { apiFetch } from '../utils/apiClient.js';
import dotenv from 'dotenv';
import { getCartDetails } from '../services/cartService.js';
import { validateOrderItems, buildOrderItems } from '../services/orderService.js';
import { formatCurrency, formatDate, formatTime, statusLabel } from '../utils/formatters.js';

dotenv.config();

const renderPage = (res, page, options = {}) => {
  // disponibiliza helpers nas views;
  res.locals.formatters = { formatCurrency, formatDate, formatTime, statusLabel };
  res.render(res.locals.layout, {
    page,
    ...options
  });
};

const handleError = (res, error, page, data) => {
  console.error(`Error on page ${page}:`, error.message);
  renderPage(res, page, data);
};

export const getCheckoutPage = async (req, res) => {
  const pageOptions = {
    titulo: 'Checkout - Encanto Rústico',
    cart: { items: [] },
    totalPrice: 0,
    totalItems: 0,
  };

  if (!req.session.user) {
    return res.redirect('/login');
  }

  let { selectedItems } = req.query;

  if (!selectedItems || selectedItems.length === 0) {
    return res.redirect('/cart');
  }

  // Garante que selectedItems seja um array
  if (!Array.isArray(selectedItems)) {
    selectedItems = [selectedItems];
  }

  try {
    const { items: allCartItems } = await getCartDetails(req.session.user.cart);

    // Filtra os itens do carrinho para incluir apenas os selecionados
    const selectedCartItems = allCartItems.filter(item => selectedItems.includes(item._id.toString()));

    // Se, por algum motivo, nenhum item corresponder (ex: URL manipulada), volta ao carrinho
    if (selectedCartItems.length === 0) {
      return res.redirect('/cart');
    }

    let totalPrice = 0;
    let totalItems = 0;
    selectedCartItems.forEach(item => {
      totalPrice += (parseFloat(item.preco) || 0) * (parseInt(item.quantity, 10) || 0);
      totalItems += parseInt(item.quantity, 10) || 0;
    });

    pageOptions.cart.items = selectedCartItems;
    pageOptions.totalPrice = totalPrice;
    pageOptions.totalItems = totalItems;

    renderPage(res, '../pages/public/checkout', { ...pageOptions, mensagem: 'Finalize sua compra aqui.' });
  } catch (error) {
    handleError(res, error, '../pages/public/checkout', { ...pageOptions, mensagem: 'Erro ao carregar seu carrinho. Tente novamente mais tarde.' });
  }
};

export const getOrdersPage = async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const pageOptions = {
    titulo: 'Meus Pedidos',
    orders: [],
  };

  try {
    const userId = req.session.user._id;
    const resOrders = await apiFetch(`/orders/${userId}`);
    const orders = resOrders.data;

    if (!orders || orders.length === 0) {
      return renderPage(res, '../pages/public/orders', { ...pageOptions, mensagem: 'Você ainda não fez nenhum pedido.' });
    }

    pageOptions.orders = orders;

    if (!orders || orders.length === 0) {
      return renderPage(res, '../pages/public/orders', { ...pageOptions, mensagem: 'Você ainda não fez nenhum pedido.' });
    }

    renderPage(res, '../pages/public/orders', { ...pageOptions, mensagem: 'Seu histórico de pedidos.' });
  } catch (error) {

    const apiMessage = (error && error.data && (error.data.message || error.data.msg)) || error.message || 'Erro ao carregar seu histórico de pedidos.';
    console.error('Erro ao buscar orders para usuário:', apiMessage, error);
    return renderPage(res, '../pages/public/orders', { ...pageOptions, mensagem: apiMessage });
  }
};

export const createOrder = async (req, res) => {
  try {
    const validatedItems = await validateOrderItems(req.body.items);

    const { endereco } = req.body;

    const { _id, name, role, telefone } = req.session.user;

    const payment_data = {
      description: 'Pagamento PIX - Encanto Rústico',
      payment_method: 'pix',
    };

    const orderItems = buildOrderItems(req.body.items, validatedItems);

    let orderStatus;
    let number = telefone.number;
    orderStatus = 'pending';

    const orderPayload = {
      user: { id: _id, name, role, number },
      items: orderItems,
      endereco: endereco,
      paymentMethod: payment_data,
      status: orderStatus,
    };

    const apiResponse = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    });

    if (!apiResponse || !apiResponse.success) {
      throw new Error(apiResponse.message || 'Falha ao criar o pedido na API.');
    }

    const user = req.session.user;
    user.pedidos.push(apiResponse.data._id);

    const userUpdate = await apiFetch(`/privacy/${req.session.user._id}`, {
      method: "PUT",
      body: JSON.stringify(user),
    });

    req.session.user = { ...req.session.user, ...userUpdate.data };

    const pageOptions = {
      titulo: 'Pedido Confirmado',
      mensagem: 'Seu pedido foi recebido com sucesso!',
      order: apiResponse.data,
      qr_code: apiResponse.data.paymentMethod.payment.qr_code,
      qr_code_base64: apiResponse.data.paymentMethod.payment.qr_code_base64
    };

    return res.render('layout/main', {
      page: '../pages/public/payment-confirmation',
      ...pageOptions,
    });

  } catch (error) {
    console.error('Erro ao criar o pedido:', error);
    handleError(res, error, '../pages/public/error', {
      titulo: 'Erro ao Criar Pedido',
      mensagem: error.message,
      error: { status: error.statusCode || 500, stack: error.stack }
    });
  }
};

export const payOrder = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).send('Order id missing');

    // Chama API para iniciar pagamento (endpoint hipotético)
    const apiRes = await apiFetch(`/orders/${id}/payment`, { method: 'PATCH' });;

    console.log('API Response:', apiRes);

    const pageOptions = {
      titulo: 'Confirmação de Pagamento',
      mensagem: 'Por favor, confirme seu pagamento abaixo.',
      order: apiRes.data,
      qr_code: apiRes.data.paymentMethod.payment.qr_code,
      qr_code_base64: apiRes.data.paymentMethod.payment.qr_code_base64
    };

    // Caso contrário renderiza página de pagamento com dados retornados
    return renderPage(res, '../pages/public/payment-confirmation', { ...pageOptions });
  } catch (error) {
    console.error('Erro ao iniciar pagamento:', error);
    return handleError(res, error, '../pages/public/error', { titulo: 'Erro no Pagamento', mensagem: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!orderId) return res.status(400).send('Order id missing');

    const apiRes = await apiFetch(`/orders/${orderId}/cancel`, { method: 'PUT' });

    // redireciona ao histórico de pedidos
    req.session.message = apiRes.message || 'Pedido cancelado.';
    return res.redirect('/orders');
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    return handleError(res, error, '../pages/public/error', { titulo: 'Erro ao Cancelar', mensagem: error.message });
  }
};

export const getInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!orderId) return res.status(400).send('Order id missing');

    // Endpoint que retorna PDF como buffer ou base64
    const apiRes = await apiFetch(`/orders/${orderId}/invoice`, { method: 'GET' });

    if (!apiRes) return res.status(404).send('Invoice not found');

    // Se a API retornar base64
    if (apiRes.base64) {
      const buffer = Buffer.from(apiRes.base64, 'base64');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);
      return res.send(buffer);
    }

    // Se API retornar URL para download
    if (apiRes.url) {
      return res.redirect(apiRes.url);
    }

    return res.status(500).send('Formato de invoice desconhecido');
  } catch (error) {
    console.error('Erro ao obter invoice:', error);
    return handleError(res, error, '../pages/public/error', { titulo: 'Erro ao Baixar Fatura', mensagem: error.message });
  }
};


