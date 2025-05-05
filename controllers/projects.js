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


/**
* Obtener todos los proyectos del usuario o compañía
* @param {Object} req
* @param {Object} res
*/
const getProjects = async (req, res) => {
   try {
       const user = req.user;
       const { clientId } = req.query; // Opcional: filtrar por cliente
       
       // Construir query base
       const query = {
           $or: [
               { createdBy: user._id },
               { company: user.company?._id }
           ]
       };
       
       // Añadir filtro por cliente si se proporciona
       if (clientId) {
           query.client = clientId;
       }
       
       // Buscar proyectos del usuario o de su compañía
       const projects = await projectsModel.find(query)
           .populate('client');

       res.send({ projects });
   } catch (error) {
       console.log(error);
       handleHttpError(res, "ERROR_GET_PROJECTS");
   }
};

/**
* Obtener un proyecto por ID
* @param {Object} req
* @param {Object} res
*/
const getProject = async (req, res) => {
   try {
       const { id } = req.params;
       const user = req.user;

       // Buscar proyecto por ID que pertenezca al usuario o su compañía
       const project = await projectsModel.findOne({
           _id: id,
           $or: [
               { createdBy: user._id },
               { company: user.company?._id }
           ]
       }).populate('client');

       if (!project) {
           return handleHttpError(res, "PROJECT_NOT_FOUND", 404);
       }

       res.send({ project });
   } catch (error) {
       console.log(error);
       handleHttpError(res, "ERROR_GET_PROJECT");
   }
};

/**
* Actualizar un proyecto
* @param {Object} req
* @param {Object} res
*/
const updateProject = async (req, res) => {
   try {
       const { id } = req.params;
       const body = matchedData(req);
       const user = req.user;

       // Verificar que el proyecto existe y pertenece al usuario o su compañía
       const projectExists = await projectsModel.findOne({
           _id: id,
           $or: [
               { createdBy: user._id },
               { company: user.company?._id }
           ]
       });

       if (!projectExists) {
           return handleHttpError(res, "PROJECT_NOT_FOUND", 404);
       }

       // Si se está actualizando el cliente, verificar que existe y pertenece al usuario/compañía
       if (body.client) {
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
       }

       // Actualizar proyecto
       const project = await projectsModel.findByIdAndUpdate(
           id,
           body,
           { new: true }
       ).populate('client');

       res.send({ project });
   } catch (error) {
       console.log(error);
       handleHttpError(res, "ERROR_UPDATE_PROJECT");
   }
};


