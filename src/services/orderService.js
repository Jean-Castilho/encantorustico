import { apiFetch } from '../utils/apiClient.js';

export const validateOrderItems = async (items) => {
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

export const buildOrderItems = (items, validatedProducts) => {
  return items.map(item => {
    const productDetails = validatedProducts.find(p => p._id.toString() === item.productId);

    return {
      productId: item.productId,
      quantity: parseInt(item.quantity, 10),
      imagens: productDetails.imagens || [],
      valor: productDetails.preco || null,
      name: productDetails.nome || null,
      sku: productDetails.sku || null,
    };
  });
};
