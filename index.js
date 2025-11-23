import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// Importa os middlewares CSRF
import { generateCsrfToken } from './src/middleware/csrfMiddleware.js';
import handleErrors from './src/middleware/errorHandler.js'


const app = express();
const port = process.env.PORT || 3080;

const isProduction = process.env.NODE_ENV === 'production';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do mecanismo de visualização
app.use(cors({origin: `http://localhost:${port}`}));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Views'));
app.use(express.urlencoded({ extended: true }));
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

// Middleware para gerar e expor o token CSRF para os templates
app.use(generateCsrfToken);

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

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        console.error("JSON inválido recebido:", err.message);
        return res
            .status(400)
            .json({ success: false, message: "JSON inválido na requisição" });
    }
    return next(err);
});


//sobrecarga de responsabilidade no index.js
import Server from "./src/server.js"
import { connectDataBase, closeDataBase } from './src/config/db.js';

// Configuração das rotas da aplicação
Server(app);

// Função para iniciar o servidor de forma controlada
const start = async () => {
    try {
        // 1. Conecta ao banco de dados ANTES de iniciar o servidor
        await connectDataBase();

        // 2. Inicia o servidor Express para ouvir por requisições
        app.listen(port, () => {
            console.log(`Servidor rodando: http://localhost:${port}`);
        });
    } catch (error) {
        console.error(
            "Falha ao iniciar a aplicação. O servidor não será iniciado.",
            error,
        );
        process.exit(1);
    }
};

// Middleware de tratamento de erros (deve ser o último middleware a ser usado)
app.use(handleErrors)

process.on("SIGINT", async () => {
    console.log("Recebido sinal de encerramento. Fechando conexões...");
    await closeDataBase();
    process.exit(0);
});


// Inicia a aplicação
start();