const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

app.use(cors());  
app.use(express.json()); 

mongoose
  .connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Conexión a la base de datos exitosa");
  })
  .catch((err) => {
    console.error("Error de conexión a la base de datos", err);
    process.exit(1);
  });

const authRoutes = require("./routes/auth");

app.use("/api/auth", authRoutes);

app.use("/test", express.static(path.join(__dirname, "test")));

app.get("/", (req, res) => {
  res.send("API en funcionamiento");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
