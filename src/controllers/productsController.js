import { apiFetch } from '../utils/apiClient.js';

export const postAddProduct = async (req, res) => {
    const { nome, slug, preco, ambientes, ativo, colecao, requerMontagem, garantia, categoria, disponibilidade, descricao, altura, largura, profundidade, peso } = req.body;
    const files = [].concat(req.files || req.file || []);
    const filenames = files.map(file => file.filename);

    try {
        await apiFetch('/products/upload', {
            method: 'POST',
            body: JSON.stringify({ 
                nome, slug, preco, files: filenames, ambientes, ativo, colecao, 
                requerMontagem, garantia, categoria, disponibilidade, descricao, 
                altura, largura, profundidade, peso 
            }),
        });

        res.redirect('/admin/inventory');
    } catch (error) {
        console.error('Erro ao adicionar produto:', error.message);
        // Idealmente, renderizar uma página de erro com uma mensagem amigável
        res.status(error.status || 500).send('Erro interno do servidor ao adicionar o produto.');
    }
};

export const deleteProduct = async (req, res) => {
    const { id: productId } = req.body;

    try {
        await apiFetch(`/products/delete`, {
            method: 'POST', // O método correto não seria DELETE?
            body: JSON.stringify({ id: productId }),
        });

        res.redirect('/admin/inventory');
    } catch (error) {
        console.error('Erro ao excluir produto:', error.message);
        res.status(error.status || 500).send('Erro ao excluir o produto.');
    }
};