
import ProductControllers from "..controllers/productControllers.js";

const productControllers = new ProductControllers();


export const validateOrderItems = async (items) => {
  const productIds = items.map(item => item.productId);

  const productsSelec = await productControllers.getCollection().find({ _id: { $in: productIds } }).toArray();

  console.log('productsSelec', productsSelec);

  if (!productsSelec) {
    throw new Error('Não foi possível validar os produtos do carrinho via API.');
  };

  const foundIds = productsSelec.data.map(p => p._id.toString());
  const notFound = productIds.filter(id => !foundIds.includes(id));

  console.log('foundIds', foundIds);
  console.log('notFound', notFound);

  if (notFound.length > 0) {
    throw new Error(`Os seguintes produtos não foram encontrados: ${notFound.join(', ')}`);
  };
  return productsSelec;
};
