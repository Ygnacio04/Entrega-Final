const mongoose = require('mongoose')

const dbConnect = () => {
    const db_uri = process.env.DB_URI
    mongoose.set('strictQuery', false)
    mongoose.connect(db_uri)
      .then(() => {
        console.log("Conectado a la BD")
      })
      .catch((err) => {
        console.log("No se ha podido establecer la conexión a la BD")
        process.exit(1);
      });
};

module.exports = dbConnect;