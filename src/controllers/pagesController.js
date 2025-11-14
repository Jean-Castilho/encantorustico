import { apiFetch } from '../utils/apiClient.js';
import { getCartDetails } from '../services/cartService.js';

// Helper Functions;

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

const getProductsPage = (req, res) => {
  renderProductsPage(res, '../pages/public/products', {
    titulo: 'Todos os Produtos - Encanto Rústico',
    estilo: 'home',
    mensagem: 'Conheça todos os nossos produtos',
  });

};

//if user == admin;
const getAddProductPage = (req, res) => {
  renderPage(res, '../pages/public/addProduct', {
    titulo: 'Adicionar Produto',
  });
};

const getDetalheProductPage = async (req, res) => {
  try {
    const { id } = req.params;
    const resProduct = await apiFetch(`/products/${id}`);

    const product = (resProduct && resProduct.data) ? resProduct.data : resProduct;

    if (!product) {
      return res.status(404).render('../pages/public/error', {
        titulo: 'Erro',
        mensagem: 'Produto não encontrado.',
      });
    }

    renderPage(res, '../pages/public/detalheproduct', {
      titulo: 'Detalhes do Produto',
      product: product,
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
    mensagem: 'Seu pagamento foi recebido com sucesso!',
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
    const { id } = req.params;
    const apiRes = await apiFetch(`/products/${id}`);
    const product = (apiRes && apiRes.data) ? apiRes.data : apiRes;

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

const changePasswordPage = (req, res) => {
  renderPage(res, '../pages/auth/otpCode', {
    titulo: 'Alterar Senha',
    mensagem: 'solicite o codigo para redefinir senha',
  });
};


export {
  getHomePage,
  getContactPage,
  getAboutPage,
  getProductsPage,
  getAddProductPage,
  getDetalheProductPage,
  getPaymentPage,
  getPaymentConfirmationPage,
  updateCartDetails,
  getEditProductPage,
  changePasswordPage
};
