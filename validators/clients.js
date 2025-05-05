const { check } = require('express-validator');
const validateResults = require("../utils/handleValidator");
const mongoose = require('mongoose');

const validatorCreateClient = [
    check('name')
        .notEmpty().withMessage('Client name is required')
        .isLength({ min: 3 }).withMessage('Client name must be at least 3 characters long'),
    check('nif')
        .optional()
        .isString().withMessage('NIF must be a string'),
    check('address')
        .optional()
        .isObject().withMessage('Address must be an object'),
    check('address.street')
        .optional()
        .isString().withMessage('Street must be a string'),
    check('address.number')
        .optional()
        .isNumeric().withMessage('Number must be numeric'),
    check('address.postal')
        .optional()
        .isNumeric().withMessage('Postal code must be numeric'),
    check('address.city')
        .optional()
        .isString().withMessage('City must be a string'),
    check('email')
        .optional()
        .isEmail().withMessage('Email is invalid'),
    check('phone')
        .optional()
        .isString().withMessage('Phone must be a string'),
    (req, res, next) => validateResults(req, res, next)
];

const validatorGetClient = [
    check('id')
        .notEmpty().withMessage('Client ID is required')
        .custom((value) => {
            if(!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid MongoDB ID');
            }
            return true;
        }),
    (req, res, next) => validateResults(req, res, next)
];

module.exports = { validatorCreateClient, validatorGetClient };