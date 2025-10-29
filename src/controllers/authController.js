import { apiFetch } from '../utils/apiClient.js';

import { getCartDetails } from '../services/cartService.js';
// Helper Functions

const renderPage = (res, page, options = {}) => {
  res.render(res.locals.layout, {
    page,
    ...options,
    apiBaseUrl: process.env.API_BASE_URL
  });
};

const handleError = (res, error, page, data) => {
  console.error(`Error on page ${page}:`, error.message);
  renderPage(res, page, data);
};

/**
 * Handles a successful authentication by setting the session and redirecting.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Object} data - The data received from the API, including user and cookie info.
 */
const handleAuthSuccess = (req, res, data) => {
  req.session.user = data.user;
  if (data.setCookieHeader) {
    res.setHeader('Set-Cookie', data.setCookieHeader);
  }
  res.redirect('/');
};

/**
 * Handles an authentication error by rendering the appropriate page with an error message.
 * @param {Object} res - The Express response object.
 * @param {Error} error - The error object.
 * @param {String} page - The page to render (e.g., '../pages/public/login').
 * @param {String} titulo - The title of the page.
 * @param {String} defaultErrorMessage - A default error message to use if the API doesn't provide one.
 */
const handleAuthError = (res, error, page, titulo, defaultErrorMessage) => {
  res.status(error.status || 500).render('layout/main', {
    page,
    titulo,
    error: error.message || defaultErrorMessage,
  });
};

export const getLoginPage = (req, res) => {
  renderPage(res, '../pages/auth/login', {
    titulo: 'Login - Encanto Rústico',
    estilo: 'auth',
    mensagem: 'Faça login na sua conta.',
  });
};

export const getRegisterPage = (req, res) => {
  renderPage(res, '../pages/auth/register', {
    titulo: 'Registrar - Encanto Rústico',
    estilo: 'auth',
    mensagem: 'Crie uma nova conta.',
  });
}

export const getProfilePage = (req, res) => {
  renderPage(res, '../pages/auth/profile', {
    titulo: 'Perfil - Encanto Rústico',
    mensagem: 'Veja e edite suas informações de perfil.',
  });
};

export const getFavoritesPage = async (req, res) => {
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

export const getCartPage = async (req, res) => {
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

// Authentication Controllers;

export async function login(req, res) {
  const { email, password } = req.body;
  try {
    const { data } = await apiFetch('/public/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    handleAuthSuccess(req, res, data);

  } catch (error) {
    handleAuthError(
      res,
      error,
      '../pages/public/login',
      'Login - Encanto Rústico',
      'Ocorreu um erro no servidor. Tente novamente mais tarde.'
    );
  }
}

export async function register(req, res) {
  const { name, number, email, password } = req.body;
  try {
    const { data } = await apiFetch('/public/createUser', {
      method: 'POST',
      body: JSON.stringify({ name, number, email, password }),
    });

    req.session.user = data.user;

    const otpResponse = await apiFetch('/email/sendOtp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    res.render('layout/main', {
      page: '../pages/auth/otpCode',
      titulo: 'Verificação de Código',
      mensagem: 'Um código OTP foi enviado para o seu e-mail.',
      email
    });

  } catch (error) {
    handleAuthError(
      res,
      error,
      '../pages/auth/register',
      'Registrar - Encanto Rústico',
      'Não foi possível criar a conta. Verifique os dados.'
    );
  }
}

export function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erro ao destruir a sessão:", err);
      // Fallback to redirect even if session destruction has issues
      return res.status(500).redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
}