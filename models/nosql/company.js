const mongoose = require('mongoose');
const mongooseDelete = require("mongoose-delete");

const CompanySchema = new mongoose.Schema({
    name: { 
        type: String,
        trim: true,
        required: true 
    },
    cif: { 
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
    founder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: { 
            type: String,
            enum: ["owner", "admin", "user"],
            default: "user"
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true,
    versionKey: false
});

CompanySchema.plugin(mongooseDelete, { overrideMethods: "all" });

module.exports = mongoose.model('Company', CompanySchema);