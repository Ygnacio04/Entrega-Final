const mongoose = require('mongoose');
const mongooseDelete = require("mongoose-delete");

// Esquema para horas trabajadas
const WorkedHoursSchema = new mongoose.Schema({
    person: {
        type: String,
        required: true,
        trim: true
    },
    hours: {
        type: Number,
        required: true,
        min: 0
    },
    date: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        trim: true
    },
    hourlyRate: {
        type: Number,
        min: 0,
        default: 0
    }
}, { _id: true });

// Esquema para materiales
const MaterialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    price: {
        type: Number, 
        min: 0,
        default: 0
    },
    description: {
        type: String,
        trim: true
    }
}, { _id: true });

// Esquema para albaranes
const DeliveryNoteSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true
    },
    // Relación con el proyecto al que pertenece el albarán
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    // Relación con usuario que creó el albarán
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
    date: {
        type: Date,
        default: Date.now
    },
    // Datos de horas trabajadas
    workedHours: [WorkedHoursSchema],
    // Datos de materiales
    materials: [MaterialSchema],
    // Estado del albarán
    status: {
        type: String,
        enum: ['draft', 'pending', 'signed', 'cancelled'],
        default: 'draft'
    },
    // Firma del albarán
    signature: {
        image: {
            type: String  // URL a la imagen de firma en IPFS
        },
        date: {
            type: Date
        },
        signer: {
            type: String,
            trim: true
        }
    },
    // URL del PDF generado
    pdfUrl: {
        type: String
    },
    // Observaciones
    observations: {
        type: String,
        trim: true
    },
    // Total calculado
    totalAmount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    versionKey: false
});


// Plugin para soft delete
DeliveryNoteSchema.plugin(mongooseDelete, { overrideMethods: "all" });

module.exports = mongoose.model('DeliveryNote', DeliveryNoteSchema);