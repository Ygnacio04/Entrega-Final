const mongoose = require('mongoose');
const mongooseDelete = require("mongoose-delete");

const ProjectSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    // Relación con el cliente al que pertenece el proyecto
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    // Relación con usuario que creó el proyecto
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Relación con la compañía si el proyecto pertenece a una compañía
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'  // Referencia al usuario que contiene la información de la compañía
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true,
    versionKey: false
});

// Plugin para soft delete
ProjectSchema.plugin(mongooseDelete, { overrideMethods: "all" });

module.exports = mongoose.model('Project', ProjectSchema);