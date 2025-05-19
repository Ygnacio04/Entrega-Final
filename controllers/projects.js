const { matchedData } = require("express-validator");
const { projectsModel, clientsModel, usersModel  } = require("../models");
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
        
        // Construir consulta base para verificar el cliente
        const clientQuery = { _id: body.client, $or: [{createdBy: user._id}] };
        
        // Solo añadir filtro de compañía si el usuario tiene una
        if (user.company && user.company.name && user.company.cif) {
            // Encontrar todos los usuarios que pertenecen a la misma compañía
            const companyUsers = await usersModel.find({
                'company.name': user.company.name,
                'company.cif': user.company.cif
            }).select('_id');
            
            const companyUserIds = companyUsers.map(u => u._id.toString());
            
            // Añadir condición para incluir clientes creados por cualquier usuario de la compañía
            clientQuery.$or.push({createdBy: { $in: companyUserIds }});
        }
        
        // Ver si el cliente existe y pertenece al usuario o su compañía
        const client = await clientsModel.findOne(clientQuery);

        if (!client) {
            return handleHttpError(res, "CLIENT_NOT_FOUND", 404);
        }

        // Construir consulta base para verificar si el proyecto ya existe
        const existingProjectQuery = { 
            name: body.name,
            client: body.client, 
            $or: [{createdBy: user._id}] 
        };
        
        // Solo añadir filtro de compañía si el usuario tiene una
        if (user.company && user.company.name && user.company.cif) {
            // Usar los mismos companyUserIds que ya tenemos
            const companyUsers = await usersModel.find({
                'company.name': user.company.name,
                'company.cif': user.company.cif
            }).select('_id');
            
            const companyUserIds = companyUsers.map(u => u._id.toString());
            
            // Añadir condición para incluir proyectos creados por cualquier usuario de la compañía
            existingProjectQuery.$or.push({createdBy: { $in: companyUserIds }});
        }
        
        // Ver si el proyecto ya existe para este cliente y usuario/compañía
        const existingProject = await projectsModel.findOne(existingProjectQuery);

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
       
       // Construir consulta base
       const query = { $or: [{createdBy: user._id}] };
       
       // Solo añadir filtro de compañía si el usuario tiene una
       if (user.company && user.company.name && user.company.cif) {
            // Encontrar todos los usuarios que pertenecen a la misma compañía
            const companyUsers = await usersModel.find({
                'company.name': user.company.name,
                'company.cif': user.company.cif
            }).select('_id');
            
            const companyUserIds = companyUsers.map(u => u._id.toString());
            
            // Añadir condición para incluir proyectos creados por cualquier usuario de la compañía
            query.$or.push({createdBy: { $in: companyUserIds }});
       }
       
       // Añadir filtro por cliente si se proporciona
       if (clientId) {
           query.client = clientId;
       }
       
       // Buscar proyectos con la consulta optimizada
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

       // Construir consulta base
       const query = { _id: id, $or: [{createdBy: user._id}] };
       
       // Solo añadir filtro de compañía si el usuario tiene una
       if (user.company && user.company.name && user.company.cif) {
            // Encontrar todos los usuarios que pertenecen a la misma compañía
            const companyUsers = await usersModel.find({
                'company.name': user.company.name,
                'company.cif': user.company.cif
            }).select('_id');
            
            const companyUserIds = companyUsers.map(u => u._id.toString());
            
            // Añadir condición para incluir proyectos creados por cualquier usuario de la compañía
            query.$or.push({createdBy: { $in: companyUserIds }});
       }

       // Buscar proyecto por ID con la consulta optimizada
       const project = await projectsModel.findOne(query).populate('client');

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

       // Construir consulta base para el proyecto
       const query = { _id: id, $or: [{createdBy: user._id}] };
       
       // Solo añadir filtro de compañía si el usuario tiene una
       if (user.company && user.company.name && user.company.cif) {
            // Encontrar todos los usuarios que pertenecen a la misma compañía
            const companyUsers = await usersModel.find({
                'company.name': user.company.name,
                'company.cif': user.company.cif
            }).select('_id');
            
            const companyUserIds = companyUsers.map(u => u._id.toString());
            
            // Añadir condición para incluir proyectos creados por cualquier usuario de la compañía
            query.$or.push({createdBy: { $in: companyUserIds }});
       }

       // Verificar que el proyecto existe y pertenece al usuario o su compañía
       const projectExists = await projectsModel.findOne(query);

       if (!projectExists) {
           return handleHttpError(res, "PROJECT_NOT_FOUND", 404);
       }

       // Si se está actualizando el cliente, verificar que existe y pertenece al usuario/compañía
       if (body.client) {
           // Construir consulta para el cliente
           const clientQuery = { _id: body.client, $or: [{createdBy: user._id}] };
           
           // Solo añadir filtro de compañía si el usuario tiene una
           if (user.company && user.company.name && user.company.cif) {
                // Encontrar todos los usuarios que pertenecen a la misma compañía
                const companyUsers = await usersModel.find({
                    'company.name': user.company.name,
                    'company.cif': user.company.cif
                }).select('_id');
                
                const companyUserIds = companyUsers.map(u => u._id.toString());
                
                // Añadir condición para incluir clientes creados por cualquier usuario de la compañía
                clientQuery.$or.push({createdBy: { $in: companyUserIds }});
           }

           const client = await clientsModel.findOne(clientQuery);

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

/**
 * Eliminar un proyecto (soft delete o hard delete)
 * @param {Object} req
 * @param {Object} res
 */
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const { hard } = req.query; // si hard=true, se realiza hard delete

        // Construir consulta base
        const query = { _id: id, $or: [{createdBy: user._id}] };
        
        // Solo añadir filtro de compañía si el usuario tiene una
        if (user.company && user.company.name && user.company.cif) {
            // Encontrar todos los usuarios que pertenecen a la misma compañía
            const companyUsers = await usersModel.find({
                'company.name': user.company.name,
                'company.cif': user.company.cif
            }).select('_id');
            
            const companyUserIds = companyUsers.map(u => u._id.toString());
            
            // Añadir condición para incluir proyectos creados por cualquier usuario de la compañía
            query.$or.push({createdBy: { $in: companyUserIds }});
        }

        // Verificar que el proyecto existe
        const project = await projectsModel.findOne(query);

        if (!project) {
            return handleHttpError(res, "PROJECT_NOT_FOUND", 404);
        }

        // Realizar soft delete o hard delete según corresponda
        if (hard === 'true') {
            await projectsModel.deleteOne({ _id: id });
            res.send({ message: "PROJECT_DELETED_PERMANENTLY" });
        } else {
            await projectsModel.delete({ _id: id }); // soft delete usando plugin mongoose-delete
            res.send({ message: "PROJECT_ARCHIVED" });
        }
    } catch (error) {
        console.log(error);
        handleHttpError(res, "ERROR_DELETE_PROJECT");
    }
};

/**
 * Obtener proyectos archivados
 * @param {Object} req
 * @param {Object} res
 */
const getArchivedProjects = async (req, res) => {
    try {
        const user = req.user;
        
        // Construir consulta base
        const query = {$or: [{createdBy: user._id}] };
        
        // Solo añadir filtro de compañía si el usuario tiene una
        if (user.company && user.company.name && user.company.cif) {
            // Encontrar todos los usuarios que pertenecen a la misma compañía
            const companyUsers = await usersModel.find({
                'company.name': user.company.name,
                'company.cif': user.company.cif
            }).select('_id');
            
            const companyUserIds = companyUsers.map(u => u._id.toString());
            
            // Añadir condición para incluir proyectos creados por cualquier usuario de la compañía
            query.$or.push({createdBy: { $in: companyUserIds }});
        }
        
        // Buscar proyectos archivados con la consulta optimizada
        const allProjects  = await projectsModel.findDeleted(query).populate('client');

        const archivedProjects = allProjects.filter(project => project.deleted === true);

        res.send({ projects: archivedProjects });
    } catch (error) {
        console.log(error);
        handleHttpError(res, "ERROR_GET_ARCHIVED_PROJECTS");
    }
};

/**
 * Restaurar un proyecto archivado
 * @param {Object} req
 * @param {Object} res
 */
const restoreProject = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // Construir consulta base
        const query = { _id: id, $or: [{createdBy: user._id}] };
        
        // Solo añadir filtro de compañía si el usuario tiene una
        if (user.company && user.company.name && user.company.cif) {
            // Encontrar todos los usuarios que pertenecen a la misma compañía
            const companyUsers = await usersModel.find({
                'company.name': user.company.name,
                'company.cif': user.company.cif
            }).select('_id');
            
            const companyUserIds = companyUsers.map(u => u._id.toString());
            
            // Añadir condición para incluir proyectos creados por cualquier usuario de la compañía
            query.$or.push({createdBy: { $in: companyUserIds }});
        }

        // Verificar que el proyecto archivado existe
        const project = await projectsModel.findOneDeleted(query);

        if (!project) {
            // Verificar si existe un proyecto no archivado con este ID
            const activeProject = await projectsModel.findOne({ _id: id });
            if (activeProject) {
                return handleHttpError(res, "PROJECT_NOT_ARCHIVED", 400);
            }
            return handleHttpError(res, "ARCHIVED_PROJECT_NOT_FOUND", 404);
        }

        // Restaurar proyecto
        await projectsModel.restore({ _id: id });
        
        const restoredProject = await projectsModel.findById(id).populate('client');
        res.send({ project: restoredProject, message: "PROJECT_RESTORED" });
    } catch (error) {
        console.log(error);
        handleHttpError(res, "ERROR_RESTORE_PROJECT");
    }
};

module.exports = {
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject,
    getArchivedProjects,
    restoreProject
};
