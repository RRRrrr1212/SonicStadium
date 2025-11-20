import { AudioParams } from '../types';

class AudioEngine {
  private context: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  
  // Nodes Chain
  private gainNode: GainNode | null = null;
  private pannerNode: StereoPannerNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  
  // Reverb Chain
  private convolverNode: ConvolverNode | null = null;
  private reverbGainNode: GainNode | null = null; // Controls Wet mix
  private dryGainNode: GainNode | null = null;    // Controls Dry mix

  private isInitialized = false;
  private isPlaying = false;

  // Haptics
  private hapticLoopId: number | null = null;
  private currentZoneHapticsEnabled = false;
  private lastBassTrigger = 0;

  public reset(): void {
    try {
      this.pause();
      this.stopHapticsLoop();
      
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.src = "";
        this.audioElement.load(); // Force release of resource
        this.audioElement = null;
      }

      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }

      if (this.context && this.context.state !== 'closed') {
        this.context.close();
      }
    } catch (e) {
      console.warn("Error cleaning up AudioEngine:", e);
    }

    this.context = null;
    this.gainNode = null;
    this.pannerNode = null;
    this.filterNode = null;
    this.analyserNode = null;
    this.convolverNode = null;
    this.reverbGainNode = null;
    this.dryGainNode = null;
    this.isInitialized = false;
    this.isPlaying = false;
  }

  public init(audioUrl: string): void {
    // If already initialized, reset to allow loading a new URL (e.g., fallback upload)
    if (this.isInitialized) {
      this.reset();
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioContextClass();

    // Create Audio Element securely
    this.audioElement = new Audio();
    
    // CRITICAL FIX: 
    // 1. Remote URLs (http/https) need crossOrigin="anonymous" for Web Audio API analysis.
    // 2. Data URIs (base64), Blobs (blob:...), and Local files (file://) MUST NOT have crossOrigin set, 
    //    or they will fail with MEDIA_ELEMENT_ERROR (Code 4).
    if ((audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) && !audioUrl.includes('localhost') && !audioUrl.includes('127.0.0.1')) {
      this.audioElement.crossOrigin = "anonymous";
    } else {
      this.audioElement.removeAttribute('crossOrigin');
    }

    this.audioElement.src = audioUrl;
    this.audioElement.loop = true;
    
    // Add error handling for the audio element specifically
    this.audioElement.addEventListener('error', (e) => {
        console.error("Audio Element Error Event:", e);
        if (this.audioElement?.error) {
             console.error(`Error Code: ${this.audioElement.error.code}, Message: ${this.audioElement.error.message}`);
        }
    });

    // Create Nodes
    this.sourceNode = this.context.createMediaElementSource(this.audioElement);
    this.gainNode = this.context.createGain();
    this.pannerNode = this.context.createStereoPanner();
    this.filterNode = this.context.createBiquadFilter();
    this.analyserNode = this.context.createAnalyser();
    
    // Reverb Setup
    this.convolverNode = this.context.createConvolver();
    this.reverbGainNode = this.context.createGain();
    this.dryGainNode = this.context.createGain();

    // Generate Stadium Impulse Response
    this.convolverNode.buffer = this.generateStadiumImpulse(this.context);

    // Node Configuration
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 20000;
    this.filterNode.Q.value = 1; // Slight resonance
    
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // Routing:
    // Source -> Filter -> Panner -> Split (Dry & Wet)
    this.sourceNode.connect(this.filterNode);
    this.filterNode.connect(this.pannerNode);

    // Dry Path: Panner -> DryGain -> MainGain -> Destination
    this.pannerNode.connect(this.dryGainNode);
    this.dryGainNode.connect(this.gainNode);

    // Wet Path: Panner -> Convolver -> ReverbGain -> MainGain -> Destination
    this.pannerNode.connect(this.convolverNode);
    this.convolverNode.connect(this.reverbGainNode);
    this.reverbGainNode.connect(this.gainNode);

    // Final Output
    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.context.destination);

    this.isInitialized = true;
  }

  /**
   * Creates a synthetic impulse response to simulate a large stadium.
   * Noise burst + Exponential Decay.
   */
  private generateStadiumImpulse(ctx: AudioContext): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const duration = 2.5; // 2.5 seconds reverb tail
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2.5); // Non-linear decay
        // White noise * decay
        channelData[i] = (Math.random() * 2 - 1) * decay; 
      }
    }
    return impulse;
  }

  public async play(): Promise<void> {
    if (!this.context || !this.audioElement) throw new Error("AudioEngine not initialized");

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    
    try {
        await this.audioElement.play();
        this.isPlaying = true;
        this.startHapticsLoop();
    } catch (e) {
        console.error("Audio Playback Failed:", e);
        throw e;
    }
  }

  public pause(): void {
    this.audioElement?.pause();
    this.isPlaying = false;
    this.stopHapticsLoop();
  }

  public updateZone(params: AudioParams, transitionTime: number = 0.8): void {
    if (!this.context || !this.gainNode || !this.filterNode || !this.pannerNode || !this.reverbGainNode || !this.dryGainNode) return;

    const now = this.context.currentTime;
    // Use setTargetAtTime for smooth, exponential transitions (RC Filter Physics)
    // timeConstant = transitionTime / 4 ensures we reach ~98% of the target value by the end of transitionTime
    const timeConstant = transitionTime / 4;

    // Volume (Master Gain) - Automated based on Zone Gain
    this.gainNode.gain.setTargetAtTime(params.gain, now, timeConstant);

    // Frequency (LowPass)
    this.filterNode.frequency.setTargetAtTime(Math.max(params.lowPassFreq, 100), now, timeConstant);

    // Stereo Pan
    this.pannerNode.pan.setTargetAtTime(params.pan, now, timeConstant);

    // Reverb Mix (Wet/Dry)
    // Wet increases with distance, Dry decreases slightly but stays present
    this.reverbGainNode.gain.setTargetAtTime(params.reverbWet, now, timeConstant);
    this.dryGainNode.gain.setTargetAtTime(1.0 - (params.reverbWet * 0.5), now, timeConstant);

    this.currentZoneHapticsEnabled = params.hasHaptics;

    // --- Enhanced Haptic Feedback ---
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (params.hasHaptics) {
        // "Entering Power Zone" pattern: Short, Strong, Short
        // Gives a feeling of "locking in" to a high-intensity area
        navigator.vibrate([30, 40, 30]); 
      } else {
        // "Tactile Click" pattern: Very short
        // Gives a feeling of UI interaction without implying bass weight
        navigator.vibrate(15);
      }
    }
  }

  public getAnalysisData(dataArray: Uint8Array): void {
    this.analyserNode?.getByteFrequencyData(dataArray);
  }

  public getContextState(): AudioContextState | undefined {
    return this.context?.state;
  }

  /**
   * Runs a loop to analyze audio energy and trigger haptics on bass hits.
   * Only active when playing and in a zone with haptics enabled (VIP/Floor).
   */
  private startHapticsLoop() {
    // Cancel any existing loop to avoid duplicates
    this.stopHapticsLoop();

    const loop = () => {
      this.hapticLoopId = requestAnimationFrame(loop);

      if (!this.isPlaying || !this.currentZoneHapticsEnabled || !this.analyserNode) return;

      const now = performance.now();
      // Throttle: Prevent vibration more than once every 150ms (Max ~6.6 hits/sec)
      if (now - this.lastBassTrigger < 150) return;

      const bufferLength = this.analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyserNode.getByteFrequencyData(dataArray);

      // FFT Size is 256, so bufferLength is 128.
      // With sample rate ~48kHz, Bin 0 covers approx 0-180Hz (Deep Bass / Sub).
      const bassEnergy = dataArray[0]; 

      // Threshold: 230 out of 255. 
      // This ensures we only vibrate on strong Kick Drums or Bass Drops.
      if (bassEnergy > 230) {
         if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(30); // Short, punchy vibration
         }
         this.lastBassTrigger = now;
      }
    };
    loop();
  }

  private stopHapticsLoop() {
    if (this.hapticLoopId) {
      cancelAnimationFrame(this.hapticLoopId);
      this.hapticLoopId = null;
    }
  }
}

export const audioEngine = new AudioEngine();