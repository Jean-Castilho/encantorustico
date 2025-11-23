import { ObjectId } from "mongodb";
import UserControllers from "./userControllers.js";
import ProductControllers from "./productControllers.js";
import OrdersControllers from "./orderControllers.js";

const userControllers = new UserControllers();
const productControllers = new ProductControllers();
const orderControllers = new OrdersControllers();

const renderPage = (res, page, options = {}) => {
  res.render(res.locals.layout, {
    page,
    ...options,
  });
};

export const getHome = async (req, res) => {
  const products = await productControllers
    .getCollection()
    .find()
    .limit(10)
    .toArray();

  renderPage(res, "../pages/public/home", {
    titulo: "Encanto Rústico",
    estilo: "home",
    mensagem: "Bem-vindo à nossa loja de móveis e decorações!",
    products: products,
  });
};

export const getContact = (req, res) => {
  renderPage(res, "../pages/public/contact", {
    titulo: "Contato",
    estilo: "contact",
    mensagem: "Entre em contato conosco!",
  });
};

export const getAbout = (req, res) => {
  renderPage(res, "../pages/public/about", {
    titulo: "Sobre Nós",
    estilo: "about",
    mensagem: "Saiba mais sobre nossa loja!",
  });
};

export const getProducts = async (req, res) => {
  const allProducts = await productControllers.getCollection().find().toArray();

  renderPage(res, "../pages/public/products", {
    titulo: "Produtos",
    estilo: "products",
    mensagem: "Confira nossos produtos!",
    products: allProducts,
  });
};

export const getRegister = (req, res) => {
  renderPage(res, "../pages/auth/register", {
    titulo: "Registrar Conta",
    estilo: "register",
    mensagem: "Crie sua conta para começar a comprar!",
  });
};

export const getLogin = (req, res) => {
  renderPage(res, "../pages/auth/login", {
    titulo: "Realizar Login",
    estilo: "login",
    mensagem: "seja Bem vindo de volta...",
  });
};

export const getProfile = (req, res) => {
  res.locals.layout = "./layout/auth";

  console.log("User Session:", req.session.user);

  if (!req.session.user) {
    return res.redirect("/login");
  }

  renderPage(res, "../pages/auth/profile", {
    titulo: "configuarçao",
    estilo: "peofile",
    mensagem: "sessao profile...",
  });
};


export const getResetPassword = (req, res) => {
  renderPage(res, "../pages/auth/changePassword", {
    titulo: "Alterar Senha",
    mensagem: "solicite o codigo para redefinir senha",
  });
};

export const postResetPassword = (req, res) => {
console.log(req);
}


export const getFavoritesPage = async (req, res) => {
  const pageOptions = {
    titulo: "Meus Favoritos",
    favorites: [],
  };

  if (!req.session.user) {
    return renderPage(res, "../pages/public/favorites", {
      ...pageOptions,
      mensagem: "Usuário não autenticado",
    });
  }

  const { favorites: favoritProducts } = req.session.user;

  if (!favoritProducts || favoritProducts.length === 0) {
    return renderPage(res, "../pages/public/favorites", {
      ...pageOptions,
      mensagem: "Você ainda não adicionou nenhum produto aos seus favoritos.",
    });
  }

  try {
    // Converte o array de strings de IDs para um array de ObjectIds
    const favoriteObjectIds = favoritProducts.map((id) => new ObjectId(id));
    const favoriteItems = await productControllers
      .getCollection()
      .find({ _id: { $in: favoriteObjectIds } })
      .toArray();

    console.log("Favorit Products IDs:", favoritProducts);
    //intere o id de favoritItems para o productIdnomais, substituido o _id:objet... para apenas
    console.log("Favorit Items:", favoriteItems);


    
    renderPage(res, "../pages/public/favorites", {
      ...pageOptions,
      favorites: favoriteItems,
      mensagem: "Seus produtos favoritos.",
    });
  } catch (error) {
    console.error("Erro ao buscar favoritos:", error);
    renderPage(res, "../pages/public/favorites", {
      ...pageOptions,
      mensagem: "Erro ao carregar seus favoritos. Tente novamente mais tarde.",
    });
  }
};

export const getCartPage = async (req, res) => {
  const pageOptions = {
    titulo: "Carrinho",
    cart: { items: [] },
    estilo: "cart",
    totalPrice: 0,
    totalItems: 0,
  };

  if (
    !req.session.user ||
    !req.session.user.cart ||
    req.session.user.cart.length === 0
  ) {
    return renderPage(res, "../pages/public/cart", {
      ...pageOptions,
      mensagem: "Seu carrinho está vazio.",
    });
  }

  const { cart: productIds } = req.session.user;

  try {
    // 1. Contar a quantidade de cada produto
    const quantityMap = productIds.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});

    const uniqueProductIds = Object.keys(quantityMap).map(
      (id) => new ObjectId(id)
    );

    // 2. Buscar os detalhes dos produtos únicos
    const productsDetails = await productControllers
      .getCollection()
      .find({ _id: { $in: uniqueProductIds } })
      .toArray();

    // 3. Combinar detalhes do produto com a quantidade
    const itemsWithQuantity = productsDetails.map((product) => ({
      ...product,
      quantity: quantityMap[product._id.toString()],
    }));

    // 4. Calcular o preço total e a quantidade total de itens
    const totalPrice = itemsWithQuantity.reduce(
      (acc, item) => acc + item.preco * item.quantity,
      0
    );
    const totalItems = productIds.length; // O total de itens é simplesmente o tamanho do array original

    renderPage(res, "../pages/public/cart", {
      ...pageOptions,
      cart: { items: itemsWithQuantity },
      totalPrice,
      totalItems,
      mensagem: "Seus produtos no carrinho.",
    });
  } catch (error) {
    console.error("Erro ao carregar o carrinho:", error);
    renderPage(res, "../pages/public/cart", {
      ...pageOptions,
      mensagem: "Erro ao carregar seu carrinho. Tente novamente mais tarde.",
    });
  }
};


export const getCheckout = async (req, res) => {
  const pageOptions = {
    titulo: "Checkout",
    cart: { items: [] },
    totalPrice: 0,
    totalItems: 0,
  };

  console.log(req.body);
  
  pageOptions.cart.items = req.body;

};










export const getOrders = async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  const pageOptions = {
    titulo: "Meus Pedidos",
    orders: [],
  };

  const objectIds = req.session.user.pedido;

  try {
    const orders = await orderControllers
      .getCollection()
      .find({ _id: objectIds });

    if (!orders || orders.length === 0) {
      return renderPage(res, "../pages/public/orders", {
        ...pageOptions,
        mensagem: "Você ainda não fez nenhum pedido.",
      });
    }

    pageOptions.orders = orders;

    if (!orders || orders.length === 0) {
      return renderPage(res, "../pages/public/orders", {
        ...pageOptions,
        mensagem: "Você ainda não fez nenhum pedido.",
      });
    }

    renderPage(res, "../pages/public/orders", {
      ...pageOptions,
      mensagem: "Seu histórico de pedidos.",
    });
  } catch (error) {
    const apiMessage =
      (error && error.data && (error.data.message || error.data.msg)) ||
      error.message ||
      "Erro ao carregar seu histórico de pedidos.";
    console.error("Erro ao buscar orders para usuário:", apiMessage, error);
    return renderPage(res, "../pages/public/orders", {
      ...pageOptions,
      mensagem: apiMessage,
    });
  }
};
