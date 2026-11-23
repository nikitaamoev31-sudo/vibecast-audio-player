/**
 * Бэкенд отдаёт вместо аудио текстовую заглушку (encoded_audio),
 * поэтому звук для каждого трека генерируется на клиенте:
 * детерминированная мелодия по id трека и полной длительности из API.
 * Результат — WAV-файл (8 кГц, 16 бит, моно), который проигрывает обычный <audio>.
 */

const SAMPLE_RATE = 8000;
const SCALES = [
  [0, 2, 4, 7, 9], // мажорная пентатоника
  [0, 3, 5, 7, 10], // минорная пентатоника
  [0, 2, 3, 7, 8], // «восточный» лад
];

function seededRandom(seed: number): () => number {
  let state = seed * 9301 + 49297;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

const noteFrequency = (semitone: number): number => 220 * 2 ** (semitone / 12);

function writeHeader(view: DataView, samples: number): void {
  const write = (offset: number, value: string) =>
    [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  write(0, 'RIFF');
  view.setUint32(4, 36 + samples * 2, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // моно
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, samples * 2, true);
}

export function synthesizeTrack(id: number, seconds: number): Blob {
  const random = seededRandom(id);
  const scale = SCALES[id % SCALES.length];
  const tempo = 90 + Math.floor(random() * 50);
  const beat = 60 / tempo / 2;
  const samples = Math.floor(seconds * SAMPLE_RATE);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  writeHeader(view, samples);

  const motif = Array.from({ length: 8 }, () => scale[Math.floor(random() * scale.length)] + 12 * Math.floor(random() * 2));
  const bassLine = [0, 5, 3, 4].map((step) => scale[step % scale.length] - 12);
  const samplesPerBeat = Math.floor(beat * SAMPLE_RATE);

  let phaseLead = 0;
  let phaseBass = 0;
  for (let i = 0; i < samples; i += 1) {
    const step = Math.floor(i / samplesPerBeat);
    const inBeat = (i % samplesPerBeat) / samplesPerBeat;
    const bar = Math.floor(step / 8);
    const lead = noteFrequency(motif[step % motif.length] + (bar % 4 === 3 ? 2 : 0));
    const bass = noteFrequency(bassLine[bar % bassLine.length]);

    phaseLead += (2 * Math.PI * lead) / SAMPLE_RATE;
    phaseBass += (2 * Math.PI * bass) / SAMPLE_RATE;

    const envelope = Math.exp(-4 * inBeat);
    const fade = Math.min(1, i / SAMPLE_RATE, (samples - i) / SAMPLE_RATE);
    const value = (Math.sin(phaseLead) * 0.35 * envelope + Math.sin(phaseBass) * 0.25) * fade;
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, value)) * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}
