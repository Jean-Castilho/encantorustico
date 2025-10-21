import { apiFetch } from '../utils/apiClient.js';

const renderAdminPage = (res, page, options = {}) => {
  res.render(res.locals.layout || './layout/admin', { page, ...options });
};

const handleError = (res, error, page, data) => {
  console.error(`Error on admin page ${page}:`, error.message);
  renderAdminPage(res, page, { ...data, error: `Não foi possível carregar os dados: ${error.message}` });
};

export const getAdminDashboard = (req, res) => {
  renderAdminPage(res, '../pages/admin/dashboard', {
    titulo: 'Dashboard',
  });
};

export const getInventoryPage = async (req, res) => {

  if (!req.session.user) {
    return res.redirect('/login');
  }

  const pageOptions = {
    titulo: 'Gerenciar Estoque',
    products: [],
  };

  try {
    const resApi = await apiFetch('/products');
    const products = resApi.data;
    renderAdminPage(res, '../pages/admin/inventory', { ...pageOptions, products });
  } catch (error) {
    handleError(res, error, '../pages/admin/inventory', pageOptions);
  }
};

export const getOrdersPage = async (req, res) => {

  const pageOptions = {
    titulo: 'Gerenciar Pedidos',
    orders: []

  };
  try {
      const resApi = await apiFetch('/orders/',
        { method: 'GET' }
      );

      pageOptions.orders = resApi.data;

      console.log('page option fetched:', pageOptions);

    renderAdminPage(res, '../pages/admin/orders', { ...pageOptions });

  } catch (error) {
    handleError(res, error, '../pages/admin/orders', pageOptions);
  }
};

export const getUsersPage = (req, res) => {
  renderAdminPage(res, '../pages/admin/users', {
    titulo: 'Gerenciar Usuários',
  });
};

