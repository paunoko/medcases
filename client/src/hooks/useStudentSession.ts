import { useEffect, useState, useRef, useCallback } from 'react';
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
    const [isJoining, setIsJoining] = useState(false);

    const initialRoom = getInitialStudentRoom();
    const [joinedRoomId, setJoinedRoomId] = useState<string | null>(initialRoom);
    const joinedRoomIdRef = useRef<string | null>(initialRoom);
    const pendingRoomIdRef = useRef<string | null>(null);
    const [activeSlide, setActiveSlide] = useState<StudentPayload | null>(null);
    const [isWaiting, setIsWaiting] = useState(false);

    const [hasAnswered, setHasAnswered] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            path: `${import.meta.env.BASE_URL}/socket.io`.replace('//', '/')
        });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(newSocket);

        newSocket.on('connect', () => { 
            setIsConnected(true); 
            // If we have an active room (e.g. from sessionStorage after refresh), rejoin immediately
            if (joinedRoomIdRef.current) {
                newSocket.emit('JOIN_ROOM', { roomId: joinedRoomIdRef.current });
            }
        });

        newSocket.on('disconnect', () => setIsConnected(false));

        const confirmJoin = (roomId: string) => {
            setIsJoining(false);
            setError(null);
            setJoinedRoomId(roomId);
            joinedRoomIdRef.current = roomId;
            pendingRoomIdRef.current = null;
            try { sessionStorage.setItem(STUDENT_ROOM_KEY, roomId); } catch { /* ignore */ }
        };

        newSocket.on('ROOM_JOINED', ({ roomId }: { roomId: string }) => {
            confirmJoin(roomId);
        });

        newSocket.on('ERROR', ({ code, message }: { code?: string; message?: string }) => {
            setIsJoining(false);
            pendingRoomIdRef.current = null;
            setError(code || message || 'Virhe');
            setJoinedRoomId(null);
            joinedRoomIdRef.current = null;
            try { sessionStorage.removeItem(STUDENT_ROOM_KEY); } catch { /* ignore */ }
        });

        newSocket.on('SLIDE_UPDATE', (payload: StudentPayload) => {
            if (pendingRoomIdRef.current) {
                confirmJoin(pendingRoomIdRef.current);
            }
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
            if (pendingRoomIdRef.current) {
                confirmJoin(pendingRoomIdRef.current);
            }
            setIsWaiting(true);
            setActiveSlide(null);
        });

        newSocket.on('ANSWER_RECEIVED', () => setHasAnswered(true));

        newSocket.on('SESSION_ENDED', () => {
            setIsJoining(false);
            setJoinedRoomId(null);
            joinedRoomIdRef.current = null;
            pendingRoomIdRef.current = null;
            setActiveSlide(null);
            setIsWaiting(false);
            setHasAnswered(false);
            try { sessionStorage.removeItem(STUDENT_ROOM_KEY); } catch { /* ignore */ }
        });

        return () => { newSocket.disconnect(); };
    }, []);

    const joinRoom = useCallback((roomId: string) => {
        if (!socket || !roomId) return;
        setError(null);
        setIsJoining(true);
        pendingRoomIdRef.current = roomId;
        socket.emit('JOIN_ROOM', { roomId });
    }, [socket]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const submitAnswer = (answer: string | string[]) => {
        if (!socket || !activeSlide || hasAnswered) return;
        socket.emit('SUBMIT_ANSWER', {
            roomId: joinedRoomId,
            slideId: activeSlide.slideId,
            answer
        });
    };

    return {
        isConnected,
        isJoining,
        joinedRoomId,
        activeSlide,
        isWaiting,
        hasAnswered,
        error,
        clearError,
        joinRoom,
        submitAnswer
    };
};
