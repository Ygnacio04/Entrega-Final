const { matchedData } = require("express-validator");
const { clientsModel } = require("../models");
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

         // Buscar cliente por ID que pertenezca al usuario o su compañía
        const client = await clientsModel.findOne({
            _id: id,
            $or: [
                {createdBy: user._id},
                {company: user.company?._id}
            ]
        });

        if (!client) {
            return handleHttpError(res, "CLIENT_NOT_FOUND", 404);
        }

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

        // Buscar clientes del usuario o de su compañía
        const clients = await clientsModel.find({
            $or: [
                {createdBy: user._id},
                {company: user.company?._id}
            ]
        });
        
        res.send({clients});

    }catch(error){
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
        const{id} = req.params;
        const body = matchedData(req);
        const user = req.user;

        //Verificar que existe el cliente del usuario o compañía
        const clientExists = await clientsModel.findOne({
            _id: id,
            $or: [
                {createdBy: user._id},
                {company: user.company?._id}
            ]
        });

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

        // Verificar que el cliente existe y pertenece al usuario o compañía
        const client = await clientsModel.findOne({
            _id: id,
            $or: [
                { createdBy: user._id },
                { company: user.company?._id }
            ]
        });
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
        
        // Buscar clientes archivados del usuario o de su compañía
        const clients = await clientsModel.findDeleted({
            $or: [
                { createdBy: user._id },
                { company: user.company?._id }
            ]
        });

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

        // Verificar que el cliente archivado existe y pertenece al usuario o su compañía
        const client = await clientsModel.findOneDeleted({
            _id: id,
            $or: [
                { createdBy: user._id },
                { company: user.company?._id }
            ]
        });

        if (!client) {
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