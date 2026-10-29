import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { PatientCase, StudentPayload } from '../types';
import { createStudentPayload } from '../utils/sanitizer';

// Use relative path in production, localhost in dev
const SOCKET_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_SERVER_URL || 'http://localhost:3000');

export const TEACHER_SESSION_KEY = 'medcases_teacher_session';

interface StoredTeacherSession {
    roomId: string;
    teacherSecret: string;
    caseId: string;
}

export const useTeacherSession = (patientCase: PatientCase | null) => {
    const getInitialSavedSession = (): StoredTeacherSession | null => {
        if (!patientCase?.meta.id) return null;
        try {
            const raw = sessionStorage.getItem(TEACHER_SESSION_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (parsed && parsed.roomId && parsed.teacherSecret && parsed.caseId === patientCase.meta.id) {
                return parsed as StoredTeacherSession;
            }
        } catch {
            return null;
        }
        return null;
    };

    const savedSession = getInitialSavedSession();

    const [socket, setSocket] = useState<Socket | null>(null);
    const [roomId, setRoomId] = useState<string | null>(savedSession?.roomId || null);
    const [studentCount, setStudentCount] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [slideStates, setSlideStates] = useState<Record<string, 'ANSWERING' | 'REVEALED'>>({});
    const [openTextRevealed, setOpenTextRevealed] = useState<Record<string, boolean>>({});
    const [answers, setAnswers] = useState<any[]>([]);

    const currentSlide = patientCase?.slides[currentIndex];
    const slideState = currentSlide ? (slideStates[currentSlide.id] || 'ANSWERING') : 'ANSWERING';
    const isOpenTextRevealed = currentSlide ? !!openTextRevealed[currentSlide.id] : false;
    const isCurrentSlideRevealed = currentSlide?.type === 'OPEN_TEXT'
        ? isOpenTextRevealed
        : slideState === 'REVEALED';

    const socketRef = useRef<Socket | null>(null);
    const roomInfoRef = useRef<{ roomId: string, teacherSecret: string } | null>(
        savedSession ? { roomId: savedSession.roomId, teacherSecret: savedSession.teacherSecret } : null
    );

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
             setError(null);
             setRoomId(roomId);
             roomInfoRef.current = { roomId, teacherSecret };
             if (patientCase?.meta.id) {
                 try {
                     sessionStorage.setItem(TEACHER_SESSION_KEY, JSON.stringify({
                         roomId,
                         teacherSecret,
                         caseId: patientCase.meta.id
                     }));
                 } catch (e) {
                     console.error("Failed to persist teacher session", e);
                 }
             }
        });

        newSocket.on('TEACHER_RECONNECTED', ({ roomId, currentSlideId }: { roomId: string, currentSlideId?: string }) => {
             setError(null);
             setRoomId(roomId);
             if (currentSlideId && patientCase) {
                 const targetIdx = patientCase.slides.findIndex(s => s.id === currentSlideId);
                 if (targetIdx !== -1) {
                     setCurrentIndex(targetIdx);
                 }
             }
        });

        newSocket.on('STUDENT_COUNT', ({ count }) => setStudentCount(count));
        newSocket.on('ANSWERS_UPDATE', (updatedAnswers) => setAnswers(updatedAnswers));
        newSocket.on('ERROR', ({ message }: { message: string }) => {
             setError(message);
             try {
                 sessionStorage.removeItem(TEACHER_SESSION_KEY);
             } catch {}
             setRoomId(null);
             roomInfoRef.current = null;
        });

        return () => { newSocket.disconnect(); };
    }, [patientCase]);

    // Broadcast logic
    const broadcastCurrentSlide = useCallback(() => {
        if (!socketRef.current || !roomId || !patientCase) return;

        const currentSlide = patientCase.slides[currentIndex];
        const payload: StudentPayload = createStudentPayload(currentSlide, slideState);

        socketRef.current.emit('PUSH_UPDATE', { 
            roomId, 
            teacherSecret: roomInfoRef.current?.teacherSecret,
            payload 
        });
    }, [currentIndex, slideState, roomId, patientCase]);

    // React to state changes
    useEffect(() => {
        if (roomId) broadcastCurrentSlide();
    }, [currentIndex, slideState, roomId, broadcastCurrentSlide]);

    // Actions
    const createRoom = () => {
        setError(null);
        socketRef.current?.emit('CREATE_ROOM');
    };

    const nextSlide = () => {
        if (!patientCase) return;
        if (currentIndex < patientCase.slides.length - 1) {
            setCurrentIndex(p => p + 1);
        }
    };

    const prevSlide = () => {
        if (currentIndex > 0) {
            setCurrentIndex(p => p - 1);
        }
    };

    const revealAnswer = () => {
        if (!currentSlide) return;
        setSlideStates(prev => ({ ...prev, [currentSlide.id]: 'REVEALED' }));
    };

    const toggleOpenTextReveal = () => {
        if (!currentSlide) return;
        setOpenTextRevealed(prev => ({
            ...prev,
            [currentSlide.id]: !prev[currentSlide.id]
        }));
    };

    const endSession = () => {
        try {
            sessionStorage.removeItem(TEACHER_SESSION_KEY);
        } catch {}
        if (!socketRef.current || !roomId) return;
        socketRef.current.emit('END_SESSION', { roomId });
        setRoomId(null);
        roomInfoRef.current = null;
    };

    return {
        socket,
        roomId,
        studentCount,
        error,
        currentSlide,
        currentIndex,
        totalSlides: patientCase?.slides.length || 0,
        slideState,
        isOpenTextRevealed,
        isCurrentSlideRevealed,
        toggleOpenTextReveal,
        answers,
        createRoom,
        nextSlide,
        prevSlide,
        revealAnswer,
        endSession
    };
};