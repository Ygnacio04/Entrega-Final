const { matchedData } = require("express-validator");
const { projectsModel, clientsModel } = require("../models");
const { handleHttpError } = require("../utils/handleHttpError");

/**
 * Crear un nuevo proyecto
 * @param {Object} req
 * @param {Object} res
 */

const createProject = async (req, res) => {
    try {
        const user = req.user;
        const body = matchedData(req);
        
        // Ver si el cliente existe y pertenece al usuario o su compañía
        const client = await clientsModel.findOne({
            _id: body.client,
            $or: [
                { createdBy: user._id },
                { company: user.company?._id }
            ]
        });

        if (!client) {
            return handleHttpError(res, "CLIENT_NOT_FOUND", 404);
        }

        // Ver si el proyecto ya existe para este cliente y usuario/compañía
        const existingProject = await projectsModel.findOne({
            name: body.name,
            client: body.client,
            $or: [
                { createdBy: user._id },
                { company: user.company?._id }
            ]
        });

        if (existingProject) {
            return handleHttpError(res, "PROJECT_ALREADY_EXISTS", 409);
        }

        // Crear proyecto asociado al usuario actual y cliente
        const project = await projectsModel.create({
            ...body,
            createdBy: user._id,
            company: user.company?._id
        });

        // Populate client data
        await project.populate('client');

        res.status(201).send({ project });
    } catch (error) {
        console.log(error);
        handleHttpError(res, "ERROR_CREATE_PROJECT");
    }
};