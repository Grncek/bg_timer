import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_NODE_ENV !== "production";
const hostname = "localhost";
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
        if (activePlayer.remainingTime > 0) {
          activePlayer.remainingTime -= 1;
          io.emit("game-state", gameState);
        } else {
          // Time's up! Move to next player automatically or pause?
          // For now, let's just stay at 0.
        }
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

    socket.on("end-turn", () => {
      if (gameState.status === 'active' && gameState.activePlayerIndex !== null) {
        gameState.activePlayerIndex = (gameState.activePlayerIndex + 1) % gameState.players.length;
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
