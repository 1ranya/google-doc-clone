
const mongoose = require ('mongoose')
const Document = require ('./Document')

// Mongoose setup
mongoose.connect("mongodb://localhost:27017/google-doc-clone")
const defaultValue = ""
const io = require ('socket.io')(3001, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
})

io.on("connection", (socket) => {
    console.log("connected")
    socket.on('get-document', async documentId => {
        const document = await findOrCreateDocument(documentId)
        socket.join(documentId) // Create a roomm where everyone having this doc id is able the exchange
        socket.emit("load-document", document.data) // send data when the doc first load 
        socket.on('send-changes', delta => {
            console.log(delta)
            socket.broadcast.to(documentId).emit('receive-changes', delta)
        })
        socket.on('save-document', async data =>{
            await Document.findByIdAndUpdate(documentId, {data})
        })
    })
})

findOrCreateDocument = async(id) => {
    if (id == null) return 
    const document = await Document.findById(id)
    if(document) return document 
    return await Document.create({ _id: id, data: defaultValue })
}
