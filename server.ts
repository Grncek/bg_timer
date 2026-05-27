import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer);

  // Game state (simplified for now - stored in memory)
  let gameState = {
    players: [] as any[],
    activePlayerIndex: null as number | null,
    status: 'setup', // setup, active, paused
  };

  let timerInterval: NodeJS.Timeout | null = null;

  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (gameState.status === 'active' && gameState.activePlayerIndex !== null) {
        const activePlayer = gameState.players[gameState.activePlayerIndex];
        activePlayer.remainingTime -= 1;
        io.emit("game-state", gameState);
      }
    }, 1000);
  };

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.emit("game-state", gameState);

    socket.on("start-game", (players) => {
      gameState = {
        players: players.map((p: any) => ({ ...p, remainingTime: p.initialTime })),
        activePlayerIndex: 0,
        status: 'active',
      };
      startTimer();
      io.emit("game-state", gameState);
    });

    socket.on("pause-game", () => {
      if (gameState.status === 'active') {
        gameState.status = 'paused';
        io.emit("game-state", gameState);
      }
    });

    socket.on("resume-game", () => {
      if (gameState.status === 'paused') {
        gameState.status = 'active';
        io.emit("game-state", gameState);
      }
    });

    socket.on("adjust-time", ({ playerIndex, amount }) => {
      if (gameState.players[playerIndex]) {
        gameState.players[playerIndex].remainingTime += amount;
        io.emit("game-state", gameState);
      }
    });

    socket.on("end-turn", () => {
      if (gameState.status === 'active' && gameState.activePlayerIndex !== null) {
        gameState.activePlayerIndex = (gameState.activePlayerIndex + 1) % gameState.players.length;
        io.emit("game-state", gameState);
      }
    });

    socket.on("end-session", () => {
      if (timerInterval) clearInterval(timerInterval);
      gameState = {
        players: [],
        activePlayerIndex: null,
        status: 'setup',
      };
      io.emit("game-state", gameState);
    });

    socket.on("reorder-players", (newPlayers) => {
      if (gameState.status === 'setup') {
        // This is mainly for setup, but we'll handle it via socket if needed
        // For now, let's assume setup is client-side until "start-game"
      } else {
        gameState.players = newPlayers;
        io.emit("game-state", gameState);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
