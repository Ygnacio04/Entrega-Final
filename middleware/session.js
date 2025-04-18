const { handleHttpError } = require("../utils/handleHttpError");
const { verifyToken } = require("../utils/handleJwt");
const { usersModel } = require("../models");

const authMiddleware = async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            handleHttpError(res, "NOT_TOKEN", 401);
            return;
        }
        
        // Extraer el token del encabezado Bearer
        const token = req.headers.authorization.split(' ').pop();
        
        // Verificar el token
        const dataToken = await verifyToken(token);
        
        if (!dataToken || !dataToken._id) {
            handleHttpError(res, "ERROR_ID_TOKEN", 401);
            return;
        }
        
        // Buscar el usuario en la base de datos
        const user = await usersModel.findById(dataToken._id);
        
        if (!user) {
            handleHttpError(res, "USER_NOT_FOUND", 404);
            return;
        }
        
        // Verificar si la cuenta está validada, excepto para ciertas rutas
        const bypassRoutes = ['/verify-email', '/reset-password', '/forgot-password'];
        const shouldCheckValidation = !bypassRoutes.some(route => req.originalUrl.includes(route));
        
        if (shouldCheckValidation) {
            
            if (!user.validated) {
                handleHttpError(res, "EMAIL_NOT_VERIFIED", 401);
                return;
            }
        }
        
        // Agregar el usuario al objeto de solicitud
        req.user = user;
        next();
    } catch (err) {
        console.error("Error en middleware de autenticación:", err);
        handleHttpError(res, "NOT_SESSION", 401);
    }
};

module.exports = authMiddleware;