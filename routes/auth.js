const express = require("express");
const { validatorRegister, validatorLogin, validatorValidateEmail, validatorSendInvitation, validatorInvitationId  } = require("../validators/auth");
const {uploadMiddlewareMemory} = require("../utils/handleStorage");
const authMiddleware = require("../middleware/session");

const router = express.Router();
const { 
    registerCtrl,
    loginCtrl,
    verifyEmailCtrl,
    updateUserCtrl,
    getUserFromTokenCtrl,
    deleteUserCtrl,
    forgotPasswordCtrl,
    resetPasswordCtrl,  
    uploadLogo,
    sendInvitationCtrl,
    getReceivedInvitationsCtrl,
    getSentInvitationsCtrl,
    acceptInvitationCtrl,
    rejectInvitationCtrl,
    cancelInvitationCtrl
} = require("../controllers/user");

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API para autenticación y gestión de usuarios
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: ID autogenerado del usuario
 *         firstName:
 *           type: string
 *           description: Nombre del usuario
 *         lastName:
 *           type: string
 *           description: Apellido del usuario
 *         email:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *         password:
 *           type: string
 *           format: password
 *           description: Contraseña del usuario
 *         role:
 *           type: string
 *           enum: [user, admin, guest]
 *           description: Rol del usuario
 *         validated:
 *           type: boolean
 *           description: Indica si el email ha sido validado
 *         company:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             cif:
 *               type: string
 *             address:
 *               type: object
 *               properties:
 *                 street:
 *                   type: string
 *                 number:
 *                   type: number
 *                 postal:
 *                   type: number
 *                 city:
 *                   type: string
 *             partners:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   role:
 *                     type: string
 *       example:
 *         firstName: Juan
 *         lastName: Pérez
 *         email: juan.perez@example.com
 *         password: Password123
 *         role: user
 *         company:
 *           name: Mi Empresa SL
 *           cif: B12345678
 *           address:
 *             street: Calle Principal
 *             number: 123
 *             postal: 28001
 *             city: Madrid
 *     
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *       example:
 *         email: juan.perez@example.com
 *         password: Password123
 *     
 *     VerifyEmailRequest:
 *       type: object
 *       required:
 *         - email
 *         - verificationCode
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         verificationCode:
 *           type: string
 *       example:
 *         email: juan.perez@example.com
 *         verificationCode: "123456"
 *     
 *     ForgotPasswordRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *       example:
 *         email: juan.perez@example.com
 *     
 *     ResetPasswordRequest:
 *       type: object
 *       required:
 *         - token
 *         - newPassword
 *       properties:
 *         token:
 *           type: string
 *         newPassword:
 *           type: string
 *           format: password
 *       example:
 *         token: "123456"
 *         newPassword: NewPassword456
 *     
 *     Invitation:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [user, admin]
 *       example:
 *         email: invitado@example.com
 *         role: user
 */


/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       409:
 *         description: El usuario ya existe
 *       500:
 *         description: Error del servidor
 */

router.post(
    "/register", 
    validatorRegister,
    registerCtrl
);

/**
 * @swagger
 * /api/user/verify-email:
 *   post:
 *     summary: Verificar email con código
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailRequest'
 *     responses:
 *       200:
 *         description: Email verificado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Código de verificación inválido
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */

router.post(
    "/verify-email", 
    validatorValidateEmail,
    verifyEmailCtrl
);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Credenciales inválidas
 *       403:
 *         description: Email no verificado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */

router.post(
    "/login", 
    validatorLogin,
    loginCtrl
);

/**
 * @swagger
 * /api/user/forgot-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Se ha enviado un correo con instrucciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */

router.post(
    "/forgot-password", 
    forgotPasswordCtrl
);

/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     summary: Restablecer contraseña
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Contraseña restablecida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Token inválido o expirado
 *       500:
 *         description: Error del servidor
 */

router.post(
    "/reset-password", 
    resetPasswordCtrl
);

// Rutas protegidas por autenticación
router.use(authMiddleware); // Aplicar middleware de autenticación a todas las rutas siguientes

/**
 * @swagger
 * /api/user/onboarding:
 *   put:
 *     summary: Actualizar datos del usuario (onboarding)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Datos actualizados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */

router.put(
    "/onboarding", 
    updateUserCtrl
);

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Obtener datos del usuario actual
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */

router.get(
    "/me", 
    getUserFromTokenCtrl
);

/**
 * @swagger
 * /api/user/logo:
 *   patch:
 *     summary: Actualizar logo del usuario
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Imagen del logo
 *     responses:
 *       200:
 *         description: Logo actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 profilePicture:
 *                   type: string
 *       400:
 *         description: No se proporcionó archivo
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */

router.patch(
    "/logo",
    uploadMiddlewareMemory.single("image"),
    uploadLogo
);

/**
 * @swagger
 * /api/user/delete:
 *   delete:
 *     summary: Eliminar usuario (soft/hard delete)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Si es 'false', realiza hard delete, de lo contrario soft delete
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */

router.delete(
    "/delete", 
    deleteUserCtrl
);

/**
 * @swagger
 * /api/user/invitations/send:
 *   post:
 *     summary: Enviar invitación a un usuario
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Invitation'
 *     responses:
 *       200:
 *         description: Invitación enviada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 invitedUser:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *       400:
 *         description: Necesitas una compañía para invitar
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: Invitación ya enviada o usuario ya en la compañía
 *       500:
 *         description: Error del servidor
 */
router.post(
    "/invitations/send",
    validatorSendInvitation,
    sendInvitationCtrl
);

/**
 * @swagger
 * /api/user/invitations/received:
 *   get:
 *     summary: Obtener invitaciones recibidas
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de invitaciones recibidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invitations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       inviterId:
 *                         type: object
 *                       inviterEmail:
 *                         type: string
 *                       companyId:
 *                         type: string
 *                       companyName:
 *                         type: string
 *                       status:
 *                         type: string
 *                       role:
 *                         type: string
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */

router.get(
    "/invitations/received",
    getReceivedInvitationsCtrl
);

/**
 * @swagger
 * /api/user/invitations/sent:
 *   get:
 *     summary: Obtener invitaciones enviadas
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de invitaciones enviadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invitations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       inviterId:
 *                         type: object
 *                       inviterEmail:
 *                         type: string
 *                       companyId:
 *                         type: string
 *                       companyName:
 *                         type: string
 *                       status:
 *                         type: string
 *                       role:
 *                         type: string
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */

router.get(
    "/invitations/sent",
    getSentInvitationsCtrl
);

/**
 * @swagger
 * /api/user/invitations/accept/{invitationId}:
 *   put:
 *     summary: Aceptar una invitación
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la invitación
 *     responses:
 *       200:
 *         description: Invitación aceptada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 company:
 *                   type: object
 *       404:
 *         description: Invitación o usuario no encontrado
 *       500:
 *         description: Error del servidor
 */

router.put(
    "/invitations/accept/:invitationId",
    validatorInvitationId,
    acceptInvitationCtrl
);

/**
 * @swagger
 * /api/user/invitations/reject/{invitationId}:
 *   put:
 *     summary: Rechazar una invitación
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la invitación
 *     responses:
 *       200:
 *         description: Invitación rechazada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Invitación o usuario no encontrado
 *       500:
 *         description: Error del servidor
 */

router.put(
    "/invitations/reject/:invitationId",
    validatorInvitationId,
    rejectInvitationCtrl
);

/**
 * @swagger
 * /api/user/invitations/cancel/{invitationId}:
 *   delete:
 *     summary: Cancelar una invitación enviada
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la invitación
 *     responses:
 *       200:
 *         description: Invitación cancelada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Invitación o usuario no encontrado
 *       500:
 *         description: Error del servidor
 */

router.delete(
    "/invitations/cancel/:invitationId",
    validatorInvitationId,
    cancelInvitationCtrl
);
module.exports = router;