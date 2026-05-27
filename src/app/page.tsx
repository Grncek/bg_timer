"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useSession, signOut, signIn } from "next-auth/react";
import { Play, SkipForward, Users, Clock, Plus, Trash2, LogOut, LogIn } from "lucide-react";

export default function Home() {
  const { data: session } = useSession();
  const { gameState, startGame, endTurn } = useSocket();
  const [newPlayerName, setNewPlayerName] = useState("");
  const [initialTime, setInitialTime] = useState(600); // 10 minutes default
  const [players, setPlayers] = useState<{ name: string; id: string }[]>([]);

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

  const handleStartGame = () => {
    if (players.length > 0) {
      startGame(players.map(p => ({ ...p, initialTime })));
    }
  };

  // Helper to format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!gameState || gameState.status === 'setup') {
    return (
      <main className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-8 text-blue-400">Board Game Timer</h1>

        <div className="w-full max-w-md flex justify-end mb-4">
          {session ? (
            <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
              <span className="text-sm text-slate-300">Hello, <span className="text-blue-400 font-semibold">{session.user?.name}</span></span>
              <button onClick={() => signOut()} className="text-slate-500 hover:text-red-400 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signIn()} 
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-full border border-slate-700 transition-colors text-sm"
            >
              <LogIn size={18} /> Sign In
            </button>
          )}
        </div>
        
        <div className="w-full max-w-md bg-slate-800 p-6 rounded-xl shadow-xl border border-slate-700">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Default Time (seconds)</label>
            <div className="flex items-center gap-2">
              <Clock className="text-slate-400" size={20} />
              <input
                type="number"
                value={initialTime}
                onChange={(e) => setInitialTime(parseInt(e.target.value))}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <div className="space-y-2 mb-8">
            {players.map((p) => (
              <div key={p.id} className="flex justify-between items-center bg-slate-700 p-3 rounded border border-slate-600">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-slate-400" />
                  <span>{p.name}</span>
                </div>
                <button onClick={() => removePlayer(p.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

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

  const activePlayer = gameState.players[gameState.activePlayerIndex];

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
        <h2 className="text-xl font-bold">Game in Progress</h2>
        <div className="flex items-center gap-4">
          {session && (
            <div className="flex items-center gap-2 text-sm text-slate-400 border-r border-slate-700 pr-4 mr-2">
              <span>{session.user?.name}</span>
              <button onClick={() => signOut()} title="Sign Out">
                <LogOut size={16} className="hover:text-red-400 transition-colors" />
              </button>
            </div>
          )}
          <div className="text-slate-400 text-sm">Room: Global</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        <div className="w-full max-w-lg space-y-4">
          {gameState.players.map((p: any, idx: number) => {
            const isActive = idx === gameState.activePlayerIndex;
            return (
              <div 
                key={idx}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                  isActive 
                  ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-105' 
                  : 'bg-slate-800 border-slate-700 opacity-60'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Player {idx + 1}</div>
                    <div className="text-2xl font-bold">{p.name}</div>
                  </div>
                  <div className={`text-4xl font-mono font-bold ${isActive ? 'text-blue-400' : 'text-slate-300'}`}>
                    {formatTime(p.remainingTime)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-8 pb-12 bg-slate-800 border-t border-slate-700">
        <button
          onClick={endTurn}
          className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 py-8 rounded-3xl font-black text-3xl flex items-center justify-center gap-4 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.4)]"
        >
          <SkipForward fill="currentColor" size={40} /> END TURN
        </button>
      </div>
    </main>
  );
}
