import { apiFetch } from '../utils/apiClient.js';
import { getCartDetails } from '../services/cartService.js';

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

    const { id } = req.params;

    try {
        const resApi = await apiFetch('/public/addFavoritos', {
            method: 'POST',
            body: JSON.stringify({ userId, id }),
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

    const { id } = req.params;

    try {
        const resApi = await apiFetch('/public/removeFavoritos', {
            method: 'POST',
            body: JSON.stringify({ userId, id }),
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

    const { id } = req.params;

    try {
        const resApi = await apiFetch('/public/addCarrinho', {
            method: 'POST',
            body: JSON.stringify({ userId, id }),
        });

        req.session.user.cart = resApi.data.updatedUser.cart;
        return res.json({ success: true, message: 'Produto adicionado ao carrinho!', cart: req.session.user.cart });

    } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error.message);
        return res.status(error.status || 500).json({ success: false, message: error.message || 'Erro interno do servidor' });
    }
}

export const removeCart = async (req, res) => {
    const userId = handleAuth(req, res);
    if (!userId) return;

    const { id } = req.params;
    try {
        const removeResApi = await apiFetch('/public/removeCarrinho', {
            method: 'POST',
            body: JSON.stringify({ userId, id }),
        });
        req.session.user.cart = removeResApi.data.cart;
        return res.json({ success: true, message: 'Produto removido do carrinho!' });

    } catch (error) {
        return res.status(error.status || 500).json({ success: false, message: error.message || 'Erro interno do servidor' });
    }
};

export const getProductByIdsCart = async (req, res) => {
   
    const userId = handleAuth(req, res);
    if (!userId) return;

    const { cart: cartProducts } = req.session.user;
    try {
        const { items, totalPrice, totalItems} = await getCartDetails(cartProducts);
        return res.json({
            success: true,
            cart: { items: items },
            totalPrice,
            totalItems,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Erro ao carregar seu carrinho. Tente novamente mais tarde.',
            cart: { items: [] },
            totalPrice: 0,
            totalItems: 0,
        });
    }
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, userType } = req.body;

    try {
        const resApi = await apiFetch(`/public/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name, email, userType }),
        });

        if (resApi.success) {
            res.json({ success: true, message: 'Usuário atualizado com sucesso!' });
        } else {
            res.status(resApi.status || 500).json({ success: false, message: resApi.message || 'Erro ao atualizar usuário.' });
        }
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error.message);
        res.status(error.status || 500).json({ success: false, message: error.message || 'Erro interno do servidor' });
    }
};
