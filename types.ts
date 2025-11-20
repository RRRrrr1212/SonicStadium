export enum ZoneCategory {
  STAGE = 'STAGE',
  VIP = 'VIP',
  FLOOR = 'FLOOR',
  LOWER_BOWL = 'LOWER_BOWL',
  UPPER_BOWL = 'UPPER_BOWL',
}

export interface AudioParams {
  gain: number;         // 0.0 to 1.0 (Volume)
  lowPassFreq: number;  // Hz (Muffling effect)
  pan: number;          // -1.0 (L) to 1.0 (R)
  reverbWet: number;    // 0.0 to 1.0 (Dry/Wet mix)
  hasHaptics: boolean;  // Triggers vibration
}

export interface ZoneData {
  id: string;
  label: string;
  category: ZoneCategory;
  audio: AudioParams;
  color: string;        // Tailwind class or hex
  path?: string;        // SVG path d attribute
  x?: number;          // For rects
  y?: number;
  width?: number;
  height?: number;
}

export interface AudioState {
  isPlaying: boolean;
  currentZoneId: string | null;
  volume: number;
}