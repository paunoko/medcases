import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { StudentPayload } from '../types';

const SOCKET_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_SERVER_URL || 'http://localhost:3000');

export const useStudentSession = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);
    const [activeSlide, setActiveSlide] = useState<StudentPayload | null>(null);
    const [isWaiting, setIsWaiting] = useState(false);

    const [hasAnswered, setHasAnswered] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            path: `${import.meta.env.BASE_URL}/socket.io`.replace('//', '/')
        });
        setSocket(newSocket);

        newSocket.on('connect', () => { setIsConnected(true); setError(null); });
        newSocket.on('disconnect', () => setIsConnected(false));

        newSocket.on('ERROR', ({ message }) => {
            setError(message);
            setJoinedRoomId(null);
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
            setActiveSlide(null);
            setIsWaiting(false);
            setHasAnswered(false);
        });

        return () => { newSocket.disconnect(); };
    }, []);

    const joinRoom = (roomId: string) => {
        if (!socket) return;
        socket.emit('JOIN_ROOM', { roomId });
        setJoinedRoomId(roomId);
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