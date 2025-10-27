import { apiFetch } from '../utils/apiClient.js';

export const getCartDetails = async (cartProducts) => {


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
