import pages from "./routes/pages.js";
import auth from "./routes/auth.js";
import products from "./routes/products.js"
import admin from "./routes/admin.js";


const Server = function (app) {

    app.use("/", pages);
    app.use("/auth", auth);
    app.use("/products", products);
    app.use("/admin", admin);

}

export default Server;
