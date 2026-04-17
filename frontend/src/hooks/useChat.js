import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const useChat = (packageId) => {
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  const getCurrentUserId = () => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const u = JSON.parse(raw);
      return u?.id ?? u?.user_id ?? u?.userId ?? null;
    } catch {
      return null;
    }
  };

  const getSenderUserId = (m) => {
    // Support multiple backend field naming conventions
    return (
      m?.senderUserId ??
      m?.sender_user_id ??
      m?.senderId ??
      m?.sender_id ??
      m?.userId ??
      m?.user_id ??
      null
    );
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !packageId) return;

    // Initialize socket
    socketRef.current = io('/', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
      socket.emit('chat:join', { packageId });
      socket.emit('chat:history', { packageId });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('chat:history', (data) => {
      if (Number(data?.packageId) === Number(packageId)) {
        const userId = getCurrentUserId();

        const normalized = (data?.messages || []).map((m) => ({
          ...m,
          isSelf: userId ? Number(getSenderUserId(m)) === Number(userId) : false
        }));

        setMessages(normalized);
      }
    });

    socket.on('chat:message', (message) => {
      if (Number(message?.packageId) === Number(packageId)) {
        const userId = getCurrentUserId();

        const msg = {
          ...message,
          isSelf: userId ? Number(getSenderUserId(message)) === Number(userId) : false
        };

        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on('chat:error', (err) => {
      setError(err?.message || 'Chat error');
    });

    socket.on('chat:participants', (data) => {
      const list = data?.participants || data;
      setParticipants(list);
    });

    return () => {
      socket.disconnect();
    };
  }, [packageId]);

  const sendMessage = (text) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('chat:message', {
        packageId,
        body: text
      });
    }
  };

  return { messages, participants, sendMessage, connected, error };
};

export default useChat;
