const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

/**
 * Crear un transporter de nodemailer configurado con OAuth2
 * @returns {Promise<nodemailer.Transporter>} Transporter configurado
 */
const createTransporter = async () => {
  try {
    // Verificar que todas las variables de entorno necesarias estén definidas
    const requiredEnvVars = [
      'CLIENT_ID',
      'CLIENT_SECRET',
      'REDIRECT_URI',
      'REFRESH_TOKEN',
      'EMAIL'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error(`Faltan variables de entorno para OAuth2: ${missingVars.join(', ')}`);
      // Fallback a transporter básico si faltan variables
      return createBasicTransporter();
    }
    
    // Crear cliente OAuth2
    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    
    // Configurar refresh token
    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN
    });
    
    // Obtener access token
    const accessToken = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          console.error("Error al obtener el access token:", err);
          reject(err);
        }
        resolve(token);
      });
    });
    
    // Crear transporter con OAuth2
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL,
        accessToken,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN
      }
    });
    
    // Verificar que el transporter funciona
    await transporter.verify();
    console.log("Transporter OAuth2 configurado correctamente");
    
    return transporter;
    
  } catch (error) {
    console.error("Error al crear transporter OAuth2:", error);
    // Fallback a transporter básico
    return createBasicTransporter();
  }
};

/**
 * Crear un transporter básico como fallback
 * @returns {nodemailer.Transporter} Transporter básico
 */
const createBasicTransporter = () => {
  console.log("Usando transporter básico como fallback");
  
  // Verificar si hay credenciales básicas disponibles
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error("No hay credenciales disponibles para enviar emails");
    throw new Error("Credenciales de email no configuradas");
  }
  
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Enviar un email
 * @param {Object} emailOptions Opciones del email (to, subject, text, html, etc.)
 * @returns {Promise<Object>} Resultado del envío
 */
const sendEmail = async (emailOptions) => {
  try {
    // Validar opciones mínimas necesarias
    if (!emailOptions.to || !emailOptions.subject) {
      throw new Error("Faltan opciones necesarias para enviar email (to, subject)");
    }
    
    // Asegurarse de que haya un remitente
    if (!emailOptions.from) {
      emailOptions.from = process.env.EMAIL || process.env.EMAIL_USER;
    }
    
    // Crear transporter
    const emailTransporter = await createTransporter();
    
    // Enviar email
    const info = await emailTransporter.sendMail(emailOptions);
    console.log(`Email enviado a ${emailOptions.to}: ${info.messageId}`);
    
    return info;
  } catch (error) {
    console.error("Error al enviar email:", error);
    throw error;
  }
};

/**
 * Enviar un email con código de verificación
 * @param {string} to Destinatario del email
 * @param {string} code Código de verificación
 * @returns {Promise<Object>} Resultado del envío
 */
const sendVerificationEmail = async (to, code) => {
  const emailOptions = {
    subject: "Código de verificación para tu cuenta",
    to,
    text: `Tu código de verificación es: ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4A90E2;">Verificación de cuenta</h2>
        <p>Gracias por registrarte. Para completar tu registro, introduce el siguiente código:</p>
        <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
          ${code}
        </div>
        <p>Este código expirará en 30 minutos.</p>
        <p>Si no has solicitado esta verificación, puedes ignorar este mensaje.</p>
      </div>
    `
  };
  
  return sendEmail(emailOptions);
};

/**
 * Enviar un email para recuperación de contraseña
 * @param {string} to Destinatario del email
 * @param {string} token Token de recuperación
 * @returns {Promise<Object>} Resultado del envío
 */
const sendPasswordResetEmail = async (to, token) => {
  const publicUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
  
  const emailOptions = {
    subject: "Recuperación de contraseña",
    to,
    text: `Tu código de recuperación de contraseña es: ${token}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4A90E2;">Recuperación de contraseña</h2>
        <p>Has solicitado recuperar tu contraseña. Utiliza el siguiente código:</p>
        <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
          ${token}
        </div>
        <p>Este código expirará en 1 hora.</p>
        <p>Si no has solicitado esta recuperación, puedes ignorar este mensaje.</p>
      </div>
    `
  };
  
  return sendEmail(emailOptions);
};

/**
 * Enviar un email de invitación a la compañía
 * @param {string} to Destinatario del email
 * @param {string} inviterName Nombre de quien invita
 * @param {string} companyName Nombre de la compañía
 * @returns {Promise<Object>} Resultado del envío
 */
const sendInvitationEmail = async (to, inviterName, companyName) => {
  const publicUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
  
  const emailOptions = {
    subject: `Invitación para unirte a ${companyName}`,
    to,
    text: `${inviterName} te ha invitado a unirte a ${companyName} en la plataforma de gestión de albaranes. Inicia sesión en tu cuenta para aceptar o rechazar la invitación.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4A90E2;">Invitación a ${companyName}</h2>
        <p>${inviterName} te ha invitado a unirte a <strong>${companyName}</strong> en la plataforma de gestión de albaranes.</p>
        <p>Inicia sesión en tu cuenta para aceptar o rechazar esta invitación.</p>
        <div style="margin: 20px 0;">
          <a href="${publicUrl}" style="background-color: #4A90E2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Ir a la plataforma
          </a>
        </div>
        <p>Si no tienes una cuenta, regístrate primero con esta dirección de email.</p>
      </div>
    `
  };
  
  return sendEmail(emailOptions);
};

module.exports = { 
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendInvitationEmail
};