"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useSession, signOut } from "next-auth/react";
import { 
  Play, SkipForward, Users, Clock, Plus, Trash2, LogOut, 
  Pause, ChevronUp, ChevronDown, GripVertical 
} from "lucide-react";
import { Reorder, motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { data: session } = useSession();
  const { 
    gameState, startGame, pauseGame, resumeGame, 
    adjustTime, endTurn, endSession, reorderPlayers 
  } = useSocket();
  const [newPlayerName, setNewPlayerName] = useState("");
  const [initialTimeMins, setInitialTimeMins] = useState<number | "">(30);
  const [players, setPlayers] = useState<{ name: string; id: string }[]>([]);
  const [customAdjustMins, setCustomAdjustMins] = useState(5);

  // Automatically add the logged-in user as a player if they exist
  useEffect(() => {
    if (session?.user?.name && players.length === 0) {
      setPlayers([{ name: session.user.name, id: "session-user" }]);
    }
  }, [session]);

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      setPlayers([...players, { name: newPlayerName, id: Math.random().toString(36).substr(2, 9) }]);
      setNewPlayerName("");
    }
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const movePlayerInList = (list: any[], fromIndex: number, toIndex: number) => {
    const newList = [...list];
    const [movedItem] = newList.splice(fromIndex, 1);
    newList.splice(toIndex, 0, movedItem);
    return newList;
  };

  const handleStartGame = () => {
    if (players.length > 0) {
      const timeInSeconds = (typeof initialTimeMins === 'number' ? initialTimeMins : 0) * 60;
      startGame(players.map(p => ({ ...p, initialTime: timeInSeconds })));
    }
  };

  const handleInGameReorder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < gameState.players.length) {
      const newPlayers = movePlayerInList(gameState.players, index, targetIndex);
      reorderPlayers(newPlayers);
    }
  };

  // Helper to format time (handles negative)
  const formatTime = (seconds: number) => {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    return `${isNegative ? '-' : ''}${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!gameState || gameState.status === 'setup') {
    return (
      <main className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-8 text-blue-400">Board Game Timer</h1>

        <div className="w-full max-w-md flex justify-end mb-4 h-10">
          {session && (
            <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
              <span className="text-sm text-slate-300">Hello, <span className="text-blue-400 font-semibold">{session.user?.name}</span></span>
              <button onClick={() => signOut()} className="text-slate-500 hover:text-red-400 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
        
        <div className="w-full max-w-md bg-slate-800 p-6 rounded-xl shadow-xl border border-slate-700">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Default Time (minutes)</label>
            <div className="flex items-center gap-2">
              <Clock className="text-slate-400" size={20} />
              <input
                type="number"
                value={initialTimeMins}
                onChange={(e) => setInitialTimeMins(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Minutes..."
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Add Players</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                placeholder="Player name"
                className="bg-slate-700 border border-slate-600 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={addPlayer}
                className="bg-blue-600 hover:bg-blue-500 p-2 rounded transition-colors"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>

          <Reorder.Group 
            axis="y" 
            values={players} 
            onReorder={setPlayers}
            className="space-y-2 mb-8"
          >
            {players.map((p, idx) => (
              <Reorder.Item 
                key={p.id} 
                value={p}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex justify-between items-center bg-slate-700 p-3 rounded border border-slate-600 cursor-grab active:cursor-grabbing hover:border-slate-500 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <GripVertical size={18} className="text-slate-500" />
                  <Users size={18} className="text-slate-400" />
                  <span>{p.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <button onClick={() => setPlayers(movePlayerInList(players, idx, Math.max(0, idx - 1)))} disabled={idx === 0} className="text-slate-500 hover:text-white disabled:opacity-0"><ChevronUp size={14}/></button>
                    <button onClick={() => setPlayers(movePlayerInList(players, idx, Math.min(players.length - 1, idx + 1)))} disabled={idx === players.length - 1} className="text-slate-500 hover:text-white disabled:opacity-0"><ChevronDown size={14}/></button>
                  </div>
                  <button onClick={() => removePlayer(p.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 size={18} />
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          <button
            onClick={handleStartGame}
            disabled={players.length === 0}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            <Play fill="currentColor" size={24} /> Start Game
          </button>
        </div>
      </main>
    );
  }

  const isPaused = gameState.status === 'paused';

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Game in Progress</h2>
          {isPaused && (
            <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-yellow-500/30">
              Paused
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1 rounded-lg border border-slate-600">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Adjust Step</span>
            <input 
              type="number" 
              value={customAdjustMins} 
              onChange={(e) => setCustomAdjustMins(parseInt(e.target.value) || 0)}
              className="w-12 bg-transparent text-center text-sm font-bold focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 uppercase font-bold">min</span>
          </div>
          <button 
            onClick={endSession}
            className="text-xs text-red-400 hover:text-red-300 border border-red-400/30 px-3 py-1 rounded transition-colors"
          >
            End Session
          </button>
          {session && (
            <div className="flex items-center gap-2 text-sm text-slate-400 border-l border-slate-700 pl-4">
              <span>{session.user?.name}</span>
              <button onClick={() => signOut()} title="Sign Out">
                <LogOut size={16} className="hover:text-red-400 transition-colors" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        <Reorder.Group 
          axis="y" 
          values={gameState.players} 
          onReorder={reorderPlayers}
          className="w-full max-w-lg space-y-4"
        >
          {gameState.players.map((p: any, idx: number) => {
            const isActive = idx === gameState.activePlayerIndex;
            const isOvertime = p.remainingTime < 0;
            return (
              <Reorder.Item 
                key={p.name + idx} // Using a combination as key for reorder stability
                value={p}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 cursor-grab active:cursor-grabbing ${
                  isActive 
                  ? isOvertime ? 'bg-red-900/40 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-blue-900/40 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-105' 
                  : 'bg-slate-800 border-slate-700 opacity-60'
                }`}
              >
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <GripVertical size={24} className="text-slate-600" />
                    <div className="flex flex-col">
                      <button onClick={() => handleInGameReorder(idx, 'up')} disabled={idx === 0} className="text-slate-500 hover:text-white disabled:opacity-0"><ChevronUp size={20}/></button>
                      <button onClick={() => handleInGameReorder(idx, 'down')} disabled={idx === gameState.players.length - 1} className="text-slate-500 hover:text-white disabled:opacity-0"><ChevronDown size={20}/></button>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Player {idx + 1}</div>
                    <div className="text-2xl font-bold">{p.name}</div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => adjustTime(idx, customAdjustMins * 60)} className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded">+{customAdjustMins}m</button>
                      <button onClick={() => adjustTime(idx, -customAdjustMins * 60)} className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded">-{customAdjustMins}m</button>
                    </div>
                  </div>
                  
                  <div className={`text-4xl font-mono font-bold ${isActive ? (isOvertime ? 'text-red-400' : 'text-blue-400') : 'text-slate-300'}`}>
                    {formatTime(p.remainingTime)}
                  </div>
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>

      <div className="p-6 bg-slate-800 border-t border-slate-700 flex gap-4">
        <button
          onClick={isPaused ? resumeGame : pauseGame}
          className={`flex-1 ${isPaused ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-slate-700 hover:bg-slate-600'} py-6 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all`}
        >
          {isPaused ? <Play fill="currentColor" /> : <Pause fill="currentColor" />}
          {isPaused ? 'RESUME' : 'PAUSE'}
        </button>
        
        <button
          onClick={endTurn}
          disabled={isPaused}
          className="flex-[2] bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed py-6 rounded-2xl font-black text-2xl flex items-center justify-center gap-4 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.4)]"
        >
          <SkipForward fill="currentColor" size={32} /> NEXT PLAYER
        </button>
      </div>
    </main>
  );
}
