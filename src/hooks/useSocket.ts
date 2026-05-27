"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    const socketInstance = io();

    socketInstance.on("connect", () => {
      console.log("Connected to server");
    });

    socketInstance.on("game-state", (state) => {
      setGameState(state);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const startGame = (players: any[]) => {
    socket?.emit("start-game", players);
  };

  const pauseGame = () => {
    socket?.emit("pause-game");
  };

  const resumeGame = () => {
    socket?.emit("resume-game");
  };

  const adjustTime = (playerIndex: number, amount: number) => {
    socket?.emit("adjust-time", { playerIndex, amount });
  };

  const endTurn = () => {
    socket?.emit("end-turn");
  };

  const endSession = () => {
    socket?.emit("end-session");
  };

  const reorderPlayers = (newPlayers: any[]) => {
    socket?.emit("reorder-players", newPlayers);
  };

  return { socket, gameState, startGame, pauseGame, resumeGame, adjustTime, endTurn, endSession, reorderPlayers };
};
