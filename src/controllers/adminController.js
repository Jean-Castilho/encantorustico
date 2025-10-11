import { apiFetch } from '../utils/apiClient.js';

// Helper Functions

/**
 * Renders an admin page with a standard set of options.
 * @param {Object} res - The Express response object.
 * @param {String} page - The path to the EJS template.
 * @param {Object} options - The options to pass to the template.
 */
const renderAdminPage = (res, page, options = {}) => {
  res.render(res.locals.layout || './layout/admin', { page, ...options });
};

/**
 * Handles errors by logging them and rendering a page with an error message.
 * @param {Object} res - The Express response object.
 * @param {Error} error - The error object.
 * @param {String} page - The page to render in case of an error.
 * @param {Object} data - The default data to render on the page.
 */
const handleError = (res, error, page, data) => {
  console.error(`Error on admin page ${page}:`, error.message);
  renderAdminPage(res, page, { ...data, error: `Não foi possível carregar os dados: ${error.message}` });
};

/**
 * Normalizes product data from the API.
 * @param {any} data - The data from the API.
 * @returns {Array} - A normalized array of products.
 */
const normalizeProducts = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.products)) return data.products;
  return [];
};

/**
 * Normalizes order data from the API.
 * @param {any} data - The data from the API.
 * @returns {Array} - A normalized array of orders.
 */
const normalizeOrders = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.orders)) return data.orders;
  return [];
};

// Admin Page Controllers

export const getAdminDashboard = (req, res) => {
  renderAdminPage(res, '../pages/admin/dashboard', {
    titulo: 'Dashboard',
  });
};

export const getInventoryPage = async (req, res) => {
  const pageOptions = {
    titulo: 'Gerenciar Estoque',
    products: [],
  };

  try {
    const resApi = await apiFetch('/products/getProducts');
    const products = normalizeProducts(resApi);
    renderAdminPage(res, '../pages/admin/inventory', { ...pageOptions, products });
  } catch (error) {
    handleError(res, error, '../pages/admin/inventory', pageOptions);
  }
};

export const getOrdersPage = async (req, res) => {
  const pageOptions = {
    titulo: 'Gerenciar Pedidos',
    orders: [],
  };

  try {
    const resApi = await apiFetch('/orders');
    const orders = normalizeOrders(resApi);
    renderAdminPage(res, '../pages/admin/orders', { ...pageOptions, orders });
  } catch (error) {
    handleError(res, error, '../pages/admin/orders', pageOptions);
  }
};

export const getUsersPage = (req, res) => {
  renderAdminPage(res, '../pages/admin/users', {
    titulo: 'Gerenciar Usuários',
  });
};