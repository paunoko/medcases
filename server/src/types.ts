// These could be shared, but kept separate for clarity.

export type RoomStatus = 'WAITING' | 'ANSWERING' | 'LOCKED' | 'REVEALED';

// Student's answer
export interface StudentAnswer {
  socketId: string;
  slideId: string;
  answer: string | string[]; // Option ID or text answer (or list of IDs)
  submittedAt: number; // Timestamp
}

// Payload that the server broadcasts to students
// (This is identical to the client's StudentPayload, but the server does not handle its rendering content)
export interface BroadcastPayload {
  slideId: string;
  type: string;
  questionText?: string;
  options?: any[];
  state: RoomStatus;
}

// Room state in the server memory
export interface RoomState {
  roomId: string;
  teacherSocketId: string;

  // The current active slide payload (what the students see)
  currentPayload: BroadcastPayload | null;

  // All answers submitted for this slide
  answers: StudentAnswer[];

  // Number of students (socket room size)
  studentCount: number;

  // Internal: For batching updates to teacher
  throttleTimer?: NodeJS.Timeout | null;
}