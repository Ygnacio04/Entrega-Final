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
            return handleHttpError(res, "CLIENT_ALREADY_EXISTS, 409");
        }

        //Crear cliente
        const client = await clientsModel.create({
            ...body,
            createBy: user._id,
            company: user.company?._id
        })

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
        handleHttpError(res, "ERROR_GET_CLIENTS")
    }
};