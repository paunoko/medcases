// Nämä voisivat olla yhteiskäytössä, mutta pidetään erillään selkeyden vuoksi.

export type RoomStatus = 'WAITING' | 'ANSWERING' | 'LOCKED' | 'REVEALED';

// Opiskelijan vastaus
export interface StudentAnswer {
  socketId: string;
  slideId: string;
  answer: string | string[]; // Option ID tai tekstivastaus (tai lista ID:itä)
  submittedAt: number; // Timestamp
}

// Payload, jonka serveri välittää opiskelijoille
// (Tämä on sama kuin clientin StudentPayload, mutta serveri ei välitä sisällöstä)
export interface BroadcastPayload {
  slideId: string;
  type: string;
  questionText?: string;
  options?: any[];
  state: RoomStatus;
}

// Huoneen tila palvelimen muistissa
export interface RoomState {
  roomId: string;
  teacherSocketId: string;

  // Nykyinen aktiivinen dia (mitä opiskelijat näkevät)
  currentPayload: BroadcastPayload | null;

  // Kaikki tähän diaan tulleet vastaukset
  answers: StudentAnswer[];

  // Opiskelijoiden lkm (socket room size)
  studentCount: number;
}