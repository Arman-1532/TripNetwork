import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

// Parse JWT payload without a library.
function parseJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// Resolve the current user's numeric ID from localStorage once.
// Priority: JWT payload id → stored user object fields.
function resolveCurrentUserId() {
  try {
    const token = localStorage.getItem('token');
    const payload = token ? parseJwtPayload(token) : null;

    // JWT typically stores the PK as `id`; fall back to common aliases.
    const fromJwt = payload?.id ?? payload?.user_id ?? payload?.userId ?? payload?.sub;
    if (fromJwt != null) return String(fromJwt);

    const raw = localStorage.getItem('user');
    const u = raw ? JSON.parse(raw) : null;
    const fromStore = u?.id ?? u?.user_id ?? u?.userId ?? u?.uid;
    if (fromStore != null) return String(fromStore);
  } catch {
    // ignore
  }
  return null;
}

// Normalize any field name the server might use for the sender's PK.
function getSenderId(msg) {
  const raw =
    msg?.senderUserId ??
    msg?.sender_user_id ??
    msg?.senderId ??
    msg?.sender_id ??
    msg?.userId ??
    msg?.user_id;
  return raw != null ? String(raw) : null;
}

const useChat = (packageId) => {
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  // Resolve once per hook mount — the user doesn't change mid-session.
  const currentUserIdRef = useRef(resolveCurrentUserId());

  const isSelf = (msg) => {
    const myId = currentUserIdRef.current;
    const senderId = getSenderId(msg);
    if (myId && senderId) return myId === senderId;
    return false;
  };

  const tagMessage = (msg) => ({ ...msg, isSelf: isSelf(msg) });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !packageId) return;

    // Re-resolve in case localStorage was updated after initial render.
    currentUserIdRef.current = resolveCurrentUserId();

    socketRef.current = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
      socket.emit('chat:join', { packageId });
      socket.emit('chat:history', { packageId });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('chat:history', (data) => {
      if (Number(data?.packageId) !== Number(packageId)) return;
      setMessages((data?.messages || []).map(tagMessage));
    });

    socket.on('chat:message', (msg) => {
      if (Number(msg?.packageId) !== Number(packageId)) return;
      setMessages((prev) => [...prev, tagMessage(msg)]);
    });

    socket.on('chat:error', (err) => setError(err?.message || 'Chat error'));

    socket.on('chat:participants', (data) => {
      setParticipants(data?.participants || data);
    });

    return () => socket.disconnect();
  }, [packageId]);

  const sendMessage = (text) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('chat:message', { packageId, body: text });
    }
  };

  return { messages, participants, sendMessage, connected, error };
};

export default useChat;