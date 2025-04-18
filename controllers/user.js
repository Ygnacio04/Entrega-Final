const { matchedData } = require("express-validator");
const { tokenSign } = require("../utils/handleJwt");
const { encrypt, compare } = require("../utils/handlePassword");
const { handleHttpError } = require("../utils/handleHttpError");
const uploadToPinata = require("../utils/uploadToPinata");
const { usersModel } = require("../models");

// Generador de código de verificación
const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Registro de usuario
const registerCtrl = async (req, res) => {
    try {
        req = matchedData(req);
        
        // Verificar si el usuario ya existe
        const existingUser = await usersModel.findOne({ email: req.email });
        if (existingUser && existingUser.validated === 1) {
            return handleHttpError(res, "USER_ALREADY_EXISTS", 409);
        }

        // Cifrar la contraseña
        const hashedPassword = await encrypt(req.password);

        // Generar código de verificación
        const verificationCode = generateVerificationCode();
        const maxAttempts = 3;

        //Crear usuario no verificado
        const body = { 
            firstName: req.firstName,
            lastName: req.lastName,
            email: req.email, 
            password: hashedPassword, 
            verificationCode, 
            verificationAttempts: maxAttempts,
        };
        
        const dataUser = await usersModel.create(body);
        dataUser.set('password', undefined, { strict: false }); // Excluir la contraseña del resultado

        const data = {
            token: await tokenSign(dataUser),
            user: dataUser
        };

        res.send(data);
    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_REGISTER_USER");
    }
};

// *Validación de email*
const verifyEmailCtrl = async (req, res) => {
    try {
        const { email, verificationCode } = req.body;
        const user = await usersModel.findOne({ email });

        if (!user) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }

        if (user.verificationCode !== verificationCode) {
            return res.status(400).send({
                message: "INVALID_VERIFICATION_CODE"
            });
        }

         // El usuario es verificado
        user.validated = true;
        user.verificationCode = undefined; // Limpiar el código de verificación
        await user.save();

        res.send({ message: "Correo electrónico verificado correctamente" });
    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_VERIFY_EMAIL");
    }
};

// Login
const loginCtrl = async (req, res) => {
    try {
        req = matchedData(req);
        const user = await usersModel.findOne({ email: req.email })
            .select("password firstName lastName role email validated");

        if (!user) {
            return handleHttpError(res, "USER_NOT_EXISTS", 404);
        }

        // Verificar validated
        if (!user.validated) {
            return handleHttpError(res, "EMAIL_NOT_VERIFIED", 403);
        }
        // Comparar la contraseña ingresada con la almacenada
        const check = await compare(req.password, user.password);
        if (!check) {
            return handleHttpError(res, "INVALID_PASSWORD", 401);
        }

        user.set("password", undefined, { strict: false });

        const data = {
            token: await tokenSign(user),
            user
        };

        res.send(data);
    } catch (err) {
        console.error(err);
        handleHttpError(res, "ERROR_LOGIN_USER");
    }
};

// Obtener el usuario a partir del token JWT
const getUserFromTokenCtrl = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await usersModel.findById(userId).select("-password");

        if (!user) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }

        res.send(user);
    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_GET_USER");
    }
};

// Actualizar datos del usuario
const updateUserCtrl = async (req, res) => {
    try {
        const userId = req.user._id; // Usar ID del token JWT
        const updateData = req.body;

        // Filtrar campos sensibles que no deberían actualizarse directamente
        const { password, verificationCode, validated, ...safeUpdateData } = updateData;

        const updatedUser = await usersModel.findByIdAndUpdate(userId, safeUpdateData, { new: true });

        if (!updatedUser) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }

        res.send(updatedUser);
    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_UPDATE_USER");
    }
};

// Eliminar usuario (hard/soft)
const deleteUserCtrl = async (req, res) => {
    try {
        const userId = req.user._id;
        const soft = req.query.soft === "false" ? false : true;

        let result;
        if (soft) {
            result = await usersModel.delete({ _id: userId });
        } else {
            result = await usersModel.deleteOne({ _id: userId });
        }

        if (!result) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }

        res.send({
            message: soft ? "Usuario eliminado (soft delete)" : "Usuario eliminado permanentemente"
        });
    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_DELETE_USER");
    }
};

// Recuperación de contraseña
const forgotPasswordCtrl = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await usersModel.findOne({ email });

        if (!user) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }

        const resetToken = generateVerificationCode();
        const resetTokenExpires = Date.now() + 3600000;

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpires;
        await user.save();

        res.send({
            message: "Token generado para recuperación",
            resetToken
        });
    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_FORGOT_PASSWORD");
    }
};

// Restablecimiento de contraseña
const resetPasswordCtrl = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const user = await usersModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return handleHttpError(res, "INVALID_OR_EXPIRED_TOKEN", 400);
        }

        const hashedPassword = await encrypt(newPassword);
        user.password = hashedPassword;

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.send({ message: "La contraseña ha sido restablecida correctamente" });
    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_RESET_PASSWORD");
    }
};

/**
 * Enviar invitación a un usuario
 * @param {Object} req 
 * @param {Object} res 
 */
const sendInvitationCtrl = async (req, res) => {
    try {
        const { email, role = 'user' } = req.body;
        const currentUser = req.user;

        // Verificar si el usuario tiene una compañía
        if (!currentUser.company || !currentUser.company.name) {
            return handleHttpError(res, "YOU_NEED_A_COMPANY_TO_INVITE", 400);
        }

        // Buscar al usuario invitado por email
        const invitedUser = await usersModel.findOne({ email });
        if (!invitedUser) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }

        // Verificar si ya se envió una invitación pendiente
        const alreadyInvited = invitedUser.receivedInvitations?.some(inv => 
            inv.inviterId.toString() === currentUser._id.toString() && 
            inv.status === 'pending'
        );

        if (alreadyInvited) {
            return handleHttpError(res, "INVITATION_ALREADY_SENT", 409);
        }

        // Verificar si ya pertenece a la compañía
        if (invitedUser.company && 
            invitedUser.company.partners && 
            invitedUser.company.partners.some(p => p._id === currentUser._id.toString())) {
            return handleHttpError(res, "USER_ALREADY_IN_COMPANY", 409);
        }

        // Crear objeto de invitación
        const invitation = {
            inviterId: currentUser._id,
            inviterEmail: currentUser.email,
            companyId: currentUser.company._id,
            companyName: currentUser.company.name,
            status: 'pending',
            role: role
        };

        // Guardar la invitación en ambos usuarios
        await usersModel.findByIdAndUpdate(invitedUser._id, {
            $push: { receivedInvitations: invitation }
        });

        // También guardar en la lista de invitaciones enviadas del usuario actual
        await usersModel.findByIdAndUpdate(currentUser._id, {
            $push: { sentInvitations: { ...invitation, inviterId: invitedUser._id } }
        });

        res.send({ 
            message: "Invitación enviada exitosamente",
            invitedUser: {
                _id: invitedUser._id,
                email: invitedUser.email,
                name: `${invitedUser.firstName} ${invitedUser.lastName}`
            }
        });
    } catch (err) {
        console.error(err);
        handleHttpError(res, "ERROR_SENDING_INVITATION");
    }
};

/**
 * Obtener todas las invitaciones recibidas
 * @param {Object} req 
 * @param {Object} res 
 */
const getReceivedInvitationsCtrl = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Buscar usuario con populate para obtener más información del invitador
        const user = await usersModel.findById(userId)
            .select('receivedInvitations')
            .populate({
                path: 'receivedInvitations.inviterId',
                select: 'firstName lastName email profilePicture'
            });
            
        if (!user) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }
        
        res.send({ invitations: user.receivedInvitations || [] });
    } catch (err) {
        console.error(err);
        handleHttpError(res, "ERROR_GETTING_INVITATIONS");
    }
};

/**
 * Obtener todas las invitaciones enviadas
 * @param {Object} req 
 * @param {Object} res 
 */
const getSentInvitationsCtrl = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const user = await usersModel.findById(userId)
            .select('sentInvitations')
            .populate({
                path: 'sentInvitations.inviterId',
                select: 'firstName lastName email profilePicture'
            });
            
        if (!user) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }
        
        res.send({ invitations: user.sentInvitations || [] });
    } catch (err) {
        console.error(err);
        handleHttpError(res, "ERROR_GETTING_SENT_INVITATIONS");
    }
};

/**
 * Aceptar una invitación
 * @param {Object} req 
 * @param {Object} res 
 */
const acceptInvitationCtrl = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const currentUser = req.user;
        
        // Buscar la invitación
        const user = await usersModel.findById(currentUser._id);
        
        if (!user) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }
        
        // Encontrar la invitación específica
        const invitation = user.receivedInvitations?.find(inv => 
            inv._id.toString() === invitationId && inv.status === 'pending'
        );
        
        if (!invitation) {
            return handleHttpError(res, "INVITATION_NOT_FOUND_OR_ALREADY_PROCESSED", 404);
        }
        
        // Buscar al invitador (para obtener información actualizada de la compañía)
        const inviter = await usersModel.findById(invitation.inviterId);
        
        if (!inviter || !inviter.company) {
            return handleHttpError(res, "INVITER_OR_COMPANY_NOT_FOUND", 404);
        }
        
        // Actualizar el estado de la invitación a 'accepted'
        await usersModel.updateOne(
            { _id: currentUser._id, 'receivedInvitations._id': invitationId },
            { $set: { 'receivedInvitations.$.status': 'accepted' } }
        );
        
        // Actualizar también la invitación en el usuario invitador
        await usersModel.updateOne(
            { _id: invitation.inviterId, 'sentInvitations.inviterId': currentUser._id },
            { $set: { 'sentInvitations.$.status': 'accepted' } }
        );
        
        // Agregar al usuario como partners en la compañía si no lo está ya
        if (!user.company || !user.company.partners || 
            !user.company.partners.some(p => p._id === invitation.inviterId.toString())) {
            
            // Actualizar los datos de la compañía para el usuario
            await usersModel.findByIdAndUpdate(currentUser._id, {
                company: inviter.company,
                $push: { 
                    'company.partners': {
                        _id: invitation.inviterId.toString(),
                        role: invitation.role
                    }
                }
            });
            
            // Agregar al usuario como partner en la compañía del invitador
            await usersModel.findByIdAndUpdate(invitation.inviterId, {
                $push: { 
                    'company.partners': {
                        _id: currentUser._id.toString(),
                        role: 'user' // El invitado recibe rol de usuario normal
                    }
                }
            });
        }
        
        res.send({ 
            message: "Invitación aceptada exitosamente",
            company: inviter.company
        });
    } catch (err) {
        console.error(err);
        handleHttpError(res, "ERROR_ACCEPTING_INVITATION");
    }
};

/**
 * Rechazar una invitación
 * @param {Object} req 
 * @param {Object} res 
 */
const rejectInvitationCtrl = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const currentUser = req.user;
        
        // Buscar la invitación
        const user = await usersModel.findById(currentUser._id);
        
        if (!user) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }
        
        // Encontrar la invitación específica
        const invitation = user.receivedInvitations?.find(inv => 
            inv._id.toString() === invitationId && inv.status === 'pending'
        );
        
        if (!invitation) {
            return handleHttpError(res, "INVITATION_NOT_FOUND_OR_ALREADY_PROCESSED", 404);
        }
        
        // Actualizar el estado de la invitación a 'rejected'
        await usersModel.updateOne(
            { _id: currentUser._id, 'receivedInvitations._id': invitationId },
            { $set: { 'receivedInvitations.$.status': 'rejected' } }
        );
        
        // Actualizar también la invitación en el usuario invitador
        await usersModel.updateOne(
            { _id: invitation.inviterId, 'sentInvitations.inviterId': currentUser._id },
            { $set: { 'sentInvitations.$.status': 'rejected' } }
        );
        
        res.send({ message: "Invitación rechazada exitosamente" });
    } catch (err) {
        console.error(err);
        handleHttpError(res, "ERROR_REJECTING_INVITATION");
    }
};

/**
 * Cancelar una invitación enviada
 * @param {Object} req
 * @param {Object} res
 */
const cancelInvitationCtrl = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const currentUser = req.user;
        
        // Buscar la invitación enviada
        const user = await usersModel.findById(currentUser._id);
        
        if (!user) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }
        
        // Encontrar la invitación específica
        const invitation = user.sentInvitations?.find(inv => 
            inv._id.toString() === invitationId && inv.status === 'pending'
        );
        
        if (!invitation) {
            return handleHttpError(res, "INVITATION_NOT_FOUND_OR_ALREADY_PROCESSED", 404);
        }
        
        // Eliminar la invitación del usuario invitado
        await usersModel.updateOne(
            { _id: invitation.inviterId },
            { $pull: { receivedInvitations: { inviterId: currentUser._id } } }
        );
        
        // Eliminar la invitación de las invitaciones enviadas
        await usersModel.updateOne(
            { _id: currentUser._id },
            { $pull: { sentInvitations: { _id: invitationId } } }
        );
        
        res.send({ message: "Invitación cancelada exitosamente" });
    } catch (err) {
        console.error(err);
        handleHttpError(res, "ERROR_CANCELING_INVITATION");
    }
};

// Actualizar logo
const uploadLogo = async(req, res) => {
    
    try {
        const user = req.user;
        console.log(user);
        if (!req.file) {
            return handleHttpError(res, "NO_FILE_PROVIDED", 400);
        }
        
        const buffer = req.file.buffer;
        const originalname = req.file.originalname;
        const file = {
            buffer: buffer,
            originalname: originalname
        };
        console.log(file);
        const {IpfsHash} = await uploadToPinata(file, originalname);
        
        const updatedUser = await usersModel.findByIdAndUpdate(user._id, {
            $set: { profilePicture: `${process.env.PINATA_GATEWAY}/${IpfsHash}` }
        }, { new: true });
        
        if (!updatedUser) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }
        
        res.send({
            message: "Logo actualizado", 
            profilePicture: updatedUser.profilePicture
        });
    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_UPDATE_LOGO");
    }
};

module.exports = {
    registerCtrl,
    verifyEmailCtrl,
    loginCtrl,
    getUserFromTokenCtrl,
    updateUserCtrl,
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
};