const http = require("http");
const express = require("express");
const socketIo = require("socket.io");
const moment = require("moment");
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://54.89.60.230","*"],
    methods: ["GET", "POST"],
  },
});
require("dotenv").config({ path: "./.env" });

/*----------------------Middle Ware--------------------*/ app.use(
  "/assets",
  express.static(__dirname + "/assets")
);
// app.use(express.static("public"));
/*----------------------Middle Ware--------------------*/ let users = new Map();
let messages = [];

function addUsers(details) {
  const { socketId } = details;
  if (users.has(socketId)) return;
  else return users.set(socketId, {});
}

function deleteUsers(details) {
  const { socketId } = details;
  if (users.has(socketId)) return users.delete(socketId);
  return;
}

function editUsers(details) {
  const { userId, userName, roomId } = details;
  if (users.has(userId)) return users.set(userId, { userName, roomId });
  return;
}

function sendGroupMessages(details) {
  const { message, userId } = details;
  console.log(userId, users);
  const { roomId, userName } = users.get(userId);
  const time = moment(new Date()).calendar();
  messages.push({ message, userName, userId, time });
  return io.to(roomId).emit("chatMessages", messages);
}

io.on("connection", (socket) => {
  const socketId = socket.id;
  addUsers({ socketId });
  socket.emit("userId", socketId);
  socket.on("join", (room) => socket.join(room));
  socket.on("sendMessage", (data) => sendGroupMessages(data));
  socket.on("userDetails", (data) => editUsers(data));
  socket.on("currentMesage", () => {
    socket.emit("currentChats", messages);
  });
  socket.emit("chatMessages", messages);
  socket.on("disconnect", () => deleteUsers({ socketId }));
});

io.on("error", () => console.log("error"));
server.listen(process.env.PORT, () => console.log("Server connected Success"));
