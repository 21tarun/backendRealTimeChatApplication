const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose')
const app = express();
require("dotenv").config();
const userModel = require("./model/userModel")
// const path = require("path");

const PORT = 5000;
const userRoutes = require("./routes/userRoutes");

////////////////////// Socket.io Connection \\\\\\\\\\\\\\\\\\\\\\\\\\
const socket = require("socket.io");

app.use(cors());

app.use(express.json());
app.use("/api/auth", userRoutes);
app.use("/api/messages", userRoutes);

mongoose.connect("mongodb+srv://tarun21:tarun1616@cluster0.h0l8mir.mongodb.net/realtimechat",
    { useNewUrlParser: true, useUnifiedTopology: true }
).then(() => {
    console.log("DataBase Connected Succesfully !");
}).catch((err) => {
    console.log(err);
})

const server = app.listen(PORT, () => {
    console.log(`Server Running on ${PORT}`)
})


/////////////////////// Socket Operation \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//----> creating connection with server
const io = socket(server, {
    cors: {
        origin: process.env.BASE_URL,
        credentials: true,
    },
});

global.onlineUsers = new Map();

const users = {};
//-->Whenever our server is connected to socket io 

io.on("connection", (socket) => {


    global.chatSocket = socket;
    //-->For online status
    const iD = socket.handshake.auth.token;


    //-->Catching custom event "add-user"
    socket.on("add-user", (userId) => {
        onlineUsers.set(userId, socket.id);
    });

    //-->Catching custom event "send-msg"
    socket.on("send-msg", (data) => {
        console.log("user connected");
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit("msg-recieve", data.message);
        }
    });

    socket.on("disconnect", async () => {
        
        if (iD == undefined) {
            return console.log("error")
        }

        await userModel.findByIdAndUpdate({ _id: iD }, { $set: { Online: false } });
        delete users[socket.id];
        console.log("user disconnected");
        //-->Broadcasting Offline User 
        socket.broadcast.emit("getOfflineUser", { user_id: iD });
    })
   

});
