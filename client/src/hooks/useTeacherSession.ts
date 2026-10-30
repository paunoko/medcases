import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { PatientCase, StudentPayload, StudentAnswer } from '../types';
import { createStudentPayload } from '../utils/sanitizer';

// Use relative path in production, localhost in dev
const SOCKET_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_SERVER_URL || 'http://localhost:3000');

export const TEACHER_SESSION_KEY = 'medcases_teacher_session';

interface StoredTeacherSession {
    roomId: string;
    teacherSecret: string;
    caseId: string;
}

export const useTeacherSession = (initialCase: PatientCase | null) => {
    const [patientCase, setPatientCase] = useState<PatientCase | null>(initialCase);
    const patientCaseRef = useRef<PatientCase | null>(initialCase);
    useEffect(() => {
        patientCaseRef.current = patientCase;
    }, [patientCase]);

    const getInitialSavedSession = (): StoredTeacherSession | null => {
        if (!initialCase?.meta.id) return null;
        try {
            const raw = sessionStorage.getItem(TEACHER_SESSION_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (parsed && parsed.roomId && parsed.teacherSecret && parsed.caseId === initialCase.meta.id) {
                return parsed as StoredTeacherSession;
            }
        } catch {
            return null;
        }
        return null;
    };

    const savedSession = getInitialSavedSession();

    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [roomId, setRoomId] = useState<string | null>(savedSession?.roomId || null);
    const [studentCount, setStudentCount] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [slideStates, setSlideStates] = useState<Record<string, 'ANSWERING' | 'REVEALED'>>({});
    const [openTextRevealed, setOpenTextRevealed] = useState<Record<string, boolean>>({});
    const [answers, setAnswers] = useState<StudentAnswer[]>([]);

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

    // Connection - runs on mount, auto-connects and auto-creates room if not yet created
    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            path: `${import.meta.env.BASE_URL}/socket.io`.replace('//', '/')
        });
        socketRef.current = newSocket;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(newSocket);

        newSocket.on('connect', () => {
             setIsConnected(true);
             setError(null);
             // Reconnect if room info exists in session storage, otherwise auto-create room
             if (roomInfoRef.current) {
                 newSocket.emit('RECONNECT_TEACHER', roomInfoRef.current);
             } else {
                 newSocket.emit('CREATE_ROOM');
             }
        });

        newSocket.on('disconnect', () => {
             setIsConnected(false);
        });

        newSocket.on('ROOM_CREATED', ({ roomId, teacherSecret }) => {
             setError(null);
             setRoomId(roomId);
             roomInfoRef.current = { roomId, teacherSecret };
             const activeCase = patientCaseRef.current;
             if (activeCase?.meta.id) {
                 try {
                     sessionStorage.setItem(TEACHER_SESSION_KEY, JSON.stringify({
                         roomId,
                         teacherSecret,
                         caseId: activeCase.meta.id
                     }));
                 } catch (e) {
                     console.error("Failed to persist teacher session", e);
                 }
             }
        });

        newSocket.on('TEACHER_RECONNECTED', ({ roomId, currentSlideId }: { roomId: string, currentSlideId?: string }) => {
             setError(null);
             setRoomId(roomId);
             const activeCase = patientCaseRef.current;
             if (currentSlideId && activeCase) {
                 const targetIdx = activeCase.slides.findIndex(s => s.id === currentSlideId);
                 if (targetIdx !== -1) {
                     setCurrentIndex(targetIdx);
                 }
             }
        });

        newSocket.on('STUDENT_COUNT', ({ count }: { count: number }) => setStudentCount(count));
        newSocket.on('ANSWERS_UPDATE', (updatedAnswers: StudentAnswer[]) => setAnswers(updatedAnswers));
        newSocket.on('ERROR', ({ code, message }: { code?: string; message?: string }) => {
             setError(code || message || 'Virhe');
             try {
                 sessionStorage.removeItem(TEACHER_SESSION_KEY);
             } catch {
                 /* ignore */
             }
             setRoomId(null);
             roomInfoRef.current = null;
        });

        return () => { newSocket.disconnect(); };
    }, []);

    // Broadcast logic
    const broadcastCurrentSlide = useCallback(() => {
        if (!socketRef.current || !roomId || !patientCase) return;

        const currentSlide = patientCase.slides[currentIndex];
        if (!currentSlide) return;
        const payload: StudentPayload = createStudentPayload(currentSlide, slideState);

        socketRef.current.emit('PUSH_UPDATE', { 
            roomId, 
            teacherSecret: roomInfoRef.current?.teacherSecret,
            payload 
        });
    }, [currentIndex, slideState, roomId, patientCase]);

    // React to state changes
    useEffect(() => {
        if (roomId && patientCase) broadcastCurrentSlide();
    }, [currentIndex, slideState, roomId, patientCase, broadcastCurrentSlide]);

    // Actions
    const createRoom = () => {
        setError(null);
        socketRef.current?.emit('CREATE_ROOM');
    };

    const switchCase = (newCase: PatientCase) => {
        setPatientCase(newCase);
        patientCaseRef.current = newCase;
        setCurrentIndex(0);
        setSlideStates({});
        setOpenTextRevealed({});
        setAnswers([]);
        setError(null);

        if (roomId && roomInfoRef.current) {
            try {
                sessionStorage.setItem(TEACHER_SESSION_KEY, JSON.stringify({
                    roomId,
                    teacherSecret: roomInfoRef.current.teacherSecret,
                    caseId: newCase.meta.id
                }));
            } catch (e) {
                console.error("Failed to update teacher session storage", e);
            }
            socketRef.current?.emit('CLEAR_ROOM_ANSWERS', { roomId });
        }
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
        } catch {
            /* ignore */
        }
        if (!socketRef.current || !roomId) return;
        socketRef.current.emit('END_SESSION', { roomId });
        setRoomId(null);
        roomInfoRef.current = null;
    };

    return {
        socket,
        isConnected,
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
        switchCase,
        nextSlide,
        prevSlide,
        revealAnswer,
        endSession
    };
};