import { apiFetch } from '../utils/apiClient.js';

// Helper Functions

/**
 * Handles a successful authentication by setting the session and redirecting.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Object} data - The data received from the API, including user and cookie info.
 */
const handleAuthSuccess = (req, res, data) => {
  req.session.user = data.user;
  if (data.setCookieHeader) {
    res.setHeader('Set-Cookie', data.setCookieHeader);
  }
  res.redirect('/');
};

/**
 * Handles an authentication error by rendering the appropriate page with an error message.
 * @param {Object} res - The Express response object.
 * @param {Error} error - The error object.
 * @param {String} page - The page to render (e.g., '../pages/public/login').
 * @param {String} titulo - The title of the page.
 * @param {String} defaultErrorMessage - A default error message to use if the API doesn't provide one.
 */
const handleAuthError = (res, error, page, titulo, defaultErrorMessage) => {
  res.status(error.status || 500).render('layout/main', {
    page,
    titulo,
    error: error.message || defaultErrorMessage,
  });
};

// Authentication Controllers

export async function login(req, res) {
  const { email, password } = req.body;
  try {
    const { data } = await apiFetch('/public/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    handleAuthSuccess(req, res, data);

  } catch (error) {
    handleAuthError(
      res,
      error,
      '../pages/public/login',
      'Login - Encanto Rústico',
      'Ocorreu um erro no servidor. Tente novamente mais tarde.'
    );
  }
}

export async function register(req, res) {
  const { name, number, email, password } = req.body;
  try {
    const { data } = await apiFetch('/public/createUser', {
      method: 'POST',
      body: JSON.stringify({ name, number, email, password }),
    });

    req.session.user = data.user;

    const otpResponse = await apiFetch('/email/sendOtp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    console.log(`OTP sent response: ${otpResponse}`);
    
    res.render('layout/main', { 
      page: '../pages/public/otpCode', 
      titulo: 'Verificação de Código',
      mensagem: 'Um código OTP foi enviado para o seu e-mail.',
      email 
    });

  } catch (error) {
    handleAuthError(
      res,
      error,
      '../pages/public/register',
      'Registrar - Encanto Rústico',
      'Não foi possível criar a conta. Verifique os dados.'
    );
  }
}

export function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erro ao destruir a sessão:", err);
      // Fallback to redirect even if session destruction has issues
      return res.status(500).redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
}