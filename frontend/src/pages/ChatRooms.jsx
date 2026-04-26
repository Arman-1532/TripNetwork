import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, List, ChevronRight, AlertCircle } from 'lucide-react';
import io from 'socket.io-client';
import { api } from '../services/api';

const dedupeRoomsByPackageId = (rooms) => {
  const map = new Map();

  (Array.isArray(rooms) ? rooms : []).forEach((room) => {
    const id = Number(room?.packageId);
    if (!Number.isFinite(id)) return;

    if (!map.has(id)) {
      map.set(id, {
        ...room,
        packageId: id
      });
    }
  });

  return Array.from(map.values());
};

const ChatRoomsPage = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Keep the same socket auth/logic as public/chat.html: JWT via localStorage.token
  const socketRef = useRef(null);

  const token = useMemo(() => localStorage.getItem('token'), []);

  useEffect(() => {
    if (!token) {
      setError('Missing token. Login first.');
      setLoading(false);
      return;
    }

    socketRef.current = io('/', { auth: { token }, transports: ['websocket', 'polling'] });

    socketRef.current.on('connect_error', (err) => {
      setError(`Socket auth failed: ${err?.message || 'Unknown error'}`);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token]);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.chat.rooms();
        if (!res?.success) {
          setError(res?.message || 'Failed to load rooms');
          setRooms([]);
          return;
        }
        setRooms(dedupeRoomsByPackageId(res.data));
      } catch (e) {
        setError(e?.message || 'Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <MessageSquare className="text-primary" />
            Chat
          </h2>
          <p className="text-on-surface-variant">Select a room to chat about a package.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-error-container text-on-error-container rounded-2xl text-sm">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200/90 dark:border-slate-700 overflow-hidden shadow-2xl">
        <div className="px-8 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-violet-700 dark:text-violet-300">
            <List size={18} /> Rooms
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 rounded-2xl bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-sm text-on-surface-variant">No rooms available.</div>
          ) : (
            <div className="space-y-3">
              {rooms.map((r) => (
                <button
                  key={r.packageId}
                  onClick={() => navigate(`/chat/${r.packageId}`)}
                  className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-850 hover:shadow-md hover:border-primary/30 transition-all"
                >
                  <div className="text-left">
                    <div className="font-black text-slate-900 dark:text-slate-100 text-base md:text-lg tracking-tight">
                      <span className="inline-block mr-2 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-bold align-middle">
                        #{r.packageId}
                      </span>
                      {r.title}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">Open room</div>
                  </div>
                  <ChevronRight className="text-slate-500 dark:text-slate-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatRoomsPage;
