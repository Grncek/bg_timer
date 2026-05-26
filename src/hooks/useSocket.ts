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

  const endTurn = () => {
    socket?.emit("end-turn");
  };

  return { socket, gameState, startGame, endTurn };
};
