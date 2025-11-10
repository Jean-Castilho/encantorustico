// Ponto de entrada principal da aplicação
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3100;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

// Configuração do View Engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Views'));

// Middlewares para parsing de requisições
app.use(express.json()); // Para parsing de JSON
app.use(express.urlencoded({ extended: true })); // Para parsing de formulários

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração da sessão
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction, // Usar cookies seguros em produção
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 dia
  }
}));

// Middleware para expor dados globais aos templates
app.use((req, res, next) => {
  // Expõe a sessão e o usuário para todas as views
  res.locals.session = req.session;
  res.locals.user = req.session?.user || null;
  
  // Ajuda a identificar a rota ativa para a navegação
  res.locals.currentPath = req.path;
  res.locals.isActive = (pathPrefix) => req.path.startsWith(pathPrefix);

  // Garante que `products` seja sempre um array para evitar erros nos templates
  res.locals.products = res.locals.products || [];
  res.locals.allProducts = res.locals.allProducts || res.locals.products;

  next();
});

import loadRoutes from './src/index.js';

// Rotas da aplicação
loadRoutes(app);

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
