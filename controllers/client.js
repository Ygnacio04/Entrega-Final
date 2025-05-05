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