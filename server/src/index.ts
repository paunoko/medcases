import express from 'express';
import http from 'http';
import path from 'path';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { RoomState, StudentAnswer, BroadcastPayload } from './types';

// Initialize Express and Socket.io
const app = express();
const CLIENT_URL = process.env.CLIENT_URL;
const ALLOWED_ORIGINS = CLIENT_URL ? [CLIENT_URL] : ["http://localhost:5173", "http://127.0.0.1:5173"];
const BASE_PATH = process.env.BASE_PATH || '/';

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
  path: path.join(BASE_PATH, 'socket.io'),
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// --- IN-MEMORY DATABASE ---
// Since we don't use a database, we save everything in this Map.
const rooms = new Map<string, RoomState>();

// Mapping of socket.id -> roomId for quick lookup on disconnect
const socketToRoom = new Map<string, string>();

// Utility: Create a 4-digit room code (e.g., "3821")
const generateRoomCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

io.on('connection', (socket: Socket) => {
  console.log(`[Connect] Socket ID: ${socket.id}`);

  // --- 1. TEACHER ACTIONS ---

  socket.on('CREATE_ROOM', () => {
    let roomId = generateRoomCode();
    // Ensure uniqueness (unlikely to hit exactly the same, but safe limits)
    while (rooms.has(roomId)) {
      roomId = generateRoomCode();
    }

    const teacherSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Initialize room state
    const newRoom: RoomState = {
      roomId,
      teacherSocketId: socket.id,
      teacherSecret,
      currentPayload: null,
      answers: [],
      studentCount: 0
    };

    rooms.set(roomId, newRoom);
    socketToRoom.set(socket.id, roomId);
    socket.join(roomId); // Socket.io "room"

    console.log(`[Room Created] ID: ${roomId} by Teacher: ${socket.id}`);
    socket.emit('ROOM_CREATED', { roomId, teacherSecret });
  });

  socket.on('RECONNECT_TEACHER', ({ roomId, teacherSecret }: { roomId: string, teacherSecret: string }) => {
    const room = rooms.get(roomId);
    if (!room || room.teacherSecret !== teacherSecret) {
      socket.emit('ERROR', { message: 'Invalid reconnect credentials.' });
      return;
    }
    
    console.log(`[Reconnect] Teacher safely reconnected for room ${roomId}`);
    if (room.disconnectTimer) {
      clearTimeout(room.disconnectTimer);
      room.disconnectTimer = null;
    }
    
    // Update active socket
    room.teacherSocketId = socket.id;
    socketToRoom.set(socket.id, roomId);
    socket.join(roomId);

    // Send latest student count in case it changed
    socket.emit('STUDENT_COUNT', { count: room.studentCount });
    socket.emit('ANSWERS_UPDATE', room.answers);
  });

  socket.on('END_SESSION', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (!room || room.teacherSocketId !== socket.id) return;

    console.log(`[End Session] Room: ${roomId}`);

    // Notify everyone (including teacher themselves as an ack)
    io.to(roomId).emit('SESSION_ENDED');

    // Delete room and cleanup socket mapping
    if (room.throttleTimer) clearTimeout(room.throttleTimer);
    rooms.delete(roomId);
    socketToRoom.delete(socket.id);
  });

  // Teacher pushes an update (Slide changed or answer revealed)
  socket.on('PUSH_UPDATE', ({ roomId, payload }: { roomId: string, payload: BroadcastPayload }) => {
    const room = rooms.get(roomId);

    // Security check: Only the teacher who created the room can update it
    if (!room || room.teacherSocketId !== socket.id) return;

    // VALIDATION: Payload structure
    if (!payload || typeof payload !== 'object' || !payload.slideId) {
      console.warn(`[Invalid Payload] Room: ${roomId}`);
      return;
    }

    // If slide changed completely to a new one, clear old answers
    if (room.currentPayload?.slideId !== payload.slideId) {
      console.log(`[New Slide] Room: ${roomId}, Slide: ${payload.slideId}`);
      room.answers = [];
      // Inform compiler/teacher that answers have been wiped
      socket.emit('ANSWERS_UPDATE', []);
    }

    // Update memory representation
    room.currentPayload = payload;

    // BROADCAST EVERYONE IN THE ROOM
    // socket.to(roomId) targets everyone but the sender (teacher)
    socket.to(roomId).emit('SLIDE_UPDATE', payload);
  });


  // --- 2. STUDENT ACTIONS ---

  socket.on('JOIN_ROOM', ({ roomId }: { roomId: string }) => {
    // VALIDATION
    if (!roomId || typeof roomId !== 'string' || roomId.length !== 4) {
      socket.emit('ERROR', { message: "Virheellinen huonekoodi." });
      return;
    }

    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('ERROR', { message: "Huonetta ei löydy. Tarkista koodi." });
      return;
    }

    socket.join(roomId);
    socketToRoom.set(socket.id, roomId);
    room.studentCount++;
    console.log(`[Join] Student joined room ${roomId}`);

    // Notify teacher of the new count
    io.to(room.teacherSocketId).emit('STUDENT_COUNT', { count: room.studentCount });

    // LATE JOIN: If class is live, send state to the student instantaneously!
    if (room.currentPayload) {
      socket.emit('SLIDE_UPDATE', room.currentPayload);
    } else {
      socket.emit('WAITING_FOR_TEACHER');
    }
  });

  socket.on('SUBMIT_ANSWER', ({ roomId, slideId, answer }: { roomId: string, slideId: string, answer: string | string[] }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Accept answers only if state is ANSWERING 
    // (Can be stripped if late submissions map correctly)
    if (room.currentPayload?.state !== 'ANSWERING') return;

    // VALIDATION
    if (!answer) return;

    let safeAnswer: string | string[];

    if (Array.isArray(answer)) {
      if (answer.length > 20) return; // Max options
      safeAnswer = answer.map(a => typeof a === 'string' ? a.slice(0, 100) : '').filter(Boolean);
    } else if (typeof answer === 'string') {
      if (answer.length > 1000) return; // Max length
      safeAnswer = answer.replace(/[<>]/g, "").trim();
    } else {
      return; // Invalid type
    }

    // Check if the student has already answered this slide
    const existingIndex = room.answers.findIndex(a => a.socketId === socket.id);

    const answerEntry: StudentAnswer = {
      socketId: socket.id,
      slideId,
      answer: safeAnswer,
      submittedAt: Date.now()
    };

    if (existingIndex > -1) {
      // Update old answer
      room.answers[existingIndex] = answerEntry;
    } else {
      // New answer
      room.answers.push(answerEntry);
    }

    // --- BATCHED UPDATE TO TEACHER ---
    // If not already scheduled, schedule a broadcast in 1 second
    if (!room.throttleTimer) {
      room.throttleTimer = setTimeout(() => {
        io.to(room.teacherSocketId).emit('ANSWERS_UPDATE', room.answers);
        room.throttleTimer = null;
      }, 1000);
    }

    // Ack to student
    socket.emit('ANSWER_RECEIVED');
  });

  // --- 3. COMMON ---

  socket.on('disconnect', () => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) {
      socketToRoom.delete(socket.id);
      return;
    }

    if (room.teacherSocketId === socket.id) {
      // TEACHER DISCONNECTED: Start Grace Period
      console.log(`[Disconnect] Teacher left room ${roomId}. Waiting 60s for reconnect.`);
      room.disconnectTimer = setTimeout(() => {
        console.log(`[Timeout] Teacher did not reconnect. Cleaning up room ${roomId}.`);
        io.to(roomId).emit('SESSION_ENDED');
        
        if (room.throttleTimer) clearTimeout(room.throttleTimer);
        rooms.delete(roomId);
      }, 60000); // 60 seconds grace period
    } else {
      // STUDENT DISCONNECTED: Update count
      room.studentCount = Math.max(0, room.studentCount - 1);
      console.log(`[Disconnect] Student left room ${roomId}. Count: ${room.studentCount}`);
      io.to(room.teacherSocketId).emit('STUDENT_COUNT', { count: room.studentCount });
    }

    socketToRoom.delete(socket.id);
  });
});

// --- SERVE STATIC FILES (Production) ---
app.use(BASE_PATH, express.static(path.join(__dirname, '../public')));

// Catch-all for SPA (needs to handle the base path correctly)
// We use a wildcard that matches the base path
app.get(new RegExp(`^${BASE_PATH}.*`), (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start port at 3000
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\n--- MEDCASES SERVER ---`);
  console.log(`Listening on port ${PORT}`);
  console.log(`Ready for connections...\n`);
});