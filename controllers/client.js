const { matchedData } = require("express-validator");
const { clientsModel, usersModel } = require("../models");
const { handleHttpError } = require("../utils/handleHttpError");

/**
 * Crear un nuevo cliente
 * @param {Object} req
 * @param {Object} res
 */

const createClient = async (req, res) => {
    try{
        const user = req.user;
        const body = matchedData(req);

        //Ver si existe ya
        const existingClient = await clientsModel.findOne({
            name: body.name,
            $or: [
                {createdBy: user._id},
                {company: user.company?._id}
            ]
        });
        if(existingClient){
            return handleHttpError(res, "CLIENT_ALREADY_EXISTS", 409);
        }

        //Crear cliente
        const client = await clientsModel.create({
            ...body,
            createdBy: user._id,
            company: user.company?._id
        });

        // Send back the created client
        res.status(201).send({ client });

    } catch (error) {
        console.log(error);
        handleHttpError(res, "ERROR_CREATE_CLIENT");
    }
};

/**
* Obtener cliente por id
* @param {Object} req
* @param {Object} res
*/

const getClient = async (req, res) => {
    try{
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
            
            // Añadir condición para incluir clientes creados por cualquier usuario de la compañía
            query.$or.push({createdBy: { $in: companyUserIds }});
        }

        // Buscar cliente con la consulta optimizada
        const client = await clientsModel.findOne(query);

        if (!client) {
            return handleHttpError(res, "CLIENT_NOT_FOUND", 404);
        }
        
        res.send({ client });

    }catch(error){
        console.log(error);
        handleHttpError(res, "ERROR_GET_CLIENT");
    }
};

/**
 * Obtener todos los clientes del usuario o compañía
 * @param {Object} req
 * @param {Object} res
 */

const getClients = async (req, res) => {
    try {
        const user = req.user;

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
            
            // Añadir condición para incluir clientes creados por cualquier usuario de la compañía
            query.$or.push({createdBy: { $in: companyUserIds }});
        }

        // Buscar clientes con la consulta modificada
        const clients = await clientsModel.find(query);
        
        res.send({clients});
    } catch(error) {
        console.log(error);
        handleHttpError(res, "ERROR_GET_CLIENTS");
    }
};

/**
 * Actualizar un cliente
 * @param {Object} req
 * @param {Object} res
 */

const updateClient = async (req, res) => {
    try{
        const { id } = req.params;
        const body = matchedData(req);
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
            
            // Añadir condición para incluir clientes creados por cualquier usuario de la compañía
            query.$or.push({createdBy: { $in: companyUserIds }});
        }

        // Verificar que existe el cliente
        const clientExists = await clientsModel.findOne(query);

        if(!clientExists){
            return handleHttpError(res, "CLIENT_NOT_FOUND", 404);
        }

        // Actualizar cliente
        const client = await clientsModel.findByIdAndUpdate(
            id,
            body,
            { new: true }
        );

        res.send({client});
    }catch(error){
        console.log(error);
        handleHttpError(res, "ERROR_UPDATE_CLIENT");
    }
};

/**
 * Eliminar un cliente
 * @param {Object} req
 * @param {Object} res
 */

const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const { hard } = req.query; // si hard=true, hard delete

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
            
            // Añadir condición para incluir clientes creados por cualquier usuario de la compañía
            query.$or.push({createdBy: { $in: companyUserIds }});
        }

        // Verificar que el cliente existe
        const client = await clientsModel.findOne(query);
        
        if (!client) {
            return handleHttpError(res, "CLIENT_NOT_FOUND", 404);
        }
        
        // Realizar soft delete o hard delete
        if (hard === 'true') {
            await clientsModel.deleteOne({ _id: id });
            res.send({ message: "CLIENT_DELETED_PERMANENTLY" });
        } else {
            await clientsModel.delete({ _id: id }); // soft delete
            res.send({ message: "CLIENT_ARCHIVED" });
        }
    }catch(error){
        console.log(error);
        handleHttpError(res, "ERROR_DELETE_CLIENT")
    }
};

/**
 * Obtener clientes archivados
 * @param {Object} req
 * @param {Object} res
 */
const getArchivedClients = async (req, res) => {
    try {
        const user = req.user;
        
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
            
            // Añadir condición para incluir clientes creados por cualquier usuario de la compañía
            query.$or.push({createdBy: { $in: companyUserIds }});
        }

        // Buscar clientes archivados con la consulta optimizada
        const clients = await clientsModel.findDeleted(query);

        res.send({ clients });
    } catch (error) {
        console.log(error);
        handleHttpError(res, "ERROR_GET_ARCHIVED_CLIENTS");
    }
};

/**
 * Restaurar un cliente archivado
 * @param {Object} req
 * @param {Object} res
 */
const restoreClient = async (req, res) => {
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
            
            // Añadir condición para incluir clientes creados por cualquier usuario de la compañía
            query.$or.push({createdBy: { $in: companyUserIds }});
        }

        // Verificar que el cliente archivado existe
        const client = await clientsModel.findOneDeleted(query);

        if (!client) {
            // Verificar si existe un cliente no archivado con este ID
            const activeClient = await clientsModel.findOne({ _id: id });
            if (activeClient) {
                return handleHttpError(res, "CLIENT_NOT_ARCHIVED", 400);
            }
            return handleHttpError(res, "ARCHIVED_CLIENT_NOT_FOUND", 404);
        }

        // Restaurar cliente
        await clientsModel.restore({ _id: id });
        
        const restoredClient = await clientsModel.findById(id);
        res.send({ client: restoredClient, message: "CLIENT_RESTORED" });
    } catch (error) {
        console.log(error);
        handleHttpError(res, "ERROR_RESTORE_CLIENT");
    }
};

module.exports = {
    createClient,
    getClients,
    getClient,
    updateClient,
    deleteClient,
    getArchivedClients,
    restoreClient
};