const mongoose = require('mongoose');
const mongooseDelete = require("mongoose-delete");

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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
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

const UserSchema = new mongoose.Schema({
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
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
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
    receivedInvitations: [invitationSchema],
    sentInvitations: [invitationSchema],
    
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

UserSchema.plugin(mongooseDelete, { overrideMethods: "all" }); 

module.exports = mongoose.model('User', UserSchema);