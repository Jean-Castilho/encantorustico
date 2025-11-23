import { UnauthorizedError } from "../errors/customErrors.js";

export const checkUserRole = (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  
  let layout = './layout/main';
  if (req.session.user) {
    switch (req.session.user.role) {
      case 'admin':
        layout = './layout/admin';
        break;
      case 'delivery':
        layout = './layout/delivery';
        break;
    }
  }
  res.locals.layout = layout;
  next();
};


// Middleware para garantir que o usuário está autenticado
export const ensureAuthenticated = (req, res, next) => {
  if (!req.session.user || !req.session.user._id) {
    // Lança um erro de "Não Autorizado" que será tratado pelo errorHandler
    return next(new UnauthorizedError("Acesso não autorizado. Por favor, faça login."));
  }
  req.userId = req.session.user._id; // Anexa o ID do usuário à requisição
  console.log(req.userId)
  next();
};

export const ensureAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acesso negado. Somente administradores podem realizar esta ação.' });
  }
  next();
};