const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const swaggerUI = require("swagger-ui-express");

dotenv.config();

const app = express();

app.use(cors());  
app.use(express.json()); 

// Conexión a MongoDB
mongoose
  .connect(process.env.DB_URI)
  .then(() => {
    console.log("Conexión a la base de datos exitosa");
  })
  .catch((err) => {
    console.error("Error de conexión a la base de datos", err);
    process.exit(1);
  })

// Configuración de Swagger
const swaggerDocs = require('./swagger');
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Rutas de la API
const authRoutes = require("./routes/auth");
const clientRoutes = require("./routes/clients");
const projectRoutes = require("./routes/projects");
const deliveryNoteRoutes = require("./routes/deliverynotes");

app.use("/api/user", authRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/deliverynote", deliveryNoteRoutes);

// Directorio estático para pruebas
app.use("/test", express.static(path.join(__dirname, "test")));

// Ruta raíz
app.get("/", (req, res) => {
  res.send("API de gestión de albaranes en funcionamiento");
});

// Middleware para manejo de errores 404
app.use((req, res, next) => {
  res.status(404).send({
    error: "Not Found",
    message: `La ruta ${req.originalUrl} no existe en esta API`
  });
});

// Puerto del servidor
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

module.exports = {app,server};