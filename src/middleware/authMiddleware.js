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