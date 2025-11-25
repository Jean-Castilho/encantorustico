import { ObjectId } from "mongodb";
import { getDataBase } from "../config/db.js";
import { GeneralError } from "../errors/customErrors.js";
import { getGridFSBucket } from "../config/db.js";
import { Readable } from "stream";

export default class ProductController {

  
  getCollection() {
    const db = getDataBase();
    return db.collection("products");
  }

  async allProducts() {
    return await this.getCollection().find({}).toArray();
  }

  /**
   * Tries to upload a file to GridFS with a retry mechanism.
   * @param {object} file - The file object from multer (with buffer).
   * @param {GridFSBucket} bucket - The GridFS bucket instance.
   * @param {number} retries - The number of times to retry on failure.
   * @returns {Promise<string>} A promise that resolves with the unique filename.
   */

  
  async #uploadFileWithRetry(file, bucket, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await new Promise((resolve, reject) => {
          const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const readableStream = new Readable();
          readableStream.push(file.buffer);
          readableStream.push(null);

          const uploadStream = bucket.openUploadStream(uniqueName, {
            contentType: file.mimetype,
            metadata: { originalname: file.originalname },
          });

          readableStream.pipe(uploadStream)
            .on('finish', () => resolve(uniqueName))
            .on('error', (err) => reject(err));
        });
      } catch (error) {
        //console.error(`Upload attempt ${i + 1} para ${file.originalname} failed. Seguinte...`);
        if (i === retries - 1) throw error; // Rethrow error on last attempt
      }
    }
  }
  async uploadProductAndImage(req) {

    const files = req.files || [];

    if (!files || files.length === 0) {
      throw new GeneralError("Nenhum arquivo enviado.", 400);
    }

    const bucket = getGridFSBucket();

    // Use a função com retry para cada arquivo
    const uploadPromises = files.map(file => this.#uploadFileWithRetry(file, bucket));

    // Promise.allSettled espera todas as promises terminarem (sucesso ou falha)
    const results = await Promise.allSettled(uploadPromises);

    const successfulUploads = [];
    const failedUploads = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulUploads.push(result.value);
      } else {
        failedUploads.push(files[index].originalname);
      }
    });

    // Se qualquer upload falhar, não crie o produto e retorne um erro.
    if (failedUploads.length > 0) {
      throw new GeneralError(`Falha no upload dos seguintes arquivos: ${failedUploads.join(', ')}`, 500);
    }

    const productData = {
      // --- Informações Principais ---
      nome: req.body.nome, // Ex: "Poltrona Costela com Puff".
      slug: req.body.slug, // Ex: "poltrona-costela-com-puff-couro-preto".
      preco: parseFloat(req.body.preco), // Ex: 1890.00
      imagens: successfulUploads, // Usa apenas os nomes dos arquivos que tiveram sucesso
      // --- Organização e Estilo ---
      estilo: req.body.estilo, // Ex: "Moderno", "Industrial", "Clássico".
      colecao: req.body.colecao, // Ex: "Coleção Viena 2024".
      // --- Variações de Produto ---
      // Cada objeto aqui é uma versão do produto que o cliente pode comprar.
      //ambientes: req.body.ambientes, // Array. Ex: ["Sala de Estar", "Quarto", "Escritório"].
      /*variacoes: [
       Exemplo de um array que viria do req.body.variacoes.
      {
        sku: "POL-COS-01-PRE",
        cor: "Preto",
        acabamento: "Couro Ecológico",
        preco: 1890.00,
        precoPromocional: 1699.00,
        estoque: 15,
        imagens: ["url_imagem_preta_1.jpg", "url_imagem_preta_2.jpg"] // Imagens específicas da variação
      },
      {
        sku: "POL-COS-01-MAR",
        cor: "Marrom",
        acabamento: "Linho",
        preco: 1950.00,
        estoque: 8,
        imagens: ["url_imagem_marrom_1.jpg"]
      }]
      // boolean: true ou false requerMontagem: req.body.requerMontagem, 
      */

      // --- Logística e Garantia ---
      estoque: req.body.estoque, // Ex: 15 (número inteiro).
      garantia: req.body.garantia, // Ex: "12 meses"
      ativo: req.body.ativo, // Ex: "disponivel na loja"

      categoria: req.body.categoria,
      descricao: req.body.descricao,
      dimensoes: {
        altura: req.body.altura,
        largura: req.body.largura,
        profundidade: req.body.profundidade,
      },
      peso: req.body.peso,
    };

    const result = await this.getCollection().insertOne(productData);

    // retorna o documento criado já com imagens convertidas (via getProductById)
    const created = await this.getProductById(result.insertedId.toString());

    console.log(created);

    return created;
  }

  async getProductById(id) {
    if (!ObjectId.isValid(id)) {
      throw new Error("ID inválido");
    }
    const objectId = new ObjectId(id);
    const product = await this.getCollection().findOne({ _id: objectId });
    if (!product) {
      return null;
    }

    return product;
  }

  async updateProduct(req) {
    const { id } = req.params;
    console.log(id)
    const { body, files } = req;

    if (!ObjectId.isValid(id)) {
      const err = new Error("ID de produto inválido.");
      err.statusCode = 400;
      throw err;
    }

    const bucket = getGridFSBucket();
    const existingProduct = await this.getProductById(id);

    if (!existingProduct) {
      const err = new Error("Produto não encontrado.");
      err.statusCode = 404;
      throw err;
    }

    // Gerenciar imagens novas
    let newImages = [];
    if (files && files.length > 0) {
      const uploadPromises = files.map(file => this.#uploadFileWithRetry(file, bucket));
      const results = await Promise.allSettled(uploadPromises);
      newImages = results
        .filter(res => res.status === 'fulfilled')
        .map(res => res.value);
    }

    // Gerenciar imagens existentes
    const keptImages = body.existingImages ? (Array.isArray(body.existingImages) ? body.existingImages : [body.existingImages]) : [];
    
    // Combinar imagens
    const finalImages = [...keptImages, ...newImages];

    const productData = {
      nome: body.nome,
      slug: body.slug,
      preco: parseFloat(body.preco),
      imagens: finalImages,
      estilo: body.estilo,
      colecao: body.colecao,
      estoque: body.estoque,
      garantia: body.garantia,
      ativo: body.ativo,
      categoria: body.categoria,
      descricao: body.descricao,
      dimensoes: {
        altura: body.altura,
        largura: body.largura,
        profundidade: body.profundidade,
      },
      peso: body.peso,
    };

    await this.getCollection().updateOne(
      { _id: new ObjectId(id) },
      { $set: productData }
    );

    return await this.getProductById(id);
  }

  async deleteProduct(id) {
    if (!ObjectId.isValid(id)) {
      throw new Error("ID de produto inválido.");
    }

    const objectId = new ObjectId(id);
    const bucket = getGridFSBucket();

    // 1. Encontrar o produto para obter a lista de imagens
    const product = await this.getCollection().findOne({ _id: objectId });

    if (!product) {
      throw new Error("Produto não encontrado.");
    }

    // 2. Se o produto tiver imagens, deletá-las do GridFS
    if (product.imagens && product.imagens.length > 0) {
      const db = getDataBase();
      const filesCollection = db.collection('fs.files');

      // Mapeia nomes de arquivos para promises de busca e exclusão
      const deletePromises = product.imagens.map(async (filename) => {
        try {
          // Encontra o arquivo no GridFS pelo nome
          const imageFile = await filesCollection.findOne({ filename: filename });
          if (imageFile) {
            // Deleta o arquivo usando o _id do GridFS
            await bucket.delete(imageFile._id);
            console.log(`Imagem ${filename} deletada com sucesso.`);
          } else {
            console.warn(`Aviso: Imagem ${filename} não encontrada no GridFS.`);
          }
        } catch (error) {
          // Loga o erro mas não para o processo para que outras imagens possam ser deletadas
          console.error(`Erro ao deletar a imagem ${filename}:`, error);
        }
      });

      // Espera todas as operações de exclusão de imagem terminarem
      await Promise.all(deletePromises);
    }

    // 3. Após deletar as imagens, deletar o documento do produto
    const result = await this.getCollection().deleteOne({ _id: objectId });
    if (result.deletedCount === 0) {
      throw new Error("Não foi possível deletar o produto.");
    }

    return result;
  }


}
