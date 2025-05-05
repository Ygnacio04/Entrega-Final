const models = {
    usersModel: require('./nosql/users'),
    clientsModel: require('./nosql/clients'),
    projectsModel: require('./nosql/projects'),
    deliveryNotesModel: require('./nosql/deliverynotes'),

}

module.exports = models;