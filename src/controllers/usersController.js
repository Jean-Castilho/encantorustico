import { apiFetch } from '../utils/apiClient.js';

const handleAuth = (req, res) => {
    if (!req.session.user) {
        res.status(401).json({ success: false, message: 'Usuário não autenticado' });
        return null;
    }
    return req.session.user._id;
};

export const addFavorite = async (req, res) => {
    const userId = handleAuth(req, res);
    if (!userId) return;

    const { productId } = req.params;

    try {
        const resApi = await apiFetch('/public/addFavoritos', {
            method: 'POST',
            body: JSON.stringify({ userId, productId }),
        });

        req.session.user.favorites = resApi.data.updatedUser.favorites;
        return res.json({ success: true, message: 'Produto adicionado aos favoritos!', favorites: req.session.user.favorites });

    } catch (error) {
        console.error('Erro ao adicionar favorito:', error.message);
        return res.status(error.status || 500).json({ success: false, message: error.message || 'Erro interno do servidor' });
    }
};

export const removeFavorite = async (req, res) => {
    const userId = handleAuth(req, res);
    if (!userId) return;

    const { productId } = req.params;

    try {
        const resApi = await apiFetch('/public/removeFavoritos', {
            method: 'POST',
            body: JSON.stringify({ userId, productId }),
        });

        req.session.user.favorites = resApi.data.favorites;
        return res.json({ success: true, message: 'Produto removido dos favoritos!', favorites: req.session.user.favorites });

    } catch (error) {
        console.error('Erro ao remover favorito:', error.message);
        return res.status(error.status || 500).json({ success: false, message: error.message || 'Erro interno do servidor' });
    }
};

export const addCart = async (req, res) => {
    const userId = handleAuth(req, res);
    if (!userId) return;

    const { productId } = req.params;

    try {
        const resApi = await apiFetch('/public/addCarrinho', {
            method: 'POST',
            body: JSON.stringify({ userId, productId }),
        });

        req.session.user.cart = resApi.data.updatedUser.cart;
        return res.json({ success: true, message: 'Produto adicionado ao carrinho!', cart: req.session.user.cart });

    } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error.message);
        return res.status(error.status || 500).json({ success: false, message: error.message || 'Erro interno do servidor' });
    }
}

export const getProductByIdsCart = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    }

    const { cart: cartProducts } = req.session.user;

    if (!cartProducts || cartProducts.length === 0) {
        return res.json({
            success: true,
            cart: { items: [] },
            totalPrice: 0,
            totalItems: 0,
        });
    }

    try {
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

        return res.json({
            success: true,
            cart: { items: items },
            totalPrice,
            totalItems,
        });

    } catch (error) {
        console.error('Erro da API ao obter carrinho:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Erro ao carregar seu carrinho. Tente novamente mais tarde.',
            cart: { items: [] },
            totalPrice: 0,
            totalItems: 0,
        });
    }
};

export const removeCart = async (req, res) => {
    const userId = handleAuth(req, res);
    if (!userId) return;

    const { productId } = req.params;

    try {
        const removeResApi = await apiFetch('/public/removeCarrinho', {
            method: 'POST',
            body: JSON.stringify({ userId, productId }),
        });

        req.session.user.cart = removeResApi.data.cart;
        const updatedCartProducts = req.session.user.cart;

        if (!updatedCartProducts || updatedCartProducts.length === 0) {
            return res.json({ success: true, totalPrice: 0, totalItems: 0, message: 'Produto removido do carrinho!' });
        };

        const productQuantities = updatedCartProducts.reduce((acc, id) => {
            acc[id] = (acc[id] || 0) + 1;
            return acc;
        }, {});

        const detailsResApi = await apiFetch('/public/productsCart', {
            method: 'POST',
            body: JSON.stringify({ cartProducts: updatedCartProducts }),
        });

        const detailedProducts = detailsResApi.data || [];

        const items = detailedProducts.map(product => ({
            ...product,
            quantity: productQuantities[product._id.toString()] || 0
        }));
        
        const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.preco) || 0) * (parseInt(item.quantity, 10) || 0), 0);
        const totalItems = items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);

        return res.json({ success: true, totalPrice, totalItems, message: 'Produto removido do carrinho!' });

    } catch (error) {
        return res.status(error.status || 500).json({ success: false, message: error.message || 'Erro interno do servidor' });
    }
};
