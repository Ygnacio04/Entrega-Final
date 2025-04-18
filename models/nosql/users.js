const mongoose = require('mongoose');
const mongooseDelete = require("mongoose-delete");

// Esquema para las invitaciones
const invitationSchema = new mongoose.Schema({
    inviterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    inviterEmail: {
        type: String,
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId
    },
    companyName: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    role: {
        type: String,
        enum: ['invited', 'admin', 'user'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const UserScheme = new mongoose.Schema({
    firstName: { 
        type: String,
        trim: true,
        required: true 
    },
    lastName: { 
        type: String,
        required: true 
    },
    email: { 
        type: String, 
        unique: true, 
        required: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    company: {
        name: { 
            type: String,
            trim: true 
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
        partners: [{
            _id: { 
                type: String,
                required: true 
            },
            role: { 
                type: String,
                enum: ["invited", "admin", "user"],
                required: true, 
                default: "user"
            }
        }]
    },
    role: {
        type: String,
        enum: ["user", "admin", "guest"],
        default: "user"
    },
    validated: { 
        type: Boolean,
        default: false 
    },
    // Invitaciones
    receivedInvitations: [invitationSchema],
    sentInvitations: [invitationSchema],
    
    // Campos existentes
    verificationCode: {
        type: String 
    },
    verificationAttempts: {
        type: Number,
        default: 3
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    profilePicture: {
        type: String
    }
}, {
    timestamps: true,
    versionKey: false
});

// Solo email tiene índice único
UserScheme.index({ 'email': 1 }, { unique: true });

UserScheme.plugin(mongooseDelete, { overrideMethods: "all" }); 

module.exports = mongoose.model('User', UserScheme);