import { apiFetch } from '../utils/apiClient.js';

const renderAdminPage = (res, page, options = {}) => {
  res.render(res.locals.layout || './layout/admin', { page, ...options });
};

const handleError = (res, error, page, data) => {
  console.error(`Error on admin page ${page}:`, error.message);
  renderAdminPage(res, page, { ...data, error: `Não foi possível carregar os dados: ${error.message}` });
};

export const getAdminDashboard = async (req, res) => {

  if (!req.session.user) {
    return res.redirect('/login');
  }

  const resApiUsers = await apiFetch('/public/users', {
    method: 'GET'
  }
  );
  const users = resApiUsers.data;

  const resApiProduct = await apiFetch('/products');
  const products = resApiProduct.data;

  const resApiOrders = await apiFetch('/orders/',
    { method: 'GET' }
  );

  const ordernsApproved = resApiOrders.data.filter(order => order.status === 'approved');
  const totalPriceApproved = parseFloat(ordernsApproved.reduce((total, order) => total + order.valor, 0).toFixed(3));



  renderAdminPage(res, '../pages/admin/dashboard', {
    titulo: 'Dashboard',
    totalPriceApproved, totalPriceApproved,
    totalUsers: users.length,
    totalProducts: products.length,
    totalOrders: ordernsApproved.length,
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
    totalApproved: 0,
    totalDelivered: 0,
    ordernsEnviada: 0,
    orders: []
  };

  try {
    const resApi = await apiFetch('/orders/',
      { method: 'GET' }
    );

    const ordernsApproved = resApi.data.filter(order => order.status === 'approved');
    pageOptions.totalApproved = ordernsApproved.length;

    const ordernsDelivered = resApi.data.filter(order => order.status === 'delivered');
    pageOptions.totalDelivered = ordernsDelivered.length;

    const ordernsEnviada = resApi.data.filter(order => order.status === 'shipped');
    pageOptions.ordernsEnviada = ordernsEnviada.length;

    pageOptions.orders = [...ordernsEnviada, ...ordernsApproved, ...ordernsDelivered]

    renderAdminPage(res, '../pages/admin/orders', { ...pageOptions });

  } catch (error) {
    handleError(res, error, '../pages/admin/orders', pageOptions);
  }
};

export const getUsersPage = async (req, res) => {

  const pageOptions = {
    titulo: 'Gerenciar Usuários',
    users: [],
  };

  try {
    const resApi = await apiFetch('/public/users',
      { method: 'GET' }
    );
    const users = resApi.data;
    renderAdminPage(res, '../pages/admin/users', { ...pageOptions, users });
  } catch (error) {
    handleError(res, error, '../pages/admin/users', pageOptions);
  }
};

export const getEditUserPage = async (req, res) => {
  const { id } = req.params;

  const pageOptions = {
    titulo: 'Editar Usuário',
    user: null,
  };

  try {
    const resApi = await apiFetch(`/public/${id}`, { method: 'GET' });
    const user = resApi.data;
    renderAdminPage(res, '../pages/admin/editUser', { ...pageOptions, user });
  } catch (error) {
    handleError(res, error, '../pages/admin/editUser', pageOptions);
  }
  
};

