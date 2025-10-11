import { apiFetch } from '../utils/apiClient.js';

// Helper Functions

/**
 * Normalizes the product data from the API to a consistent format.
 * @param {Array|Object} data - The data from the API.
 * @returns {Array} - A normalized array of products.
 */
const normalizeProducts = (data) => {
  let products = [];
  if (Array.isArray(data)) products = data;
  else if (data && Array.isArray(data.products)) products = data.products;
  else if (data && Array.isArray(data.data)) products = data.data;
  else if (data && typeof data === 'object' && Object.keys(data).length > 0) products = [data];

  return products.map(p => ({
    ...p,
    imagens: Array.isArray(p.imagens) ? p.imagens : []
  }));
};

/**
 * Renders a page with a standard set of options.
 * @param {Object} res - The Express response object.
 * @param {String} page - The path to the EJS template.
 * @param {Object} options - The options to pass to the template.
 */
const renderPage = (res, page, options = {}) => {
  res.render(res.locals.layout, { 
    page, 
    ...options,
    apiBaseUrl: process.env.API_BASE_URL 
  });
};

/**
 * Handles errors by logging them and rendering an error page or a page with empty data.
 * @param {Object} res - The Express response object.
 * @param {Error} error - The error object.
 * @param {String} page - The page to render in case of an error.
 * @param {Object} data - The default data to render on the page.
 */
const handleError = (res, error, page, data) => {
  console.error(`Error on page ${page}:`, error.message);
  renderPage(res, page, data);
};

/**
 * Fetches product data and renders a page.
 * @param {Object} res - The Express response object.
 * @param {String} page - The path to the EJS template.
 * @param {Object} options - The options for the page.
 */
const renderProductsPage = async (res, page, options) => {
  try {
    const productData = await apiFetch('/products/getProducts');
    const products = normalizeProducts(productData);
    renderPage(res, page, { ...options, products, allProducts: products });
  } catch (error) {
    handleError(res, error, page, { ...options, products: [], allProducts: [] });
  }
};

/**
 * Gets the details of the items in the cart.
 * @param {Array} cartProducts - An array of product IDs from the session.
 * @returns {Object} - An object containing cart items, total price, and total items.
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

// Page Controllers

const getHomePage = (req, res) => {
  renderProductsPage(res, '../pages/public/home', {
    titulo: 'Encanto Rústico',
    estilo: 'home',
    mensagem: 'Bem-vindo à nossa loja de móveis e decorações rústicas!',
  });
};

const getProductsPage = (req, res) => {
  renderProductsPage(res, '../pages/public/products', {
    titulo: 'Todos os Produtos - Encanto Rústico',
    estilo: 'home',
    mensagem: 'Conheça todos os nossos produtos',
  });
};

const getAboutPage = (req, res) => {
  renderPage(res, '../pages/public/about', {
    titulo: 'Sobre Nós - Encanto Rústico',
    mensagem: 'Conheça mais sobre a nossa história.',
  });
};

const getContactPage = (req, res) => {
  renderPage(res, '../pages/public/contact', {
    titulo: 'Contato - Encanto Rústico',
    mensagem: 'Entre em contato conosco.',
    pageIdentifier: 'contact',
  });
};

const getFavoritesPage = async (req, res) => {
  const pageOptions = {
    titulo: 'Meus Favoritos',
    favorites: [],
  };

  if (!req.session.user) {
    return renderPage(res, '../pages/public/favorites', { ...pageOptions, mensagem: 'Usuário não autenticado' });
  }

  const { favorites: favoritProducts } = req.session.user;

  if (!favoritProducts || favoritProducts.length === 0) {
    return renderPage(res, '../pages/public/favorites', { ...pageOptions, mensagem: 'Você ainda não adicionou nenhum produto aos seus favoritos.' });
  }

  try {
    const resApi = await apiFetch('/public/ProductsFavorit', {
      method: 'POST',
      body: JSON.stringify({ favoritProducts }),
    });
    renderPage(res, '../pages/public/favorites', { ...pageOptions, favorites: resApi.data, mensagem: 'Seus produtos favoritos.' });
  } catch (error) {
    handleError(res, error, '../pages/public/favorites', { ...pageOptions, mensagem: 'Erro ao carregar seus favoritos. Tente novamente mais tarde.' });
  }
};

const getCartPage = async (req, res) => {
  const pageOptions = {
    titulo: 'Carrinho',
    cart: { items: [] },
    totalPrice: 0,
    totalItems: 0,
  };

  if (!req.session.user) {
    return renderPage(res, '../pages/public/cart', { ...pageOptions, mensagem: 'Você precisa estar logado para ver seu carrinho.' });
  }

  try {
    const { items, totalPrice, totalItems } = await getCartDetails(req.session.user.cart);
    renderPage(res, '../pages/public/cart', { ...pageOptions, cart: { items }, totalPrice, totalItems, mensagem: 'Seus produtos no carrinho.' });
  } catch (error) {
    handleError(res, error, '../pages/public/cart', { ...pageOptions, mensagem: 'Erro ao carregar seu carrinho. Tente novamente mais tarde.' });
  }
};

const getLoginPage = (req, res) => {
  renderPage(res, '../pages/public/login', {
    titulo: 'Login - Encanto Rústico',
    estilo: 'auth',
    mensagem: 'Faça login na sua conta.',
  });
};

const getRegisterPage = (req, res) => {
  renderPage(res, '../pages/public/register', {
    titulo: 'Registrar - Encanto Rústico',
    estilo: 'auth',
    mensagem: 'Crie uma nova conta.',
  });
};

const getProfilePage = (req, res) => {
  renderPage(res, '../pages/public/profile', {
    titulo: 'Perfil - Encanto Rústico',
    mensagem: 'Veja e edite suas informações de perfil.',
  });
};

const getAddProductPage = (req, res) => {
  renderPage(res, '../pages/public/addProduct', {
    titulo: 'Adicionar Produto',
  });
};

const getDetalheProductPage = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const product = await apiFetch(`/products/getProductById/${productId}`);
    renderPage(res, '../pages/public/detalheproduct', {
      titulo: 'Detalhes do Produto',
      product,
    });
  } catch (error) {
    const status = error.status || 500;
    const message = status === 404 ? 'Produto não encontrado.' : 'Erro ao buscar detalhes do produto.';
    res.status(status);
    handleError(res, error, '../pages/public/error', { titulo: 'Erro', mensagem: message });
  }
};

const getPaymentPage = async (req, res) => {
  const pageOptions = {
    titulo: 'Pagamento - Encanto Rústico',
    products: [],
  };

  if (!req.session.user) {
    return renderPage(res, '../pages/public/payment', { ...pageOptions, mensagem: 'Você precisa estar logado para finalizar a compra.' });
  }

  try {
    const { items, totalPrice, totalItems } = await getCartDetails(req.session.user.cart);
    renderPage(res, '../pages/public/payment', {
      ...pageOptions,
      products: items,
      totalPrice,
      totalItems,
      mensagem: 'Finalize sua compra aqui.',
    });
  } catch (error) {
    handleError(res, error, '../pages/public/payment', { ...pageOptions, mensagem: 'Erro ao carregar dados. Tente novamente.' });
  }
};

const getDeliveryDashboardPage = (req, res) => {
  const orders = [];

  renderPage(res, '../pages/delivery/Dashboard', {
    titulo: 'Dashboard de Entrega - Encanto Rústico',
    mensagem: 'Página de entrega é rota',
    orders,
  });
};

const getPaymentConfirmationPage = (req, res) => {
  renderPage(res, '../pages/public/payment-confirmation', {
    titulo: 'Pagamento Confirmado - Encanto Rústico',
    mensagem: 'Seu pedido foi recebido com sucesso!',
  });
};

export {
  getHomePage,
  getProductsPage,
  getAboutPage,
  getContactPage,
  getCartPage,
  getFavoritesPage,
  getProfilePage,
  getLoginPage,
  getRegisterPage,
  getAddProductPage,
  getDetalheProductPage,
  getPaymentPage,
  getDeliveryDashboardPage,
  getPaymentConfirmationPage,
};
