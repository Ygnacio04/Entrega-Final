const { sendSlackNotification } = require("../utils/handleSlackNotification");
const { handleHttpError } = require("../utils/handleHttpError");

const errorHandler = (err, req, res, next) => {
  console.error("Error global:", err);
  
  // Determinar tipo de error
  const statusCode = err.statusCode || 500;
  const message = err.message || "Error interno del servidor";
  
  // Enviar notificación a Slack solo para errores de servidor (5XX)
  if (statusCode >= 500) {
    const method = req.method || 'UNKNOWN';
    const url = req.originalUrl || req.url || 'UNKNOWN';
    
    const slackMessage = `Error ${statusCode} en ${method} ${url}: ${message}`;
    sendSlackNotification(slackMessage, err);
  }
  
  // Responder al cliente
  handleHttpError(res, message, statusCode);
};

module.exports = errorHandler;