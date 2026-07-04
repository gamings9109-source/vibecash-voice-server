const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const rooms = {};

app.get("/", (req, res) => {
  res.send("VibeCash Voice Server Running");
});

io.on("connection", (socket) => {

  console.log("User Connected: " + socket.id);

  socket.on("join", (data) => {

    socket.join(data.roomId);

    socket.roomId = data.roomId;
    socket.userId = data.userId;

    if (!rooms[data.roomId]) {
      rooms[data.roomId] = {};
    }

    rooms[data.roomId][socket.id] = data.userId;

    socket.emit("joined", {
      roomId: data.roomId
    });

    socket.to(data.roomId).emit("user_joined", {
      userId: data.userId
    });

  });

  socket.on("chat", (data) => {

    socket.to(socket.roomId).emit("chat", {
      userId: socket.userId,
      message: data.message
    });

  });

  socket.on("voice", (buffer) => {

    socket.to(socket.roomId).emit("voice", buffer);

  });

  socket.on("disconnect", () => {

    console.log("Disconnected");

    if (socket.roomId && rooms[socket.roomId]) {

      delete rooms[socket.roomId][socket.id];

      socket.to(socket.roomId).emit("user_left", {
        userId: socket.userId
      });

      if (Object.keys(rooms[socket.roomId]).length === 0) {
        delete rooms[socket.roomId];
      }

    }

  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Voice Server Started on " + PORT);
});
