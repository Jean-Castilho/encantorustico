import { ObjectId } from "mongodb";
import { getDataBase } from "../config/db.js";

export default class OrderControllers {
  getCollection() {
    const db = getDataBase();
    return db.collection("orders");
  };

  async getOrdersByUserId(userId) {
    if (!ObjectId.isValid(userId)) {
      throw new Error("ID de usuário inválido");
    }

    const objectId = new ObjectId(userId);
    const orders = await this.getCollection().find({ userId: objectId }).toArray();
    return orders;
  }

  async creatOrder(req, res) { 
  
    console.log(req.body);

    return req.body

  };

}