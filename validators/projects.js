const { check } = require('express-validator');
const validateResults = require("../utils/handleValidator");
const mongoose = require('mongoose');

const validatorCreateProject = [
    check('name')
        .notEmpty().withMessage('Project name is required')
        .isLength({ min: 3 }).withMessage('Project name must be at least 3 characters long'),
    check('description')
        .optional()
        .isString().withMessage('Description must be a string'),
    check('client')
        .notEmpty().withMessage('Client ID is required')
        .custom((value) => {
            if(!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid MongoDB ID for client');
            }
            return true;
        }),
    check('startDate')
        .optional()
        .isISO8601().withMessage('Start date must be a valid date'),
    check('endDate')
        .optional()
        .isISO8601().withMessage('End date must be a valid date'),
    check('status')
        .optional()
        .isIn(['pending', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status value'),
    (req, res, next) => validateResults(req, res, next)
];

const validatorGetProject = [
    check('id')
        .notEmpty().withMessage('Project ID is required')
        .custom((value) => {
            if(!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid MongoDB ID');
            }
            return true;
        }),
    (req, res, next) => validateResults(req, res, next)
];

module.exports = { validatorCreateProject, validatorGetProject };