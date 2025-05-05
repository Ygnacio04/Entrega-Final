const { WebClient } = require('@slack/web-api');

// Verificar si las credenciales de Slack están configuradas
const isSlackConfigured = () => {
  return process.env.SLACK_TOKEN && process.env.SLACK_CHANNEL;
};

// Crear cliente de Slack si está configurado
let slack;
if (isSlackConfigured()) {
  slack = new WebClient(process.env.SLACK_TOKEN);
}

/**
 * Enviar notificación a Slack
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

    // Enviar el mensaje al canal configurado
    await slack.chat.postMessage({
      channel: process.env.SLACK_CHANNEL,
      text: formattedMessage,
      mrkdwn: true
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