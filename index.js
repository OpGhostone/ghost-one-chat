const dotenv = require('dotenv')
dotenv.config()
const connectDatabase = require('./src/database/connect')
connectDatabase()
require('./server')
