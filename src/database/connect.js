const mongoose = require('mongoose')

function connect() {
    mongoose.connect(process.env.MONGODB_URL)
    .then(console.log('Connected to database'))
    .catch(err => console.log('Erro: '+err))
}

module.exports = connect
