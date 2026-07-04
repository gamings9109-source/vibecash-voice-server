const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = {};

app.get("/", (req, res) => {
  res.send("VibeCash Voice Server Running");
});

wss.on("connection", (ws) => {

  ws.roomId = null;
  ws.userId = null;

  ws.on("message", (message) => {

    try {

      const data = JSON.parse(message.toString());

      if (data.type === "join") {

        ws.roomId = data.roomId;
        ws.userId = data.userId;

        if (!rooms[ws.roomId]) {
          rooms[ws.roomId] = [];
        }

        rooms[ws.roomId].push(ws);

        ws.send(JSON.stringify({
          type: "joined",
          roomId: ws.roomId
        }));

        return;
      }

      if (data.type === "chat") {

        const users = rooms[ws.roomId] || [];

        users.forEach(client => {

          if (client !== ws &&
              client.readyState === WebSocket.OPEN) {

            client.send(JSON.stringify({
              type: "chat",
              userId: ws.userId,
              message: data.message
            }));

          }

        });

      }

    } catch (e) {
      console.log(e);
    }

  });

  ws.on("close", () => {

    if (ws.roomId && rooms[ws.roomId]) {

      rooms[ws.roomId] =
      rooms[ws.roomId].filter(c => c !== ws);

      if (rooms[ws.roomId].length === 0) {
        delete rooms[ws.roomId];
      }

    }

  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Voice Server Started : " + PORT);
});
