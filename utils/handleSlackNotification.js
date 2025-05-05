const axios = require("axios");

/**
 * Verificar si la configuración de Slack está establecida
 * @returns {Boolean} Verdadero si está configurado
 */
const isSlackConfigured = () => {
  return process.env.SLACK_WEBHOOK && process.env.SLACK_WEBHOOK.startsWith('https://hooks.slack.com/');
};

/**
 * Enviar notificación a Slack usando webhook
 * @param {String} message - Mensaje a enviar
 * @param {Object} error - Objeto de error opcional
 */
const sendSlackNotification = async (message, error = null) => {
  if (!isSlackConfigured()) {
    console.warn('Slack no está configurado. No se enviará la notificación.');
    return;
  }

  try {
    // Formatear el mensaje con detalles del error si existe
    let formattedMessage = message;

    if (error) {
      formattedMessage += `\n\`\`\`\n${error.stack || error.message || JSON.stringify(error)}\n\`\`\``;
    }

    // Enviar el mensaje al webhook configurado
    await axios.post(process.env.SLACK_WEBHOOK, {
      text: formattedMessage
    });

    console.log('Notificación enviada a Slack exitosamente.');
  } catch (slackError) {
    console.error('Error al enviar notificación a Slack:', slackError);
  }
};

/**
 * Middleware para capturar errores 5XX y enviarlos a Slack
 */
const slackErrorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Solo enviar a Slack los errores de tipo 5XX
  if (statusCode >= 500) {
    const method = req.method || 'UNKNOWN';
    const url = req.originalUrl || req.url || 'UNKNOWN';
    const message = `Error 5XX en ${method} ${url}: ${err.message || 'Error interno del servidor'}`;
    
    sendSlackNotification(message, err);
  }

  // Continuar con el siguiente middleware
  next(err);
};

module.exports = {
  sendSlackNotification,
  slackErrorMiddleware
};