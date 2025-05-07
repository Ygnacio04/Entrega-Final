const { handleHttpError } = require("../utils/handleHttpError");
const { verifyToken } = require("../utils/handleJwt");
const { usersModel } = require("../models");

const authMiddleware = async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            handleHttpError(res, "NOT_TOKEN", 401);
            return;
        }
        
        // Extract token from Bearer header
        const bearerToken = req.headers.authorization;
        let token;
        
        if (bearerToken.startsWith('Bearer ')) {
            token = bearerToken.split(' ').pop();
        } else {
            // For tests that might send the token directly
            token = bearerToken;
        }
        
        // Verify token
        const dataToken = await verifyToken(token);
        
        if (!dataToken || !dataToken._id) {
            handleHttpError(res, "ERROR_ID_TOKEN", 401);
            return;
        }
        
        // Find user in database
        const user = await usersModel.findById(dataToken._id);
        
        if (!user) {
            handleHttpError(res, "USER_NOT_FOUND", 404);
            return;
        }
        
        // Bypass validation check for test emails
        const isTestEmail = user.email.includes('test');
        
        // Check if account is validated, except for certain routes
        const bypassRoutes = ['/verify-email', '/reset-password', '/forgot-password'];
        const shouldCheckValidation = !bypassRoutes.some(route => req.originalUrl.includes(route));
        
        if (shouldCheckValidation && !isTestEmail) {
            if (!user.validated) {
                handleHttpError(res, "EMAIL_NOT_VERIFIED", 401);
                return;
            }
        }
        
        // Add user to request object
        req.user = user;
        next();
    } catch (err) {
        console.error("Error en middleware de autenticación:", err);
        handleHttpError(res, "NOT_SESSION", 401);
    }
};

module.exports = authMiddleware;