import { apiFetch } from '../utils/apiClient.js';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente.
dotenv.config();

// --- Funções Auxiliares (Copiadas de pagesController para autossuficiência) ---

/**
 * Renderiza uma página com um conjunto padrão de opções.
 */
const renderPage = (res, page, options = {}) => {
  res.render(res.locals.layout, {
    page,
    ...options,
    apiBaseUrl: process.env.API_BASE_URL
  });
};

/**
 * Lida com erros, registrando-os e renderizando uma página de erro.
 */
const handleError = (res, error, page, data) => {
  console.error(`Error on page ${page}:`, error.message);
  renderPage(res, page, data);
};

/**
 * Busca os detalhes dos itens do carrinho.
 */
const getCartDetails = async (cartProducts) => {
  if (!cartProducts || cartProducts.length === 0) {
    return { items: [], totalPrice: 0, totalItems: 0 };
  }

  const productQuantities = cartProducts.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  const uniqueProductIds = Object.keys(productQuantities);

  const detailsResApi = await apiFetch('/public/productsCart', {
    method: 'POST',
    body: JSON.stringify({ cartProducts: uniqueProductIds }),
  });

  const detailedProducts = detailsResApi.data || [];

  const items = detailedProducts.map(product => ({
    ...product,
    quantity: productQuantities[product._id.toString()] || 0
  }));

  const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.preco) || 0) * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, totalPrice, totalItems };
};


// --- Controladores de Pedidos ---

/**
 * Valida os dados essenciais da requisição para criação de um pedido.
 */
const validateOrderRequest = (req) => {
  if (!req.session.user || !req.session.user._id) {
    const error = new Error('Usuário não autenticado.');
    error.statusCode = 401;
    throw error;
  }
  const { endereco, items, paymentMethod } = req.body;
  if (!endereco || !items || !Array.isArray(items) || items.length === 0 || !paymentMethod) {
    const error = new Error('Dados do pedido incompletos ou inválidos.');
    error.statusCode = 400;
    throw error;
  }
};

/**
 * Valida os itens do pedido consultando a API de produtos.
 */
const validateOrderItems = async (items) => {
  const productIds = items.map(item => item.productId);
  const productsApiResult = await apiFetch('/public/productsCart', {
    method: 'POST',
    body: JSON.stringify({ cartProducts: productIds }),
  });

  if (!productsApiResult || !productsApiResult.success || !productsApiResult.data) {
    throw new Error('Não foi possível validar os produtos do carrinho via API.');
  }

  const foundIds = productsApiResult.data.map(p => p._id.toString());
  const notFound = productIds.filter(id => !foundIds.includes(id));

  if (notFound.length > 0) {
    throw new Error(`Os seguintes produtos não foram encontrados: ${notFound.join(', ')}`);
  }
  return productsApiResult.data;
};

/**
 * Exibe a página de checkout com os itens do carrinho.
 */
export const getCheckoutPage = async (req, res) => {
  const pageOptions = {
    titulo: 'Checkout - Encanto Rústico',
    cart: { items: [] },
    totalPrice: 0,
    totalItems: 0,
  };

  if (!req.session.user) {
    return res.redirect('/login');
  };

  try {
    const { items, totalPrice, totalItems } = await getCartDetails(req.session.user.cart);
    renderPage(res, '../pages/public/checkout', { ...pageOptions, cart: { items }, totalPrice, totalItems, mensagem: 'Finalize sua compra aqui.' });
  } catch (error) {
    handleError(res, error, '../pages/public/checkout', { ...pageOptions, mensagem: 'Erro ao carregar seu carrinho. Tente novamente mais tarde.' });
  }
};

/**
 * Exibe a página de histórico de pedidos do usuário.
 */
export const getOrdersPage = async (req, res) => {
  const pageOptions = {
    titulo: 'Meus Pedidos',
    orders: [],
  };

  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const orders = await apiFetch(`/orders?userId=${req.session.user._id}`);
    if (!orders || orders.length === 0) {
      return renderPage(res, '../pages/public/orders', { ...pageOptions, mensagem: 'Você ainda não fez nenhum pedido.' });
    }

    const productIds = orders.flatMap(order => order.items.map(item => item.productId));
    const uniqueProductIds = [...new Set(productIds)];

    const productsData = await apiFetch('/public/productsCart', {
      method: 'POST',
      body: JSON.stringify({ cartProducts: uniqueProductIds }),
    });

    const productsMap = new Map(productsData.data.map(p => [p._id.toString(), p]));

    const enrichedOrders = orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        ...item,
        productDetails: productsMap.get(item.productId.toString()),
      })),
    }));

    renderPage(res, '../pages/public/orders', { ...pageOptions, orders: enrichedOrders, mensagem: 'Seu histórico de pedidos.' });

  } catch (error) {
    handleError(res, error, '../pages/public/orders', { ...pageOptions, mensagem: 'Erro ao carregar seu histórico de pedidos.' });
  }
};

/**
 * Processa a criação de um novo pedido.
 */
export const createOrder = async (req, res) => {
  try {
    validateOrderRequest(req);
    const validatedItems = await validateOrderItems(req.body.items);
    const totalPrice = validatedItems.reduce((acc, item) => acc + item.preco, 0);
    const {endereco } = req.body;

    let orderStatus;

    orderStatus = 'pending_payment';
    const payment_data = {
      transaction_amount: totalPrice,
      description: 'Pagamento PIX - Encanto Rústico',
      payment_method_id: 'pix',
      payer: {
        userId: req.session.user.userId,
      },
    };

    const orderItems = req.body.items.map(item => {
      const productDetails = validatedItems.find(p => p._id.toString() === item.productId);
      return {
        productId: item.productId,
        quantity: parseInt(item.quantity, 10),
        price: productDetails.preco,
        name: productDetails.nome, // Adicionando nome para integridade
        sku: productDetails.sku || null // Adicionando SKU para integridade
      };
    });

    const orderPayload = {
      userId: req.session.user._id,
      items: orderItems,
      endereco: endereco,
      totalPrice: totalPrice,
      paymentMethod: payment_data,
      status: orderStatus,
    };

    console.log("Payload do pedido:", orderPayload);
    
    console.log('bearer', req.cookie);

    const apiResponse = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    });

    if (!apiResponse || !apiResponse.success) {
      throw new Error(apiResponse.message || 'Falha ao criar o pedido na API.');
    }

    const user = req.session.user;

    if (!Array.isArray(user.pedidos)) {
      user.pedidos = [];
    }
    user.pedidos.push(apiResponse.data._id);


    const responsUp = await apiFetch(`/privacy/updateUser/${req.session.user._id}`,{
      method: "PUT",
      body: JSON.stringify(user)
    });

    console.log(responsUp);

    const pageOptions = {
      titulo: 'Pagamento Confirmado - Encanto Rústico',
      mensagem: 'Seu pedido foi recebido com sucesso!',
    };

    renderPage(res, '../pages/public/paymant-confirmation', { ...pageOptions, mensagem: 'pedido concluido' });

  } catch (error) {
    console.error('Erro ao criar o pedido:', error);
    handleError(res, error, '../pages/public/error', {
        titulo: 'Erro ao Criar Pedido',
        mensagem: error.message,
        error: { status: error.statusCode || 500, stack: error.stack }
    });
  }
};
