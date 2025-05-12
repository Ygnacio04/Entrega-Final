const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const swaggerUI = require("swagger-ui-express");
const errorHandler = require("./middleware/errorHandler");
const { sendVerificationEmail } = require("./utils/handleEmailSender");

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

// Prueba Slack
app.get("/test-slack-error", (req, res, next) => {
  try {
    // Forzar un error
    throw new Error("Test de notificación a Slack");
  } catch (err) {
    err.statusCode = 500;
    next(err); // Pasar el error al middleware de errores
  }
});

//Pruebas de correo electrónico
app.get("/test-email", async (req, res) => {
  try {
    // Enviar un correo de prueba a la dirección que especifiques
    const testEmail = "i810ag04@gmail.com"; // Cambia esto a tu email real para la prueba
    const testCode = "123456"; // Código de prueba
    
    const info = await sendVerificationEmail(testEmail, testCode);
    
    res.status(200).json({
      success: true,
      message: "Correo de prueba enviado correctamente",
      messageId: info.messageId
    });
  } catch (error) {
    console.error("Error al enviar correo de prueba:", error);
    res.status(500).json({
      success: false,
      message: "Error al enviar correo de prueba",
      error: error.message
    });
  }
});

app.use(errorHandler);

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