/**
 * Formata um número como moeda local.
 * @param {number|string} value
 * @param {string} [locale='pt-BR']
 * @param {string} [currency='BRL']
 * @returns {string}
 */
export const formatCurrency = (value, locale = 'pt-BR', currency = 'BRL') => {
	const num = Number(value);
	if (Number.isNaN(num)) return formatCurrency(0, locale, currency);
	return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(num);
};


/**
 * Formata uma data ISO para uma string legível.
 * @param {string|Date} isoString
 * @param {string} [locale='pt-BR']
 * @param {object} [options]
 * @returns {string}
 */
export const formatDate = (isoString, locale = 'pt-BR', options = {}) => {
	if (!isoString) return '';
	try {
		const d = (isoString instanceof Date) ? isoString : new Date(isoString);
		if (Number.isNaN(d.getTime())) return String(isoString);
		return d.toLocaleDateString(locale, { dateStyle: 'short', ...options });
	} catch (e) {
		return String(isoString);
	}
};

export const formatTime = (isoString, locale = 'pt-BR', options = {}) => {
    if (!isoString) return '';
    try {
        const d = (isoString instanceof Date) ? isoString : new Date(isoString);
        if (Number.isNaN(d.getTime())) return String(isoString);
        return d.toLocaleTimeString(locale, { timeStyle: 'short', ...options });
    } catch (e) {
        return String(isoString);
    }
};


/**
 * Formata data e hora (utilitário quando for necessário mostrar hora também).
 */
export const formatDateTime = (isoString, locale = 'pt-BR', options = {}) => {
	if (!isoString) return '';
	try {
		const d = (isoString instanceof Date) ? isoString : new Date(isoString);
		if (Number.isNaN(d.getTime())) return String(isoString);
		return d.toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short', ...options });
	} catch (e) {
		return String(isoString);
	}
};


/**
 * Retorna uma label legível para status (ex: 'pagamento_aprovado' => 'Pagamento Aprovado')
 */
export const statusLabel = (status) => {
	if (!status && status !== 0) return '';
	return String(status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};


/**
 * Formata um número com casas decimais e separador local.
 */
export const formatNumber = (value, decimals = 2, locale = 'pt-BR') => {
	const num = Number(value);
	if (Number.isNaN(num)) return (0).toFixed(decimals);
	return num.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export default {
	formatCurrency,
	formatDate,
	formatDateTime,
	formatNumber,
	statusLabel,
};

