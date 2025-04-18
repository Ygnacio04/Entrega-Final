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

// Ruta para el registro de usuario
router.post(
    "/register", 
    validatorRegister,
    registerCtrl
);

// Ruta para verificar el email
router.post(
    "/verify-email", 
    validatorValidateEmail,
    verifyEmailCtrl
);

// Ruta para el login
router.post(
    "/login", 
    validatorLogin,
    loginCtrl
);

// Ruta para recuperar contraseña
router.post(
    "/forgot-password", 
    forgotPasswordCtrl
);

// Ruta para restablecer contraseña
router.post(
    "/reset-password", 
    resetPasswordCtrl
);

// Rutas protegidas por autenticación
router.use(authMiddleware); // Aplicar middleware de autenticación a todas las rutas siguientes

// Ruta para el onboarding
router.put(
    "/onboarding", 
    updateUserCtrl
);

// Ruta para obtener datos del usuario actual
router.get(
    "/me", 
    getUserFromTokenCtrl
);

// Ruta para actualizar logo
router.patch(
    "/logo",
    uploadMiddlewareMemory.single("image"),
    uploadLogo
);

// Ruta para eliminar usuario
router.delete(
    "/delete", 
    deleteUserCtrl
);
router.post(
    "/invitations/send",
    validatorSendInvitation,
    sendInvitationCtrl
);

// Obtener invitaciones recibidas
router.get(
    "/invitations/received",
    getReceivedInvitationsCtrl
);

// Obtener invitaciones enviadas
router.get(
    "/invitations/sent",
    getSentInvitationsCtrl
);

// Aceptar una invitación
router.put(
    "/invitations/accept/:invitationId",
    validatorInvitationId,
    acceptInvitationCtrl
);

// Rechazar una invitación
router.put(
    "/invitations/reject/:invitationId",
    validatorInvitationId,
    rejectInvitationCtrl
);

// Cancelar una invitación enviada
router.delete(
    "/invitations/cancel/:invitationId",
    validatorInvitationId,
    cancelInvitationCtrl
);
module.exports = router;