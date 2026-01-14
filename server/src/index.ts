import express from 'express';
import http from 'http';
import path from 'path';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { RoomState, StudentAnswer, BroadcastPayload } from './types';

// Alustetaan Express ja Socket.io
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
// Koska emme käytä tietokantaa, tallennamme kaiken tähän Map-olioon.
// Kun palvelin sammuu, tämä tyhjenee.
const rooms = new Map<string, RoomState>();

// Apufunktio: Luo 4-numeroinen huonekoodi (esim. "3821")
const generateRoomCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

io.on('connection', (socket: Socket) => {
  console.log(`[Connect] Socket ID: ${socket.id}`);

  // --- 1. OPETTAJAN TOIMINNOT ---

  socket.on('CREATE_ROOM', () => {
    let roomId = generateRoomCode();
    // Varmistetaan uniikkius (epätodennäköistä että osuu samaan, mutta varman päälle)
    while (rooms.has(roomId)) {
      roomId = generateRoomCode();
    }

    // Alustetaan huoneen tila
    const newRoom: RoomState = {
      roomId,
      teacherSocketId: socket.id,
      currentPayload: null,
      answers: [],
      studentCount: 0
    };

    rooms.set(roomId, newRoom);
    socket.join(roomId); // Socket.io "huone"

    console.log(`[Room Created] ID: ${roomId} by Teacher: ${socket.id}`);
    socket.emit('ROOM_CREATED', { roomId });
  });

  socket.on('END_SESSION', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (!room || room.teacherSocketId !== socket.id) return;

    console.log(`[End Session] Room: ${roomId}`);

    // Ilmoitetaan kaikille (myös opettajalle itselleen kuittauksena)
    io.to(roomId).emit('SESSION_ENDED');

    // Poistetaan huone
    rooms.delete(roomId);

    // Socket.io huoneen tyhjennys tapahtuu automaattisesti kun clientit disconnectaa
    // tai voimme pakottaa leave:n, mutta client-side redirect hoitaa disconnectin.
  });

  // Opettaja lähettää päivityksen (Slide vaihtui tai vastaus paljastettiin)
  socket.on('PUSH_UPDATE', ({ roomId, payload }: { roomId: string, payload: BroadcastPayload }) => {
    const room = rooms.get(roomId);

    // Turvatarkistus: Vain huoneen luonut opettaja saa päivittää
    if (!room || room.teacherSocketId !== socket.id) return;

    // VALIDATION: Payload structure
    if (!payload || typeof payload !== 'object' || !payload.slideId) {
      console.warn(`[Invalid Payload] Room: ${roomId}`);
      return;
    }

    // Jos slide on vaihtunut kokonaan uuteen, nollataan vanhat vastaukset
    if (room.currentPayload?.slideId !== payload.slideId) {
      console.log(`[New Slide] Room: ${roomId}, Slide: ${payload.slideId}`);
      room.answers = [];
      // Kerrotaan opettajalle, että vastaukset nollattiin
      socket.emit('ANSWERS_UPDATE', []);
    }

    // Päivitetään palvelimen muisti
    room.currentPayload = payload;

    // LÄHETETÄÄN KAIKILLE OPISKELIJOILLE HUONEESSA
    // socket.to(roomId) lähettää kaikille muille paitsi lähettäjälle (opettajalle)
    socket.to(roomId).emit('SLIDE_UPDATE', payload);
  });


  // --- 2. OPISKELIJAN TOIMINNOT ---

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
    room.studentCount++;
    console.log(`[Join] Student joined room ${roomId}`);

    // Ilmoitetaan opettajalle uusi osallistujamäärä
    io.to(room.teacherSocketId).emit('STUDENT_COUNT', { count: room.studentCount });

    // LATE JOIN: Jos tunti on jo käynnissä, lähetetään opiskelijalle nykytilanne heti!
    if (room.currentPayload) {
      socket.emit('SLIDE_UPDATE', room.currentPayload);
    } else {
      socket.emit('WAITING_FOR_TEACHER');
    }
  });

  socket.on('SUBMIT_ANSWER', ({ roomId, slideId, answer }: { roomId: string, slideId: string, answer: string | string[] }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Hyväksytään vastauksia vain jos tila on ANSWERING (varmistus)
    // (Voi poistaa tämän tarkistuksen jos haluat sallia myöhäiset vastaukset)
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

    // Tarkistetaan onko opiskelija jo vastannut tähän slideen
    const existingIndex = room.answers.findIndex(a => a.socketId === socket.id);

    const answerEntry: StudentAnswer = {
      socketId: socket.id,
      slideId,
      answer: safeAnswer,
      submittedAt: Date.now()
    };

    if (existingIndex > -1) {
      // Päivitetään vanha vastaus
      room.answers[existingIndex] = answerEntry;
    } else {
      // Uusi vastaus
      room.answers.push(answerEntry);
    }

    // Lähetetään vastaukset reaaliajassa opettajalle
    io.to(room.teacherSocketId).emit('ANSWERS_UPDATE', room.answers);

    // Kuittaus oppilaalle
    socket.emit('ANSWER_RECEIVED');
  });

  // --- 3. YLEISET ---

  socket.on('disconnect', () => {
    // Tässä voisi vähentää studentCountia, mutta se vaatisi
    // käänteisen mapin (socketId -> roomId). 
    // MVP-versiossa emme tee sitä, jotta koodi pysyy yksinkertaisena.
    console.log(`[Disconnect] ${socket.id}`);
  });
});

// --- SERVE STATIC FILES (Production) ---
app.use(BASE_PATH, express.static(path.join(__dirname, '../public')));

// Catch-all for SPA (needs to handle the base path correctly)
// We use a wildcard that matches the base path
app.get(new RegExp(`^${BASE_PATH}.*`), (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Käynnistetään porttiin 3000
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\n--- MEDCASES SERVER ---`);
  console.log(`Listening on port ${PORT}`);
  console.log(`Ready for connections...\n`);
});