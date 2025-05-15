const mongoose = require('mongoose');
const mongooseDelete = require("mongoose-delete");

const ClientSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    nif: {
        type: String,
        trim: true
    },
    address: {
        street: { 
            type: String, 
            trim: true 
        },
        number: { 
            type: Number, 
            min: 0 
        },
        postal: { 
            type: Number,
            min: 0 
        },
        city: { 
            type: String,
            trim: true 
        }
    },
    email: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    // Relación con usuario/compañía que creó el cliente
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Relación con la compañía si el cliente pertenece a una compañía
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'  // Referencia al usuario que contiene la información de la compañía
    }
}, {
    timestamps: true,
    versionKey: false
});

// Plugin para soft delete
ClientSchema.plugin(mongooseDelete, { overrideMethods: "all" });

module.exports = mongoose.model('Client', ClientSchema);