# Documentação de Rotas

Este documento lista todas as rotas expostas pela API, variáveis necessárias (params, query, body), e exemplos de retorno padrão.

Formato de resposta padrão

- Sucesso (sendSuccess):
  {
    "success": true,
    "message": "Mensagem padrão ou personalizada",
    "data": <objeto ou array>
  }

- Erro genérico (sendError):
  {
    "success": false,
    "message": "Descrição do erro"
  }

- Não encontrado (sendNotFound):
  {
    "success": false,
    "message": "Recurso não encontrado"
  }

- Não autorizado (sendUnauthorized):
  {
    "success": false,
    "message": "Não autorizado"
  }


## Rotas - products (src/routes/products.js)

### POST /upload
- Descrição: Faz upload de imagens e cria um produto.
- Headers: Content-Type: multipart/form-data
- Body (form-data):
  - files: arquivos (array) - campo do tipo file. Ex: imagens do produto.
  - nome: string
  - slug: string
  - preco: number (ex: "1890.00")
  - ambientes: array (pode ser string JSON)
  - estilo: string
  - colecao: string
  - estoque: number
  - variacoes: array (opcional, JSON string)
  - requerMontagem: boolean
  - garantia: string
  - ativo: string
  - categoria: string
  - descricao: string
  - altura, largura, profundidade: number
  - peso: number
- Retorno 201 (sucesso):
  {
    "success": true,
    "message": "Arquivos enviados e produto criado com sucesso",
    "data": { product }
  }
- Erros: 500 com sendError

### GET /getProductById/:id
- Descrição: Retorna um produto por ID.
- Params:
  - id: string (ObjectId do MongoDB)
- Retorno 200 (sucesso): sendSuccess com objeto do produto em data
- Retorno 404 se não encontrado (sendNotFound)
- Erros: 500 com sendError

### GET /getProducts
- Descrição: Retorna todos os produtos
- Params: nenhum
- Retorno 200: sendSuccess com array de produtos
- Erros: 500 com sendError

### POST /delete
- Descrição: Deleta um produto por id (no body)
- Body (JSON):
  - id: string (ObjectId)
- Retorno 200: sendSuccess com message "Produto deletado" quando excluído
- Retorno 404: sendNotFound se nao encontrado
- Erros: 500


## Rotas - public (src/routes/public.js)

### GET /getUserById/:id
- Descrição: Busca usuário por ID
- Params:
  - id: string (ObjectId)
- Retorno 200: sendSuccess com user
- Retorno 404: sendNotFound
- Erros: 500

### GET /getUserByEmail/:email
- Descrição: Busca usuário por email
- Params:
  - email: string
- Retorno 200: sendSuccess com user
- Retorno 404: sendNotFound
- Erros: 500

### POST /createUser
- Descrição: Cria usuário e gera token. Define cookie "token".
- Body (JSON):
  - name: string
  - number: string
  - email: string
  - password: string
- Retorno 201: sendSuccess com { token, verifyUser, user }
- Erros: 500 com mensagem de erro

### POST /login
- Descrição: Login do usuário. Seta cookie "token".
- Body (JSON):
  - email: string
  - password: string
- Retorno 201: sendSuccess com { user, token }
- Retorno 401: sendUnauthorized com mensagem

### POST /ProductsFavorit
- Descrição: Busca produtos pelos ids favoritProducts enviados no body
- Body (JSON):
  - favoritProducts: array de ids (strings)
- Retorno 200: sendSuccess com array de produtos
- Retorno 404: sendNotFound se nenhum produto
- Erros: 500

### POST /addFavoritos
- Descrição: Adiciona produto aos favoritos do usuário
- Body (JSON):
  - userId: string
  - productId: string
- Retorno 200: sendSuccess com { updatedUser }
- Retorno 404: sendNotFound se usuário ou produto não encontrado
- Erros: 500

### POST /removeFavoritos
- Descrição: Remove produto dos favoritos
- Body (JSON):
  - userId: string
  - productId: string
- Retorno 200: sendSuccess com usuário atualizado
- Erros: 500

### POST /productsCart
- Descrição: Busca produtos do carrinho por ids
- Body (JSON):
  - cartProducts: array de ids
- Retorno 200: sendSuccess com array de produtos
- Retorno 404: sendNotFound se nenhum produto
- Erros: 500

### POST /addCarrinho
- Descrição: Adiciona produto ao carrinho do usuário
- Body (JSON):
  - userId: string
  - productId: string
- Retorno 200: sendSuccess com { updatedUser }
- Retorno 404: sendNotFound se usuário ou produto não encontrado
- Erros: 500

### POST /removeCarrinho
- Descrição: Remove produto do carrinho
- Body (JSON):
  - userId: string
  - productId: string
- Retorno 200: sendSuccess com usuário atualizado
- Erros: 500


## Rotas - whatzapp (src/routes/whatzapp.js)

### POST /send-code
- Descrição: Envia código para número via Whatzapp (controller)
- Body (JSON):
  - number: string (telefone)
- Retorno 200: JSON diretamente do controller (ex: { success: true, ... })
- Erros: 500

### POST /verify-code
- Descrição: Verifica código enviado
- Body (JSON):
  - number: string
  - code: string
- Retorno 200: JSON do controller (ex: { success: true, ... })
- Erros: 500

### POST /verifyNumber
- Descrição: Alternativa para verify: chama usersController.verifyNumber
- Body (JSON):
  - number: string
- Retorno 200: { success: true, message, response }
- Erros: 500

### POST /verifyCode
- Descrição: Alternativa para verify-code: chama usersController.verifyCode
- Body (JSON):
  - number: string
  - code: string
- Retorno 200: { ...otps, success: true, message }
- Retorno 400: quando código incorreto


## Rotas - privacy (src/routes/privacy.js)

### PUT /updateUser/:id
- Descrição: Atualiza usuário (parcial)
- Params:
  - id: string
- Body (JSON): objeto com campos a atualizar (ex: name, email, cart, favorites)
- Retorno 200: sendSuccess com message "User atualizado com sucesso"
- Retorno 404: sendNotFound se matchedCount === 0
- Erros: 500

### DELETE /deleteUser/:id
- Descrição: Deleta usuário por id
- Params: id
- Retorno 200: sendSuccess com message "Usuario deletado"
- Retorno 404: sendNotFound se deletedCount === 0
- Erros: 500

### PUT /updateProduct/:id
- Descrição: Atualiza produto por id
- Params: id
- Body: campos a atualizar do produto
- Retorno 200: sendSuccess com message "Produto atualizado com sucesso"
- Retorno 404: sendNotFound
- Erros: 500

### DELETE /deleteProduct/:id
- Descrição: Deleta produto por id
- Params: id
- Retorno 200: sendSuccess "Produto deletado com sucesso"
- Retorno 404: sendNotFound
- Erros: 500


## Observações
- IDs esperados são ObjectId do MongoDB em string. Rotas que recebem arrays podem esperar arrays de strings ou JSON-stringified arrays quando enviadas via form-data.
- Respostas seguem os utilitários em `src/services/responseService.js`.


---
Arquivo gerado automaticamente. Verifique negócio e exemplos específicos nos controllers se desejar mais precisão.