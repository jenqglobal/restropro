import { useState, useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { Bell, X } from 'lucide-react';
import { getSocket } from './socket';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'kot' | 'alert';
  time: string;
  read: boolean;
}

interface NotifState {
  notifs: Notification[];
  unread: number;
  addNotif: (n: Omit<Notification, 'id' | 'time' | 'read'>) => void;
  markRead: (id: string) => void;
  clear: () => void;
}

export const useNotifs = create<NotifState>((set) => ({
  notifs: [],
  unread: 0,
  addNotif: (n) => set((s) => ({
    notifs: [{ ...n, id: Date.now().toString(), time: new Date().toLocaleTimeString(), read: false }, ...s.notifs].slice(0, 20),
    unread: s.unread + 1,
  })),
  markRead: (id) => set((s) => ({ notifs: s.notifs.map((n) => n.id === id ? { ...n, read: true } : n), unread: Math.max(0, s.unread - 1) })),
  clear: () => set({ notifs: [], unread: 0 }),
}));

const playSound = (type: string) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    // Different tones for different notification types
    const freqs: Record<string, number> = { order: 880, kot: 660, alert: 440 };
    osc.frequency.value = freqs[type] || 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
};

export function useSocketNotifs() {
  const addNotif = useNotifs((s) => s.addNotif);
  
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewOrder = (order: any) => {
      addNotif({ type: 'order', title: 'New Order', message: `Order #${order.orderNumber || 'N/A'}` });
      playSound('order');
    };

    const handleNewKot = (order: any) => {
      addNotif({ type: 'kot', title: 'New KOT', message: `KOT for Order #${order.orderNumber || 'N/A'}` });
      playSound('kot');
    };

    socket.on('new-order', handleNewOrder);
    socket.on('new-kot', handleNewKot);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('new-kot', handleNewKot);
    };
  }, [addNotif]);
}

// Notification Bell Component
export function NotifBell() {
  const { notifs, unread, markRead } = useNotifs();
  const [open, setOpen] = useState(false);
  
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
        <Bell size={20} />
        {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          <div className="p-3 border-b border-slate-100 font-medium text-slate-800 flex justify-between">
            <span>Notifications</span>
            <button onClick={() => setOpen(false)}><X size={16}/></button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? <div className="p-4 text-slate-400 text-center text-sm">No notifications</div> : 
              notifs.map((n) => (
                <div key={n.id} onClick={() => markRead(n.id)} className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 ${!n.read ? 'bg-indigo-50' : ''}`}>
                  <div className="text-sm font-medium text-slate-800">{n.title}</div>
                  <div className="text-xs text-slate-500">{n.message}</div>
                  <div className="text-xs text-slate-400 mt-1">{n.time}</div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}