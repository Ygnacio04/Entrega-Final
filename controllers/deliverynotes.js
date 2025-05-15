const { matchedData } = require("express-validator");
const { deliveryNotesModel, projectsModel, clientsModel } = require("../models");
const { handleHttpError } = require("../utils/handleHttpError");
const PDFDocument = require("pdfkit");
const uploadToPinata = require("../utils/uploadToPinata");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

/**
 * Crear un nuevo albarán
 * @param {Object} req
 * @param {Object} res
 */
const createDeliveryNote = async (req, res) => {
    try {
        const user = req.user;
        const body = matchedData(req);

        // Construir consulta base para el proyecto
        const projectQuery = { _id: body.project, $or: [{createdBy: user._id}] };
        
        // Solo añadir filtro de compañía si el usuario tiene una
        if (user.company && user.company._id) {
            projectQuery.$or.push({company: user.company._id});
        }

        // Ver si el proyecto existe y pertenece al usuario o compañía
        const project = await projectsModel.findOne(projectQuery).populate('client');

        if (!project) {
            return handleHttpError(res, "PROJECT_NOT_FOUND", 404);
        }

        // Generar número de albarán automáticamente
        // Construir consulta para contar albaranes del usuario/compañía
        const countQuery = { $or: [{createdBy: user._id}] };
        
        // Solo añadir filtro de compañía si el usuario tiene una
        if (user.company && user.company._id) {
            countQuery.$or.push({company: user.company._id});
        }
        
        const count = await deliveryNotesModel.countDocuments(countQuery);
        
        // Formato: ALB-YYYY-NNNN
        const year = new Date().getFullYear();
        const number = `ALB-${year}-${String(count + 1).padStart(4, '0')}`;

        // Crear albarán
        const deliveryNote = await deliveryNotesModel.create({
            ...body,
            number,
            createdBy: user._id,
            company: user.company?._id,
            totalAmount: calculateTotal(body.workedHours, body.materials)
        });

        // Devolver el albarán
        const populatedDeliveryNote = await deliveryNotesModel.findById(deliveryNote._id)
            .populate({
                path: 'project',
                populate: {
                    path: 'client'
                }
            })
            .populate('createdBy', 'firstName lastName email company')
            .populate('company', 'company');

        res.status(201).send({ deliveryNote: populatedDeliveryNote });
    } catch (error) {
        console.log(error);
        handleHttpError(res, "ERROR_CREATE_DELIVERY_NOTE");
    }
};

/**
 * Obtener todos los albaranes del usuario o compañía
 * @param {Object} req
 * @param {Object} res
 */
const getDeliveryNotes = async (req, res) => {
    try {
        const user = req.user;
        const { projectId, clientId, status } = req.query;

        // Construir consulta base
        const query = { $or: [{createdBy: user._id}] };
        
        // Solo añadir filtro de compañía si el usuario tiene una
        if (user.company && user.company._id) {
            query.$or.push({company: user.company._id});
        }

        // Filtrar por proyecto
        if (projectId) {
            query.project = projectId;
        }

        // Filtrar por estado
        if (status) {
            query.status = status;
        }

        // Filtrar por clientId
        if (clientId) {
            // Construir consulta para proyectos del cliente
            const projectQuery = { client: clientId, $or: [{createdBy: user._id}] };
            
            // Solo añadir filtro de compañía si el usuario tiene una
            if (user.company && user.company._id) {
                projectQuery.$or.push({company: user.company._id});
            }
            
            const projects = await projectsModel.find(projectQuery);
            
            // Añadir los proyectos a la consulta
            if (projects.length > 0) {
                const projectIds = projects.map(p => p._id);
                query.project = { $in: projectIds };
            } else {
                // Si no hay proyectos devolver array vacío
                return res.send({ deliveryNotes: [] });
            }
        }

        // Obtener albaranes con populate
        const deliveryNotes = await deliveryNotesModel.find(query)
            .populate({
                path: 'project',
                populate: {
                    path: 'client'
                }
            })
            .populate('createdBy', 'firstName lastName email company')
            .populate('company', 'company')
            .sort({ createdAt: -1 });

        res.send({ deliveryNotes });
    } catch (error) {
        console.log(error);
        handleHttpError(res, "ERROR_GET_DELIVERY_NOTES");
    }
};


/**
 * Obtener un albarán por ID
 * @param {Object} req
 * @param {Object} res
 */
const getDeliveryNote = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // Construir consulta base
        const query = { _id: id, $or: [{createdBy: user._id}] };
        
        // Solo añadir filtro de compañía si el usuario tiene una
        if (user.company && user.company._id) {
            query.$or.push({company: user.company._id});
        }

        // Buscar albarán por ID con la consulta optimizada
        const deliveryNote = await deliveryNotesModel.findOne(query)
        .populate({
            path: 'project',
            populate: {
                path: 'client'
            }
        })
        .populate('createdBy', 'firstName lastName email company')
        .populate('company', 'company');

        if (!deliveryNote) {
            return handleHttpError(res, "DELIVERY_NOTE_NOT_FOUND", 404);
        }

        res.send({ deliveryNote });
    } catch (error) {
        console.log(error);
        handleHttpError(res, "ERROR_GET_DELIVERY_NOTE");
    }
};

/**
 * Actualizar un albarán
 * @param {Object} req
 * @param {Object} res
 */
const updateDeliveryNote = async (req, res) => {
    try {
        const { id } = req.params;
        const body = matchedData(req);
        const user = req.user;

        // Construir consulta base
        const query = { _id: id, $or: [{createdBy: user._id}] };
        
        // Solo añadir filtro de compañía si el usuario tiene una
        if (user.company && user.company._id) {
            query.$or.push({company: user.company._id});
        }

        // Verificar que el albarán existe y pertenece al usuario o compañía
        const deliveryNoteExists = await deliveryNotesModel.findOne(query);

        if (!deliveryNoteExists) {
            return handleHttpError(res, "DELIVERY_NOTE_NOT_FOUND", 404);
        }

        // No permitir actualizar un albarán firmado
        if (deliveryNoteExists.status === 'signed') {
            return handleHttpError(res, "CANNOT_UPDATE_SIGNED_DELIVERY_NOTE", 400);
        }

        // Si se está actualizando el proyecto, verificar que existe y pertenece al usuario/compañía
        if (body.project) {
            // Construir consulta para el proyecto
            const projectQuery = { _id: body.project, $or: [{createdBy: user._id}] };
            
            // Solo añadir filtro de compañía si el usuario tiene una
            if (user.company && user.company._id) {
                projectQuery.$or.push({company: user.company._id});
            }

            const project = await projectsModel.findOne(projectQuery);

            if (!project) {
                return handleHttpError(res, "PROJECT_NOT_FOUND", 404);
            }
        }

        // Actualizar el total si se actualizan los datos de horas o materiales
        if (body.workedHours || body.materials) {
            const workedHours = body.workedHours || deliveryNoteExists.workedHours;
            const materials = body.materials || deliveryNoteExists.materials;
            body.totalAmount = calculateTotal(workedHours, materials);
        }

        // Actualizar albarán
        const deliveryNote = await deliveryNotesModel.findByIdAndUpdate(
            id,
            body,
            { new: true }
        )
        .populate({
            path: 'project',
            populate: {
                path: 'client'
            }
        })
        .populate('createdBy', 'firstName lastName email company')
        .populate('company', 'company');

        res.send({ deliveryNote });
    } catch (error) {
        console.log(error);
        handleHttpError(res, "ERROR_UPDATE_DELIVERY_NOTE");
    }
};

/**
 * Obtener albaranes archivados
 * @param {Object} req
 * @param {Object} res
 */
/**
 * Obtener albaranes archivados
 * @param {Object} req
 * @param {Object} res
 */
const getArchivedDeliveryNotes = async (req, res) => {
    try {
        const user = req.user;
        const { projectId, clientId, status } = req.query;

        // Construir consulta base (sin incluir deleted: true porque usaremos findWithDeleted)
        const query = { $or: [{createdBy: user._id}] };
        
        // Solo añadir filtro de compañía si el usuario tiene una
        if (user.company && user.company._id) {
            query.$or.push({company: user.company._id});
        }
        
        // Filtrar por proyecto
        if (projectId) {
            query.project = projectId;
        }

        // Filtrar por estado
        if (status) {
            query.status = status;
        }

        // Filtrar por clientId
        if (clientId) {
            // Construir consulta para proyectos del cliente
            const projectQuery = { client: clientId, $or: [{createdBy: user._id}] };
            
            // Solo añadir filtro de compañía si el usuario tiene una
            if (user.company && user.company._id) {
                projectQuery.$or.push({company: user.company._id});
            }
            
            const projects = await projectsModel.find(projectQuery);
            
            if (projects.length > 0) {
                const projectIds = projects.map(p => p._id);
                query.project = { $in: projectIds };
            } else {
                return res.send({ deliveryNotes: [] });
            }
        }

        // Obtener TODOS los albaranes (incluidos los eliminados)
        // y luego filtrar manualmente los que tienen deleted=true
        const allDeliveryNotes = await deliveryNotesModel.findWithDeleted(query)
            .populate({
                path: 'project',
                populate: {
                    path: 'client'
                }
            })
            .populate('createdBy', 'firstName lastName email company')
            .populate('company', 'company')
            .sort({ createdAt: -1 });

        // Filtrar solo los documentos con deleted=true
        const archivedDeliveryNotes = allDeliveryNotes.filter(note => note.deleted === true);
        
        console.log(`Total de albaranes encontrados: ${allDeliveryNotes.length}`);
        console.log(`Albaranes archivados: ${archivedDeliveryNotes.length}`);
        
        // Verificar explícitamente los documentos
        allDeliveryNotes.forEach(note => {
            console.log(`ID: ${note._id}, deleted: ${note.deleted}, deletedAt: ${note.deletedAt}`);
        });

        res.send({ deliveryNotes: archivedDeliveryNotes });
    } catch (error) {
        console.log(error);
        handleHttpError(res, "ERROR_GET_ARCHIVED_DELIVERY_NOTES");
    }
};


/**
 * Restaurar un albarán archivado
 * @param {Object} req
 * @param {Object} res
 */
const restoreDeliveryNote = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // Construir consulta base
        const query = { _id: id, $or: [{createdBy: user._id}] };
        
        // Solo añadir filtro de compañía si el usuario tiene una
        if (user.company && user.company._id) {
            query.$or.push({company: user.company._id});
        }

        // Verificar que el albarán archivado existe y pertenece al usuario o su compañía
        const deliveryNote = await deliveryNotesModel.findOneDeleted(query);

        if (!deliveryNote) {
            return handleHttpError(res, "ARCHIVED_DELIVERY_NOTE_NOT_FOUND", 404);
        }
        // Intentar restaurar usando el método del plugin
        await deliveryNotesModel.restore({ _id: id });
        
        // Verificar explícitamente que ya no está en los documentos eliminados
        const stillDeleted = await deliveryNotesModel.findOneDeleted({ _id: id });
        
        if (stillDeleted) {
            console.log("¡Alerta! El documento sigue marcado como eliminado después de restaurar");
            
            // Intento alternativo: actualizar directamente los campos de borrado
            await deliveryNotesModel.updateOne(
                { _id: id },
                { 
                    $set: { deleted: false },
                    $unset: { deletedAt: "" }
                }
            );
            
            // Verificar nuevamente
            const stillDeletedAfterUpdate = await deliveryNotesModel.findOneDeleted({ _id: id });
            if (stillDeletedAfterUpdate) {
                return handleHttpError(res, "ERROR_RESTORE_DELIVERY_NOTE", 500);
            }
        }
        
        // Obtener el albarán restaurado
        const restoredDeliveryNote = await deliveryNotesModel.findById(id)
            .populate({
                path: 'project',
                populate: {
                    path: 'client'
                }
            })
            .populate('createdBy', 'firstName lastName email company')
            .populate('company', 'company');

        console.log("Estado después de restaurar:", {
            id: restoredDeliveryNote._id,
            deleted: restoredDeliveryNote.deleted,
        });

        res.send({ 
            deliveryNote: restoredDeliveryNote, 
            message: "DELIVERY_NOTE_RESTORED" 
        });
    } catch (error) {
        console.log("Error completo en restoreDeliveryNote:", error);
        handleHttpError(res, "ERROR_RESTORE_DELIVERY_NOTE");
    }
};


/**
 * Eliminar un albarán
 * @param {Object} req
 * @param {Object} res
 */
const deleteDeliveryNote = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const { hard } = req.query;

        // Construir consulta base
        const query = { _id: id, $or: [{createdBy: user._id}] };
        
        // Solo añadir filtro de compañía si el usuario tiene una
        if (user.company && user.company._id) {
            query.$or.push({company: user.company._id});
        }

        // Verificar que el albarán existe
        const deliveryNote = await deliveryNotesModel.findOne(query);

        if (!deliveryNote) {
            return handleHttpError(res, "DELIVERY_NOTE_NOT_FOUND", 404);
        }

        // No permitir eliminar un albarán firmado
        if (deliveryNote.status === 'signed') {
            return handleHttpError(res, "CANNOT_DELETE_SIGNED_DELIVERY_NOTE", 400);
        }

        // Realizar soft delete o hard delete
        if (hard === 'true') {
            await deliveryNotesModel.deleteOne({ _id: id });
            res.send({ message: "DELIVERY_NOTE_DELETED_PERMANENTLY" });
        } else {
            await deliveryNotesModel.delete({ _id: id });
            res.send({ message: "DELIVERY_NOTE_ARCHIVED" });
        }
    } catch (error) {
        console.log(error);
        handleHttpError(res, "ERROR_DELETE_DELIVERY_NOTE");
    }
};

/**
 * Firmar un albarán
 * @param {Object} req
 * @param {Object} res
 */
const signDeliveryNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { signer } = req.body;
        const user = req.user;

        if (!req.file) {
            return handleHttpError(res, "NO_SIGNATURE_PROVIDED", 400);
        }

        // Construir consulta base
        const query = { _id: id, $or: [{createdBy: user._id}] };
        
        // Solo añadir filtro de compañía si el usuario tiene una
        if (user.company && user.company._id) {
            query.$or.push({company: user.company._id});
        }

        // Verificar que el albarán existe
        const deliveryNote = await deliveryNotesModel.findOne(query);

        if (!deliveryNote) {
            return handleHttpError(res, "DELIVERY_NOTE_NOT_FOUND", 404);
        }

        // Verificar que el albarán no esté ya firmado
        if (deliveryNote.status === 'signed') {
            return handleHttpError(res, "DELIVERY_NOTE_ALREADY_SIGNED", 400);
        }

        // Subir la firma a IPFS via Pinata
        const buffer = req.file.buffer;
        const originalname = req.file.originalname;
        const file = {
            buffer: buffer,
            originalname: originalname
        };
        
        const { IpfsHash } = await uploadToPinata(file, originalname);
        const signatureUrl = `https://${process.env.PINATA_GATEWAY}/ipfs/${IpfsHash}`;

        // Actualizar el albarán con la firma
        const updatedDeliveryNote = await deliveryNotesModel.findByIdAndUpdate(
            id,
            {
                status: 'signed',
                signature: {
                    image: signatureUrl,
                    date: new Date(),
                    signer: signer || 'Cliente'
                }
            },
            { new: true }
        )
        .populate({
            path: 'project',
            populate: {
                path: 'client'
            }
        })
        .populate('createdBy', 'firstName lastName email company')
        .populate('company', 'company');

        // Generar PDF y subirlo a IPFS
        await generateAndUploadPdf(updatedDeliveryNote);

        res.send({ 
            deliveryNote: updatedDeliveryNote,
            message: "DELIVERY_NOTE_SIGNED_SUCCESSFULLY" 
        });
    } catch (error) {
        console.log(error);
        handleHttpError(res, "ERROR_SIGNING_DELIVERY_NOTE");
    }
};

/**
 * Generar y descargar el PDF de un albarán
 * @param {Object} req
 * @param {Object} res
 */
const getDeliveryNotePdf = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const format = req.query.format || 'auto'; // Formato de respuesta: pdf, json o auto (default)

        // Construir consulta base
        const query = { _id: id, $or: [{createdBy: user._id}] };
        
        // Solo añadir filtro de compañía si el usuario tiene una
        if (user.company && user.company._id) {
            query.$or.push({company: user.company._id});
        }

        // Verificar que el albarán existe
        const deliveryNote = await deliveryNotesModel.findOne(query)
        .populate({
            path: 'project',
            populate: {
                path: 'client'
            }
        })
        .populate('createdBy', 'firstName lastName email company')
        .populate('company', 'company');

        if (!deliveryNote) {
            return handleHttpError(res, "DELIVERY_NOTE_NOT_FOUND", 404);
        }

        // Si el albarán ya tiene un PDF cargado en IPFS
        if (deliveryNote.pdfUrl) {            
            // Si se solicita formato JSON o estamos en un cliente que probablemente no maneje redirecciones (auto)
            if (format === 'json' || (format === 'auto' && req.get('User-Agent')?.includes('PostmanRuntime') || req.get('User-Agent')?.includes('Visual Studio Code'))) {
                return res.json({
                    message: "PDF disponible en IPFS",
                    pdfUrl: deliveryNote.pdfUrl,
                    number: deliveryNote.number,
                    status: deliveryNote.status
                });
            }
            
            // Si se solicita formato PDF o es un navegador (formato auto)
            return res.redirect(deliveryNote.pdfUrl);
        }

        // Si se solicita formato JSON pero no hay PDF en IPFS
        if (format === 'json') {
            return res.json({
                message: "No hay PDF almacenado en IPFS para este albarán",
                status: deliveryNote.status
            });
        }

        // Si no tiene PDF, generamos uno en tiempo real
        console.log("Generando PDF en tiempo real para albarán sin PDF en IPFS");
        const doc = new PDFDocument({ margin: 50 });
        
        // Configurar la respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=albaran-${deliveryNote.number}.pdf`);
        
        doc.pipe(res);
        
        // Generar contenido del PDF
        generatePdfContent(doc, deliveryNote);
        
        // Finalizar el documento
        doc.end();
    } catch (error) {
        console.log(error);
        handleHttpError(res, "ERROR_GET_DELIVERY_NOTE_PDF");
    }
};

/**
 * Función auxiliar para calcular el total de un albarán
 * @param {Array} workedHours 
 * @param {Array} materials 
 * @returns {Number} total
 */
const calculateTotal = (workedHours = [], materials = []) => {
    let total = 0;
    
    // Calcular total de horas trabajadas
    if (workedHours && workedHours.length > 0) {
        total += workedHours.reduce((sum, entry) => sum + (entry.hours * (entry.hourlyRate || 0)), 0);
    }
    
    // Calcular total de materiales
    if (materials && materials.length > 0) {
        total += materials.reduce((sum, material) => sum + (material.quantity * (material.price || 0)), 0);
    }
    
    return total;
};


/**
 * Función auxiliar para generar el contenido del PDF
 * @param {PDFDocument} doc 
 * @param {Object} deliveryNote 
 */
const generatePdfContent = (doc, deliveryNote) => {
    // Encabezado con datos de la empresa
    const company = deliveryNote.company?.company || deliveryNote.createdBy?.company || {};
    const companyName = company.name || 'Empresa';
    const companyAddress = company.address || {};
    
    // Datos del cliente
    const client = deliveryNote.project?.client || {};
    const clientName = client.name || 'Cliente';
    const clientAddress = client.address || {};
    
    // Datos del proyecto
    const project = deliveryNote.project || {};
    const projectName = project.name || 'Proyecto';
    
    // Configurar el documento
    doc.font('Helvetica-Bold')
       .fontSize(18)
       .text('ALBARÁN', { align: 'center' })
       .moveDown();
    
    doc.fontSize(12)
       .text(`Número: ${deliveryNote.number}`, { align: 'right' })
       .text(`Fecha: ${new Date(deliveryNote.date).toLocaleDateString()}`, { align: 'right' })
       .moveDown(0.5);
    
    // Información de la empresa
    doc.font('Helvetica-Bold')
       .text('EMPRESA:')
       .font('Helvetica')
       .text(companyName)
       .text(`${companyAddress.street || ''} ${companyAddress.number || ''}, ${companyAddress.postal || ''} ${companyAddress.city || ''}`)
       .moveDown();
    
    // Información del cliente
    doc.font('Helvetica-Bold')
       .text('CLIENTE:')
       .font('Helvetica')
       .text(clientName)
       .text(`${clientAddress.street || ''} ${clientAddress.number || ''}, ${clientAddress.postal || ''} ${clientAddress.city || ''}`)
       .text(`NIF: ${client.nif || ''}`)
       .moveDown();
    
    // Información del proyecto
    doc.font('Helvetica-Bold')
       .text('PROYECTO:')
       .font('Helvetica')
       .text(projectName)
       .text(project.description || '')
       .moveDown(1.5);
    
    // Tabla de horas trabajadas
    if (deliveryNote.workedHours && deliveryNote.workedHours.length > 0) {
        doc.font('Helvetica-Bold')
           .text('HORAS TRABAJADAS:', { underline: true })
           .moveDown(0.5);
        
        // Encabezados de columna
        const workedHoursTableTop = doc.y;
        doc.font('Helvetica-Bold')
           .text('Persona', 50, workedHoursTableTop)
           .text('Fecha', 180, workedHoursTableTop)
           .text('Horas', 280, workedHoursTableTop)
           .text('Precio/Hora', 350, workedHoursTableTop)
           .text('Subtotal', 450, workedHoursTableTop)
           .moveDown();
        
        // Filas de datos
        let y = doc.y;
        deliveryNote.workedHours.forEach(entry => {
            doc.font('Helvetica')
               .text(entry.person, 50, y)
               .text(new Date(entry.date).toLocaleDateString(), 180, y)
               .text(entry.hours.toString(), 280, y)
               .text(`${entry.hourlyRate || 0}€`, 350, y)
               .text(`${(entry.hours * (entry.hourlyRate || 0)).toFixed(2)}€`, 450, y);
            y += 20;
        });
        
        doc.moveDown(1.5);
    }
    
    // Tabla de materiales
    if (deliveryNote.materials && deliveryNote.materials.length > 0) {
        doc.font('Helvetica-Bold')
           .text('MATERIALES:', { underline: true })
           .moveDown(0.5);
        
        // Encabezados de columna
        const materialsTableTop = doc.y;
        doc.font('Helvetica-Bold')
           .text('Material', 50, materialsTableTop)
           .text('Cantidad', 280, materialsTableTop)
           .text('Precio', 350, materialsTableTop)
           .text('Subtotal', 450, materialsTableTop)
           .moveDown();
        
        // Filas de datos
        let y = doc.y;
        deliveryNote.materials.forEach(material => {
            doc.font('Helvetica')
               .text(material.name, 50, y)
               .text(material.quantity.toString(), 280, y)
               .text(`${material.price || 0}€`, 350, y)
               .text(`${(material.quantity * (material.price || 0)).toFixed(2)}€`, 450, y);
            y += 20;
        });
        
        doc.moveDown(1.5);
    }
    
    // Total
    doc.font('Helvetica-Bold')
       .text(`TOTAL: ${deliveryNote.totalAmount.toFixed(2)}€`, { align: 'right' })
       .moveDown(2);
    
    // Observaciones
    if (deliveryNote.observations) {
        doc.font('Helvetica-Bold')
           .text('OBSERVACIONES:')
           .font('Helvetica')
           .text(deliveryNote.observations)
           .moveDown(2);
    }
    
    // Firma si está firmado
    if (deliveryNote.status === 'signed' && deliveryNote.signature) {
        doc.font('Helvetica-Bold')
           .text('FIRMADO POR:')
           .font('Helvetica')
           .text(deliveryNote.signature.signer)
           .text(`Fecha: ${new Date(deliveryNote.signature.date).toLocaleDateString()}`);
        
        // Añadir imagen de firma si existe
        if (deliveryNote.signature.image) {
            try {
                // Usar una posición relativa para la firma
                const currentY = doc.y + 10;
                
                // Intentar cargar y mostrar la imagen de la firma
                doc.image(deliveryNote.signature.image, {
                    fit: [200, 100],
                    align: 'center',
                    valign: 'center'
                });
                
                console.log(`Firma insertada desde URL: ${deliveryNote.signature.image}`);
            } catch (error) {
                console.error(`Error al insertar imagen de firma: ${error.message}`);
                
                // Si falla la carga de la imagen, mostrar texto alternativo
                doc.moveDown(0.5)
                   .text('(Firmado electrónicamente)', { align: 'center' });
            }
        }
    } else {
        // Espacio para firma si no está firmado
        doc.moveDown()
           .font('Helvetica-Bold')
           .text('FIRMA DEL CLIENTE:')
           .moveDown(5)
           .font('Helvetica')
           .text('___________________________', { align: 'center' });
    }
};

/**
 * Función auxiliar para generar y subir un PDF a IPFS
 * @param {Object} deliveryNote 
 */
const generateAndUploadPdf = async (deliveryNote) => {
    try {
        console.log("Iniciando generación y carga de PDF para albarán:", deliveryNote._id);
        
        // Crear directorio temporal si no existe
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempFilePath = path.join(tempDir, `${uuidv4()}-albaran-${deliveryNote.number}.pdf`);
        
        // Crear el PDF
        const doc = new PDFDocument({ margin: 50 });
        const writeStream = fs.createWriteStream(tempFilePath);

        // Utilizar la misma función generatePdfContent para mantener consistencia
        // Esperar a que el PDF se genere completamente
        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
            doc.pipe(writeStream);
            
            // Generar el contenido del PDF usando la misma función que se usa para la visualización
            generatePdfContent(doc, deliveryNote);
            
            doc.end();
        });
                
        // Leer el archivo para subir a IPFS
        const fileBuffer = fs.readFileSync(tempFilePath);
        const file = {
            buffer: fileBuffer,
            originalname: `albaran-${deliveryNote.number}.pdf`
        };
        
        // Subir a IPFS 
        const pinataResult = await uploadToPinata(file, file.originalname);        
        if (!pinataResult || !pinataResult.IpfsHash) {
            throw new Error("No se pudo obtener el hash IPFS de Pinata");
        }
        
        const pdfUrl = `https://${process.env.PINATA_GATEWAY}/ipfs/${pinataResult.IpfsHash}`;
        
        // Actualizar el albarán con la URL del PDF
        const updatedDeliveryNote = await deliveryNotesModel.findByIdAndUpdate(
            deliveryNote._id,
            { pdfUrl: pdfUrl },
            { new: true }
        );
        
        try {
            fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
            // Ignorar errores al limpiar archivos temporales
        }
        
        return pdfUrl;
    } catch (error) {
        console.error('Error generando y subiendo PDF:', error);
        throw error;
    }
};

module.exports = {
    createDeliveryNote,
    getDeliveryNotes,
    getDeliveryNote,
    updateDeliveryNote,
    deleteDeliveryNote,
    signDeliveryNote,
    getDeliveryNotePdf,
    getArchivedDeliveryNotes,
    restoreDeliveryNote
};