import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { StudentPayload } from '../types';

const SOCKET_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_SERVER_URL || 'http://localhost:3000');
const STUDENT_ROOM_KEY = 'medcases_student_room';

const getInitialStudentRoom = (): string | null => {
    try {
        if (typeof sessionStorage !== 'undefined') {
            return sessionStorage.getItem(STUDENT_ROOM_KEY);
        }
    } catch {
        return null;
    }
    return null;
};

export const useStudentSession = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const initialRoom = getInitialStudentRoom();
    const [joinedRoomId, setJoinedRoomId] = useState<string | null>(initialRoom);
    const joinedRoomIdRef = useRef<string | null>(initialRoom);
    const [activeSlide, setActiveSlide] = useState<StudentPayload | null>(null);
    const [isWaiting, setIsWaiting] = useState(false);

    const [hasAnswered, setHasAnswered] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            path: `${import.meta.env.BASE_URL}/socket.io`.replace('//', '/')
        });
        setSocket(newSocket);

        newSocket.on('connect', () => { 
            setIsConnected(true); 
            setError(null); 
            // If we have an active room (e.g. from sessionStorage after refresh), rejoin immediately
            if (joinedRoomIdRef.current) {
                newSocket.emit('JOIN_ROOM', { roomId: joinedRoomIdRef.current });
            }
        });

        newSocket.on('disconnect', () => setIsConnected(false));

        newSocket.on('ERROR', ({ code, message }: { code?: string; message?: string }) => {
            setError(code || message || 'Virhe');
            setJoinedRoomId(null);
            joinedRoomIdRef.current = null;
            try { sessionStorage.removeItem(STUDENT_ROOM_KEY); } catch {}
        });

        newSocket.on('SLIDE_UPDATE', (payload: StudentPayload) => {
            setIsWaiting(false);
            setActiveSlide((prev) => {
                // Reset answer state only if the slide actually changes
                if (prev?.slideId !== payload.slideId) {
                    setHasAnswered(false);
                }
                return payload;
            });
        });

        newSocket.on('WAITING_FOR_TEACHER', () => {
            setIsWaiting(true);
            setActiveSlide(null);
        });

        newSocket.on('ANSWER_RECEIVED', () => setHasAnswered(true));

        newSocket.on('SESSION_ENDED', () => {
            setJoinedRoomId(null);
            joinedRoomIdRef.current = null;
            setActiveSlide(null);
            setIsWaiting(false);
            setHasAnswered(false);
            try { sessionStorage.removeItem(STUDENT_ROOM_KEY); } catch {}
        });

        return () => { newSocket.disconnect(); };
    }, []);

    const joinRoom = (roomId: string) => {
        if (!socket) return;
        socket.emit('JOIN_ROOM', { roomId });
        setJoinedRoomId(roomId);
        joinedRoomIdRef.current = roomId;
        try { sessionStorage.setItem(STUDENT_ROOM_KEY, roomId); } catch {}
    };

    const submitAnswer = (answer: string | string[]) => {
        if (!socket || !activeSlide || hasAnswered) return;
        socket.emit('SUBMIT_ANSWER', {
            roomId: joinedRoomId,
            slideId: activeSlide.slideId,
            answer
        });
    };

    return { isConnected, error, joinedRoomId, activeSlide, isWaiting, hasAnswered, joinRoom, submitAnswer };
};
