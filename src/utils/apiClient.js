const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3300';

/**
 * Realiza uma chamada fetch para a API central da aplicação.
 * Lida com a URL base, headers padrão e tratamento de erros.
 *
 * @param {string} path - O caminho do endpoint da API (ex: '/products/getProducts').
 * @param {object} options - Opções para a chamada fetch (method, body, headers, etc.).
 * @returns {Promise<any>} - A resposta JSON da API.
 * @throws {Error} - Lança um erro em caso de falha na requisição ou se a resposta não for OK.
 */
export async function apiFetch(path, options = {}) {
    const url = `${API_BASE_URL}${path}`;

    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);

        // Se a resposta não for bem-sucedida, tenta extrair uma mensagem de erro do corpo
        if (!response.ok) {
            // Tenta parsear o corpo do erro, mas se falhar, usa o statusText
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            const error = new Error(errorData.message || `Erro na API com status ${response.status}`);
            error.status = response.status;
            error.data = errorData;
            throw error;
        }

        // Lida com respostas sem conteúdo (ex: 204 No Content)
        if (response.status === 204) {
            return null;
        }

        // Para respostas bem-sucedidas, retorna o corpo como JSON
        return await response.json();

    } catch (error) {
        // Loga o erro no servidor para depuração
        console.error(`Erro na chamada à API: ${error.message}`, { path, url });
        // Relança o erro para que o controlador que chamou a função possa tratá-lo
        throw error;
    }
}