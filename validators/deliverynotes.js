const { check } = require('express-validator');
const validateResults = require("../utils/handleValidator");
const mongoose = require('mongoose');

const validatorCreateDeliveryNote = [
    check('project')
        .notEmpty().withMessage('Project ID is required')
        .custom((value) => {
            if(!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid MongoDB ID for project');
            }
            return true;
        }),
    check('date')
        .optional()
        .isISO8601().withMessage('Date must be a valid date'),
    check('workedHours')
        .optional()
        .isArray().withMessage('Worked hours must be an array'),
    check('workedHours.*.person')
        .optional()
        .isString().withMessage('Person name must be a string'),
    check('workedHours.*.hours')
        .optional()
        .isNumeric().withMessage('Hours must be a number'),
    check('workedHours.*.hourlyRate')
        .optional()
        .isNumeric().withMessage('Hourly rate must be a number'),
    check('workedHours.*.date')
        .optional()
        .isISO8601().withMessage('Date must be a valid date'),
    check('workedHours.*.description')
        .optional()
        .isString().withMessage('Description must be a string'),
    check('materials')
        .optional()
        .isArray().withMessage('Materials must be an array'),
    check('materials.*.name')
        .optional()
        .isString().withMessage('Material name must be a string'),
    check('materials.*.quantity')
        .optional()
        .isNumeric().withMessage('Quantity must be a number'),
    check('materials.*.price')
        .optional()
        .isNumeric().withMessage('Price must be a number'),
    check('materials.*.description')
        .optional()
        .isString().withMessage('Description must be a string'),
    check('observations')
        .optional()
        .isString().withMessage('Observations must be a string'),
    (req, res, next) => validateResults(req, res, next)
];

const validatorGetDeliveryNote = [
    check('id')
        .notEmpty().withMessage('Delivery note ID is required')
        .custom((value) => {
            if(!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid MongoDB ID');
            }
            return true;
        }),
    (req, res, next) => validateResults(req, res, next)
];

module.exports = { validatorCreateDeliveryNote, validatorGetDeliveryNote };