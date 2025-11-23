import { ObjectId } from "mongodb";

import { getDataBase } from "../config/db.js";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../errors/customErrors.js";

import {
  validationUser,
  criarHashPass,
  criarToken,
  compararSenha,
} from "../services/validationData.js";

export default class UserControllers {
  getCollection() {
    const db = getDataBase();
    return db.collection("users");
  }

  async allUsers() {
    return await this.getCollection().find().toArray();
  }

  async creatUser(req, res) {
    const dataUser = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
    };

    dataUser.email = String(dataUser.email).trim().toLowerCase();
    dataUser.phone = String(dataUser.phone).trim();

    const validation = validationUser(dataUser);

    if (!validation.isValid) {
      // Lança um erro de validação com os detalhes dos campos inválidos
      throw new ValidationError(
        "Dados inválidos. Por favor, verifique os campos.",
        validation.errors,
      );
    }
    const userExists = await this.verifieldUser({
      email: dataUser.email,
      phone: dataUser.phone,
    });

    if (userExists) { // 409 Conflict
      throw new GeneralError("Usuário já existe.", 409);
    }
    dataUser.password = await criarHashPass(dataUser.password);

    const userCreated = {
      name: dataUser.name,
      password: dataUser.password,
      phone: { verified: false, number: dataUser.phone },
      email: { verified: false, endereco: dataUser.email },

      role: "user",
      isActive: true,

      createdAt: new Date(),
      updatedAt: new Date(),

      orderns: [],
      cart: [],
      favorites: [],
    };

    const newUser = await this.getCollection().insertOne(userCreated);

    const token = criarToken({
      _id: newUser.insertedId,
      email: userCreated.email.endereco,
    });

    req.session.user = newUser;

    return {
      mensagem: "Usuário criado com sucesso.",
      token: token,
      user: userCreated,
    };
  }

  async login(req, res) {
    const { email, password } = req.body;

    console.log(email,password)

    const user = await this.getUserByEmail(email);
    console.log(user);
    if (!user) { // 401 Unauthorized é mais apropriado para falha de login
      throw new UnauthorizedError("Email ou senha incorretos.");
    }
    const ismatch = await compararSenha(password, user.password);

    if (!ismatch) { // 401 Unauthorized
      throw new UnauthorizedError("Email ou senha incorretos.");
    }

    // Mantém o campo aninhado como "email.endereço"
    const token = criarToken({
      id: user._id,
      email: user.email,
    });

    req.session.user = user;

    return { mensagem: "Login realizado", user, token };
  }

  async verifieldUser({ email, phone } = {}) {
    const query = {};
    if (email) query["email"] = email;
    if (phone) query["phone"] = phone;
    if (Object.keys(query).length === 0) return null;

    return await this.getCollection().findOne(query);
  }

  async getUserByEmail(email) {
    if (!email) return null;
    const normalized = String(email).trim().toLowerCase();
    return await this.getCollection().findOne({ "email.endereco": normalized });
  }

  async getUserById(id) {
     if (!id) return null;

    return await this.getCollection().findOne({ _id: new ObjectId(id) });
  
  }

  async updateUser(id, updateData) {
    if (!ObjectId.isValid(id)) {
      throw new Error("ID de usuário inválido");
    }

    const objectId = new ObjectId(id);

    // Constrói o objeto de atualização dinamicamente
    const updateFields = {};
    if (updateData.name) {
      updateFields.name = updateData.name;
    }
    if (updateData.email) {
      // Atualiza apenas o endereço de e-mail, mantendo o status de verificação
      updateFields['email.endereco'] = updateData.email;
    }
    if (updateData.role) {
      // Adicione validação de role se necessário
      const allowedRoles = ['user', 'stockist', 'delivery', 'admin'];
      if (allowedRoles.includes(updateData.role)) {
        updateFields.role = updateData.role;
        
      } else {
        throw new Error("Tipo de usuário (role) inválido.");
      }
    }
    
    // Adiciona o campo updatedAt
    updateFields.updatedAt = new Date();

    if (Object.keys(updateFields).length === 0) {
      throw new Error("Nenhum dado para atualizar foi fornecido.");
    }

    const result = await this.getCollection().updateOne(
      { _id: objectId },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      throw new NotFoundError("Usuário não encontrado.");
    }

    return await this.getUserById(id);
  }

  async deleteUser(id) {
    if (!ObjectId.isValid(id)) {
      throw new Error("ID de usuário inválido");
    }
    const objectId = new ObjectId(id);
    const result = await this.getCollection().deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      throw new NotFoundError("Usuário não encontrado.");
    }
    return { message: "Usuário excluído com sucesso." };
  }
}
