import { ZoneCategory, ZoneData } from './types';

// Primary Local File (Requested by User)
export const DEMO_TRACK_URL = "./this_is_for.mp3";

// Backup Remote URL (Reliable Fallback)
export const BACKUP_TRACK_URL = "https://assets.codepen.io/4358584/Anitek_-_K53.mp3";

// Stadium Physics Configuration
export const ZONES: ZoneData[] = [
  // --- STAGE ---
  {
    id: 'stage',
    label: 'MAIN STAGE',
    category: ZoneCategory.STAGE,
    audio: { gain: 0, lowPassFreq: 20000, pan: 0, reverbWet: 0, hasHaptics: false },
    color: '#ef4444', // red-500
    x: 300, y: 50, width: 200, height: 60
  },

  // --- VIP (B1-B5) ---
  // Direct sound, full frequency, heavy bass feel
  {
    id: 'vip-c',
    label: 'VIP CENTER',
    category: ZoneCategory.VIP,
    audio: { gain: 1.0, lowPassFreq: 20000, pan: 0, reverbWet: 0.1, hasHaptics: true },
    color: '#ec4899', // pink-500
    x: 350, y: 150, width: 100, height: 120
  },
  {
    id: 'vip-l',
    label: 'VIP LEFT',
    category: ZoneCategory.VIP,
    audio: { gain: 0.95, lowPassFreq: 19000, pan: -0.3, reverbWet: 0.15, hasHaptics: true },
    color: '#f472b6', // pink-400
    x: 240, y: 150, width: 100, height: 120
  },
  {
    id: 'vip-r',
    label: 'VIP RIGHT',
    category: ZoneCategory.VIP,
    audio: { gain: 0.95, lowPassFreq: 19000, pan: 0.3, reverbWet: 0.15, hasHaptics: true },
    color: '#f472b6', // pink-400
    x: 460, y: 150, width: 100, height: 120
  },

  // --- LOWER BOWL (Green/Yellow) ---
  // Good sound, slight rollout, wider stereo image
  {
    id: 'lower-l',
    label: 'LOWER STAND A',
    category: ZoneCategory.LOWER_BOWL,
    audio: { gain: 0.8, lowPassFreq: 12000, pan: -0.7, reverbWet: 0.3, hasHaptics: false },
    color: '#10b981', // emerald-500
    // SVG Path calculated for left curve
    path: "M 200 100 Q 100 200 180 450 L 220 450 Q 150 200 220 120 Z"
  },
  {
    id: 'lower-r',
    label: 'LOWER STAND C',
    category: ZoneCategory.LOWER_BOWL,
    audio: { gain: 0.8, lowPassFreq: 12000, pan: 0.7, reverbWet: 0.3, hasHaptics: false },
    color: '#10b981', // emerald-500
    // SVG Path calculated for right curve
    path: "M 600 100 Q 700 200 620 450 L 580 450 Q 650 200 580 120 Z"
  },
  {
    id: 'lower-c',
    label: 'LOWER STAND B',
    category: ZoneCategory.LOWER_BOWL,
    audio: { gain: 0.75, lowPassFreq: 10000, pan: 0, reverbWet: 0.35, hasHaptics: false },
    color: '#facc15', // yellow-400
    // Bottom curve
    path: "M 180 460 Q 400 550 620 460 L 620 500 Q 400 600 180 500 Z"
  },

  // --- UPPER BOWL (Blue/Purple) ---
  // Distant, muffled (HF loss), high reverb, narrow stereo due to distance
  {
    id: 'upper-l',
    label: 'UPPER TIER L',
    category: ZoneCategory.UPPER_BOWL,
    audio: { gain: 0.5, lowPassFreq: 4000, pan: -0.5, reverbWet: 0.6, hasHaptics: false },
    color: '#6366f1', // indigo-500
    path: "M 190 90 Q 20 200 160 520 L 140 540 Q -20 200 170 70 Z"
  },
  {
    id: 'upper-r',
    label: 'UPPER TIER R',
    category: ZoneCategory.UPPER_BOWL,
    audio: { gain: 0.5, lowPassFreq: 4000, pan: 0.5, reverbWet: 0.6, hasHaptics: false },
    color: '#6366f1', // indigo-500
    path: "M 610 90 Q 780 200 640 520 L 660 540 Q 820 200 630 70 Z"
  },
  {
    id: 'upper-c',
    label: 'NOSEBLEEDS',
    category: ZoneCategory.UPPER_BOWL,
    audio: { gain: 0.4, lowPassFreq: 2500, pan: 0, reverbWet: 0.8, hasHaptics: false },
    color: '#a855f7', // purple-500
    path: "M 160 530 Q 400 650 640 530 L 660 550 Q 400 700 140 550 Z"
  }
];