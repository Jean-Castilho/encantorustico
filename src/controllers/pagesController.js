import { apiFetch } from '../utils/apiClient.js';
import { getCartDetails } from '../services/cartService.js';

// Helper Functions

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

const renderPage = (res, page, options = {}) => {
  res.render(res.locals.layout, { 
    page, 
    ...options,
    apiBaseUrl: process.env.API_BASE_URL 
  });
};


const renderProductsPage = async (res, page, options) => {
  try {
    const productData = await apiFetch('/products');

    const products = normalizeProducts(productData);

    renderPage(res, page, { ...options, products, allProducts: products });
  } catch (error) {
    handleError(res, error, page, { ...options, products: [], allProducts: [] });
  }
};

const handleError = (res, error, page, data) => {
  console.error(`Error on page ${page}:`, error.message);
  renderPage(res, page, data);
};

const getHomePage = (req, res) => {
  renderProductsPage(res, '../pages/public/home', {
    titulo: 'Encanto Rústico',
    estilo: 'home',
    mensagem: 'Bem-vindo à nossa loja de móveis e decorações rústicas!',
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
}

const getProfilePage = (req, res) => {
  renderPage(res, '../pages/public/profile', {
    titulo: 'Perfil - Encanto Rústico',
    mensagem: 'Veja e edite suas informações de perfil.',
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
  };

  try {
    const { items, totalPrice, totalItems } = await getCartDetails(req.session.user.cart);
    renderPage(res, '../pages/public/cart', { ...pageOptions, cart: { items }, totalPrice, totalItems, mensagem: 'Seus produtos no carrinho.' });
  } catch (error) {
    handleError(res, error, '../pages/public/cart', { ...pageOptions, mensagem: 'Erro ao carregar seu carrinho. Tente novamente mais tarde.' });
  };
};

const getProductsPage = (req, res) => {
  renderProductsPage(res, '../pages/public/products', {
    titulo: 'Todos os Produtos - Encanto Rústico',
    estilo: 'home',
    mensagem: 'Conheça todos os nossos produtos',
  });

};

//if user == admin
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

const getPaymentConfirmationPage = (req, res) => {
  renderPage(res, '../pages/public/payment-confirmation', {
    titulo: 'Pagamento Confirmado - Encanto Rústico',
    mensagem: 'Seu pedido foi recebido com sucesso!',


  });
};

const getDeliveryDashboardPage = (req, res) => {
  const orders = [];

  renderPage(res, '../pages/delivery/Dashboard', {
    titulo: 'Dashboard de Entrega - Encanto Rústico',
    mensagem: 'Página de entrega é rota',
    orders,
  });
};

const updateCartDetails = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const { items, totalPrice, totalItems } = await getCartDetails(req.session.user.cart);
    res.json({ items, totalPrice, totalItems });
  } catch (error) {
    console.error('Erro ao atualizar os detalhes do carrinho:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar os detalhes do carrinho.' });
  }
};

const getEditProductPage = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const apiRes = await apiFetch(`/products/getProductById/${productId}`);
    const product = (apiRes && apiRes.data) ? apiRes.data : apiRes;

    console.log('Fetched product for editing:', product);

    if (!product) {
      return res.status(404).render('../pages/public/error', {
        titulo: 'Erro',
        mensagem: 'Produto não encontrado.',
      });
    }

    // Normaliza valores para a view (evita lógica inline em EJS)
    const nomeVal = product.nome || '';
    const slugVal = product.slug || '';
    const precoVal = (product.preco != null) ? product.preco : '';
    const categoriaVal = product.categoria || '';
    const colecaoVal = product.colecao || '';
    const descricaoVal = product.descricao || '';
    const ambientesVal = product.ambientes || '';
    const requerMontagemChecked = (product.requerMontagem === 'on' || product.requerMontagem === true) ? 'checked' : '';
    const ativoChecked = (product.ativo === 'true' || product.ativo === true) ? 'checked' : '';
    const garantiaVal = product.garantia || '';
    const pesoVal = product.peso || '';
    const estoqueVal = (product.estoque != null) ? product.estoque : 0;
    const alturaVal = (product.dimensoes && product.dimensoes.altura) ? product.dimensoes.altura : (product.altura || '');
    const larguraVal = (product.dimensoes && product.dimensoes.largura) ? product.dimensoes.largura : (product.largura || '');
    const profundidadeVal = (product.dimensoes && product.dimensoes.profundidade) ? product.dimensoes.profundidade : (product.profundidade || '');

    renderPage(res, '../pages/public/editProduct', {
      titulo: 'Editar Produto',
      product,
      nomeVal,
      slugVal,
      precoVal,
      categoriaVal,
      colecaoVal,
      descricaoVal,
      ambientesVal,
      requerMontagemChecked,
      ativoChecked,
      garantiaVal,
      pesoVal,
      estoqueVal,
      alturaVal,
      larguraVal,
      profundidadeVal,
    });
  } catch (error) {
    const status = error.status || 500;
    const message = status === 404 ? 'Produto não encontrado.' : 'Erro ao buscar detalhes do produto.';
    res.status(status);
    handleError(res, error, '../pages/public/error', { titulo: 'Erro', mensagem: message });
  }
};

export {
  getHomePage,
  getContactPage,
  getAboutPage,
  getLoginPage,
  getRegisterPage,
  getProfilePage,
  getFavoritesPage,
  getCartPage,
  getProductsPage,
  getAddProductPage,
  getDetalheProductPage,
  getPaymentPage,
  getPaymentConfirmationPage,
  getDeliveryDashboardPage,
  updateCartDetails,
  getEditProductPage
};
