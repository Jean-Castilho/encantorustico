import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { generateCsrfToken } from '../middleware/csrfMiddleware.js';

import ProductControllers from "../controllers/productControllers.js";
import { getGridFSBucket } from "../config/db.js";
import { handleResponse } from "../utils/handleResponse.js";

const uploadDir = path.resolve(process.cwd(), 'uploads');

fs.mkdirSync(uploadDir, { recursive: true });

const productControllers = new ProductControllers();
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get("/", async (req, res) => {
  handleResponse(res, productControllers.allProducts());
});

router.post("/", upload.array('imagens', 5), generateCsrfToken, async (req, res, next) => {
  try {
    const newProduct = await productControllers.uploadProductAndImage(req, res);
    res.status(201).json(newProduct);
  } catch (error) {
    next(error);
  }
});

// Rota para servir imagens do GridFS
router.get('/images/:filename', (req, res) => {
  const bucket = getGridFSBucket();
  const { filename } = req.params;

  const downloadStream = bucket.openDownloadStreamByName(filename);

  downloadStream.on('file', (file) => {
    // Define o cabeçalho de tipo de conteúdo para que o navegador saiba como renderizar o arquivo
    res.set('Content-Type', file.contentType);
  });

  downloadStream.on('error', (err) => {
    console.error(`Erro ao buscar o arquivo ${filename} do GridFS:`, err);
    return res.status(404).send('Imagem não encontrada.');
  });

  // 'pipe' envia o stream do arquivo diretamente para a resposta da requisição
  downloadStream.pipe(res);
});


export default router;
