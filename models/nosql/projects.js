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
    // Relación directa con la compañía (usando ID de compañía)
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
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