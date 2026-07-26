const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const rooms = {};

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ roomId, name }) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerName = name || "玩家";

    if (!rooms[roomId]) rooms[roomId] = {};

    rooms[roomId][socket.id] = {
      id: socket.id,
      name: socket.playerName,
      x: 200,
      y: 200
    };

    io.to(roomId).emit("playersUpdate", rooms[roomId]);
  });

 socket.on("move", ({ x, y }) => {
  const roomId = socket.roomId;
  const player = rooms[roomId]?.[socket.id];

  if (!player) return;

  // 确保收到的坐标是数字
  x = Number(x);
  y = Number(y);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return;
  }

  // 服务器限制地图范围
  player.x = Math.max(20, Math.min(780, x));
  player.y = Math.max(20, Math.min(480, y));

  // 把服务器确认后的坐标广播给所有玩家
  io.to(roomId).emit("playersUpdate", rooms[roomId]);
});

  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;

    delete rooms[roomId][socket.id];
    io.to(roomId).emit("playersUpdate", rooms[roomId]);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`服务器启动: http://localhost:${PORT}`);
});