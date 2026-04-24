import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { PatientCase, StudentPayload } from '../types';
import { createStudentPayload } from '../utils/sanitizer';

// Use relative path in production, localhost in dev
const SOCKET_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_SERVER_URL || 'http://localhost:3000');

export const useTeacherSession = (patientCase: PatientCase | null) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [studentCount, setStudentCount] = useState(0);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [slideState, setSlideState] = useState<'ANSWERING' | 'LOCKED' | 'REVEALED'>('ANSWERING');
    const [answers, setAnswers] = useState<any[]>([]);

    const socketRef = useRef<Socket | null>(null);
    const roomInfoRef = useRef<{ roomId: string, teacherSecret: string } | null>(null);

    // Connection
    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            path: `${import.meta.env.BASE_URL}/socket.io`.replace('//', '/')
        });
        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
             // If we already have a room info, we are likely reconnecting.
             if (roomInfoRef.current) {
                 newSocket.emit('RECONNECT_TEACHER', roomInfoRef.current);
             }
        });

        newSocket.on('ROOM_CREATED', ({ roomId, teacherSecret }) => {
             setRoomId(roomId);
             roomInfoRef.current = { roomId, teacherSecret };
        });
        newSocket.on('STUDENT_COUNT', ({ count }) => setStudentCount(count));
        newSocket.on('ANSWERS_UPDATE', (updatedAnswers) => setAnswers(updatedAnswers));

        return () => { newSocket.disconnect(); };
    }, []);

    // Broadcast logic
    const broadcastCurrentSlide = useCallback(() => {
        if (!socketRef.current || !roomId || !patientCase) return;

        const currentSlide = patientCase.slides[currentIndex];
        const payload: StudentPayload = createStudentPayload(currentSlide, slideState);

        socketRef.current.emit('PUSH_UPDATE', { roomId, payload });
    }, [currentIndex, slideState, roomId, patientCase]);

    // React to state changes
    useEffect(() => {
        if (roomId) broadcastCurrentSlide();
    }, [currentIndex, slideState, roomId, broadcastCurrentSlide]);

    // Actions
    const createRoom = () => socketRef.current?.emit('CREATE_ROOM');

    const nextSlide = () => {
        if (!patientCase) return;
        if (currentIndex < patientCase.slides.length - 1) {
            setCurrentIndex(p => p + 1);
            setSlideState('ANSWERING');
        }
    };

    const prevSlide = () => {
        if (currentIndex > 0) {
            setCurrentIndex(p => p - 1);
            setSlideState('ANSWERING');
        }
    };

    const revealAnswer = () => setSlideState('REVEALED');

    const endSession = () => {
        if (!socketRef.current || !roomId) return;
        socketRef.current.emit('END_SESSION', { roomId });
    };

    return {
        socket,
        roomId,
        studentCount,
        currentSlide: patientCase?.slides[currentIndex],
        currentIndex,
        totalSlides: patientCase?.slides.length || 0,
        slideState,
        answers,
        createRoom,
        nextSlide,
        prevSlide,
        revealAnswer,
        endSession
    };
};