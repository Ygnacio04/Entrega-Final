const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true para puerto 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  logger: true, // Activar logging
  debug: true // incluir depuración
});

// Añadir verificación de conexión
transporter.verify(function(error, success) {
  if (error) {
    console.log("Error en la verificación del transportador de correo:", error);
  } else {
    console.log("Servidor listo para enviar correos electrónicos");
  }
});

/**
 * Enviar correo de verificación
 * @param {String} email - Correo del destinatario
 * @param {String} code - Código de verificación
 */
const sendVerificationEmail = async (email, code) => {
  try {
    // Configuración del correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verificación de Correo Electrónico',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="background-color: #4CAF50; color: white; padding: 10px; text-align: center; border-radius: 5px 5px 0 0;">
            <h2>Verificación de Correo Electrónico</h2>
          </div>
          <div style="padding: 20px;">
            <p>Hola,</p>
            <p>Gracias por registrarte en nuestro sistema de gestión de albaranes. Para verificar tu correo electrónico, por favor utiliza el siguiente código:</p>
            
            <div style="font-size: 24px; font-weight: bold; text-align: center; padding: 10px; background-color: #f5f5f5; border-radius: 5px; margin: 20px 0;">
              ${code}
            </div>
            
            <p>Este código es válido por 24 horas. Si no has solicitado este código, por favor ignora este correo.</p>
            
            <p>Saludos,<br>El equipo de Gestión de Albaranes</p>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
          </div>
        </div>
      `
    };
    
    // Enviar el correo
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error al enviar correo de verificación:', error);
    throw error;
  }
};

/**
 * Enviar correo de recuperación de contraseña
 * @param {String} email - Correo del destinatario
 * @param {String} code - Código de recuperación
 */
const sendPasswordResetEmail = async (email, code) => {
  try {
    // Configuración del correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recuperación de Contraseña',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="background-color: #2196F3; color: white; padding: 10px; text-align: center; border-radius: 5px 5px 0 0;">
            <h2>Recuperación de Contraseña</h2>
          </div>
          <div style="padding: 20px;">
            <p>Hola,</p>
            <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código para completar el proceso:</p>
            
            <div style="font-size: 24px; font-weight: bold; text-align: center; padding: 10px; background-color: #f5f5f5; border-radius: 5px; margin: 20px 0;">
              ${code}
            </div>
            
            <p>Este código es válido por 1 hora. Si no has solicitado este código, por favor ignora este correo o contacta con nuestro equipo de soporte.</p>
            
            <p>Saludos,<br>El equipo de Gestión de Albaranes</p>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
          </div>
        </div>
      `
    };
    
    // Enviar el correo
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error al enviar correo de recuperación de contraseña:', error);
    throw error;
  }
};

/**
 * Enviar correo de invitación
 * @param {String} email - Correo del destinatario
 * @param {String} inviterName - Nombre del invitador
 * @param {String} companyName - Nombre de la compañía
 */
const sendInvitationEmail = async (email, inviterName, companyName) => {
  try {
    // Configuración del correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Invitación a Empresa',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="background-color: #673AB7; color: white; padding: 10px; text-align: center; border-radius: 5px 5px 0 0;">
            <h2>Invitación a Empresa</h2>
          </div>
          <div style="padding: 20px;">
            <p>Hola,</p>
            <p><strong>${inviterName}</strong> te ha invitado a unirte a la empresa <span style="font-weight: bold;">${companyName}</span> en nuestro sistema de gestión de albaranes.</p>
            
            <p>Inicia sesión en tu cuenta para ver y gestionar esta invitación. Si aún no tienes una cuenta, regístrate con este correo electrónico para ver la invitación.</p>
            
            <p>Saludos,<br>El equipo de Gestión de Albaranes</p>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
          </div>
        </div>
      `
    };
    
    // Enviar el correo
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error al enviar correo de invitación:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendInvitationEmail
};