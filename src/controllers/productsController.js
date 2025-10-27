import { apiFetch } from '../utils/apiClient.js';

export const postAddProduct = async (req, res) => {
    const { nome, slug, price, ambientes, ativo, colecao, requerMontagem, garantia, categoria, estoque, descricao, altura, largura, profundidade, peso } = req.body;
    const files = [].concat(req.files || req.file || []);
    const filenames = files.map(file => file.filename);

    try {

        await apiFetch('/products', {
            method: 'POST',
            body: JSON.stringify({ 
                nome, slug, price, files: filenames, ambientes, ativo, colecao, 
                requerMontagem, garantia, categoria, estoque, descricao, 
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
    const { id } = req.body;

    try {
        await apiFetch(`/products`, {
            method: 'DELETE', 
            body: JSON.stringify({ id }),
        });

        res.redirect('/admin/inventory');
    } catch (error) {
        console.error('Erro ao excluir produto:', error.message);
        res.status(error.status || 500).send('Erro ao excluir o produto.');
    }
};

export const postEditProduct = async (req, res) => {
    const { id } = req.params;
    const { nome, slug, preco, ambientes, ativo, colecao, requerMontagem, garantia, categoria, estoque, descricao, peso } = req.body;
    // dimensoes podem vir como campos aninhados: dimensoes[altura]
    const altura = req.body['dimensoes[altura]'] || req.body.altura;
    const largura = req.body['dimensoes[largura]'] || req.body.largura;
    const profundidade = req.body['dimensoes[profundidade]'] || req.body.profundidade;
    const existingImages = Array.isArray(req.body['existingImages[]']) ? req.body['existingImages[]'] : (req.body['existingImages[]'] ? [req.body['existingImages[]']] : []);
    const files = [].concat(req.files || req.file || []);
    const filenames = files.map(file => file.filename);

    try {
        await apiFetch(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ 
                id,
                nome,
                slug,
                preco,
                files: filenames,
                existingImages,
                ambientes,
                ativo,
                colecao,
                requerMontagem,
                garantia,
                categoria,
                estoque,
                descricao,
                dimensoes: { altura, largura, profundidade },
                peso
            }),
        });

        res.redirect('/admin/inventory');
    } catch (error) {
        console.error('Erro ao editar produto:', error.message);
        res.status(error.status || 500).send('Erro interno do servidor ao editar o produto.');
    }
};