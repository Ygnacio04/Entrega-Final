const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

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
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Gestión de Albaranes",
      version: "1.0.0",
      description: "API para la gestión de albaranes entre clientes y proveedores"
    },
    servers: [
      {
        url: process.env.PUBLIC_URL || "http://localhost:3000"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  },
  apis: ["./routes/*.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
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
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

module.exports = app;