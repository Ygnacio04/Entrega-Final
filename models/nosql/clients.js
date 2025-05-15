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
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    }
}, {
    timestamps: true,
    versionKey: false
});

ClientSchema.plugin(mongooseDelete, { overrideMethods: "all" });

module.exports = mongoose.model('Client', ClientSchema);