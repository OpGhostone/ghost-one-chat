// DEPENDENCIES AND MIDDLEWARES

const express = require('express')
const app = express()
const http = require('http').createServer(app)
const port = process.env.PORT
const io = require('socket.io')(http, {
    cors: {
        origin: `${process.env.BASE_URL}:${port}`
    }
})
const session = require('express-session')
const MongoStore = require('connect-mongo')
const UserModel = require('./src/models/user.model')
const MessageModel = require('./src/models/message.model')
const bcrypt = require('bcrypt')

app.set('view engine', 'ejs')
app.set('views', './src/views')

const sessionMiddleware = session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'sessionID',
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URL
    })
})

app.use(express.urlencoded({extended: false}))
app.use(sessionMiddleware)


// REAL TIME CHAT


io.use((socket, next) => sessionMiddleware(socket.request, {}, next))
io.on('connect', async socket => {
    const author = await UserModel.findById(socket.request.session.userID)
    const date = new Date().toJSON()

    socket.broadcast.emit('message', {author: author.username, date: date, content: ' ', connectionState: ' CONNECTED'})
    await MessageModel.create({author: author.username, date: date, content: ' ', connectionState: ' CONNECTED'})

    socket.on('disconnect', async () => {
        io.emit('message', {author: author.username, date: date, content: ' ', connectionState: ' DISCONNECTED'})
        await MessageModel.create({author: author.username, date: date, content: ' ', connectionState: ' DISCONNECTED'})
    })

    const previewMessages = await MessageModel.find({})
    socket.emit('previewMessages', previewMessages)
    socket.on('message', async content => {
        io.emit('message', {author: author.username, date: date, content: content})
        await MessageModel.create({author: author.username, date: date, content: content})
    })
})


// GET ROUTES


app.get('/', (req, res) => res.render('index'))

app.get('/login', (req, res) => res.render('login'))

app.get('/register', (req, res) => res.render('register'))

app.get('/chat', (req, res) => {
    if (req.session.userID) res.render('chat')
    else res.redirect('/login')
})

app.get('/profile', async (req, res) => {
    if (req.session.userID) {
        const user = await UserModel.findById(req.session.userID)
        return res.render('profile', {username: user.username, description: user.description})
    }
    else res.redirect('/login')
})

app.get('/profile/:username', async (req, res) => {
    const user = await UserModel.findOne({username: req.params.username})
    res.render('user', {username: user.username, description: user.description})
})


// POST ROUTES


app.post('/register', async (req, res) => {
    const user = req.body
    if (await UserModel.findOne({username: user.username})) {
        return res.send('Usuário já existe!')
    }
    let userData = {
        username: user.username,
        hashPassword: await bcrypt.hash(user.hashPassword, 10)
    }
    if (user.description) {
        userData = Object.assign(userData, {description: user.description})
    }
    UserModel.create(userData)
    res.redirect('/login')
})

app.post('/login', async (req, res) => {
    const body = req.body
    const user = await UserModel.findOne({username: body.username})
    if (user != null && await bcrypt.compare(body.hashPassword, user.hashPassword)) {
        req.session.regenerate(err => {
            if (err) console.log('Error: '+err)
            req.session.userID = user._id
            res.redirect('/profile')
        })
    }
    else res.send('Credenciais inválidas!')
})

app.post('/profile', async (req, res) => {
    const edit = req.body
    const userID = req.session.userID
    const user = await UserModel.findById(userID)
    if (await bcrypt.compare(edit.currentlyPassword, user.hashPassword)) {
        if (edit.username) await UserModel.findByIdAndUpdate(userID, {username: edit.username})
        if (edit.password) await UserModel.findByIdAndUpdate(userID, {hashPassword: bcrypt.hash(edit.password, 10)})
        if (edit.description) await UserModel.findByIdAndUpdate(userID, {description: edit.description})
        res.redirect('profile')
    }
    else res.send('Senha incorreta')
})

http.listen(port, () => console.log('Server listening in '+port))
