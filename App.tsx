import React, { useState, useEffect } from 'react';
import { Play, Pause, Headphones, Volume2, Radio, Waves, AlertCircle, Upload, Music2 } from 'lucide-react';
import StadiumMap from './components/StadiumMap';
import Visualizer from './components/Visualizer';
import { audioEngine } from './services/AudioEngine';
import { ZONES, DEMO_TRACK_URL, BACKUP_TRACK_URL } from './constants';
import { ZoneData } from './types';

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentZone, setCurrentZone] = useState<ZoneData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [trackName, setTrackName] = useState("this_is_for.mp3");
  const [isLoading, setIsLoading] = useState(false);

  const startExperience = async (url: string, name: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setTrackName(name);
      
      audioEngine.init(url);
      await audioEngine.play();
      
      setIsPlaying(true);
      setHasStarted(true);
      setIsLoading(false);
      
      // Set default zone to VIP Center on start if not set
      if (!currentZone) {
        const defaultZone = ZONES.find(z => z.id === 'vip-c');
        if (defaultZone) handleZoneSelect(defaultZone);
      }
      
      // If we successfully started, clear fallback mode
      // (Unless it was specifically the backup track we just loaded, but even then we are "working")
      if (url !== DEMO_TRACK_URL) {
         setIsFallbackMode(false);
      }
    } catch (e) {
      console.error(e);
      setIsPlaying(false);
      setHasStarted(false);
      setIsLoading(false);
      setError("Could not play audio. Source missing or unsupported.");
      setIsFallbackMode(true);
    }
  };

  const handleStart = async () => {
    setIsLoading(true);
    let urlToPlay = DEMO_TRACK_URL;

    // AUTOMATIC FIX:
    // Browsers often fail to play local relative paths in <audio> tags due to strict MIME/CORS checks (Error Code 4).
    // However, they ALWAYS play Blobs (which is why Upload works).
    // We manually fetch the file as a blob first to ensure it plays correctly.
    if (DEMO_TRACK_URL.startsWith('./') || DEMO_TRACK_URL.startsWith('/') || !DEMO_TRACK_URL.startsWith('http')) {
        try {
            const response = await fetch(DEMO_TRACK_URL);
            if (!response.ok) throw new Error(`File missing: ${response.statusText}`);
            
            const blob = await response.blob();
            urlToPlay = URL.createObjectURL(blob);
            console.log("Local file converted to Blob URL:", urlToPlay);
        } catch (fetchErr) {
            console.warn("Could not pre-fetch local file as blob. Attempting direct load...", fetchErr);
            // Fallback: Try to load the string URL directly, though it might fail
        }
    }

    await startExperience(urlToPlay, "this_is_for.mp3");
  };

  const handleBackupStart = async () => {
    await startExperience(BACKUP_TRACK_URL, "Demo Track (Backup)");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      startExperience(objectUrl, file.name);
    }
  };

  const togglePlay = async () => {
    if (!hasStarted) return;
    
    if (isPlaying) {
      audioEngine.pause();
    } else {
      try {
        await audioEngine.play();
      } catch(e) {
        setIsPlaying(false);
        setError("Playback interrupted.");
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleZoneSelect = (zone: ZoneData) => {
    setCurrentZone(zone);
    audioEngine.updateZone(zone.audio);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-cyan-500/30 flex flex-col">
      
      {/* Navbar */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <Waves size={18} className="text-slate-950" />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-white">
            SONIC<span className="text-cyan-400">STADIUM</span>
          </h1>
        </div>
        <div className="text-xs font-medium text-slate-400 uppercase tracking-widest hidden md:block">
          4D Concert Simulator • TWICE World Tour
        </div>
        <div className="flex items-center gap-4">
            <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Help</a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        
        {/* Left Panel: Visual Map */}
        <div className="flex-1 relative flex items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 p-4">
          {/* Grid Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
          </div>
          
          <StadiumMap 
            currentZoneId={currentZone?.id || null} 
            onZoneSelect={handleZoneSelect}
          />

          {!hasStarted && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md z-20 p-6 transition-all duration-300">
               
               {!isFallbackMode ? (
                 <button 
                   onClick={handleStart}
                   disabled={isLoading}
                   className="group relative px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-lg rounded-full transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
                 >
                   <span className="flex items-center gap-2">
                     {isLoading ? (
                        <div className="w-6 h-6 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                     ) : (
                        <Headphones className="w-6 h-6" />
                     )}
                     {isLoading ? 'LOADING AUDIO...' : 'ENTER EXPERIENCE'}
                   </span>
                   <div className="absolute inset-0 rounded-full ring-2 ring-white/30 group-hover:ring-white/60 animate-pulse"></div>
                 </button>
               ) : (
                  <div className="flex flex-col items-center gap-4 animate-fade-in w-full max-w-md bg-slate-900/80 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                     <div className="text-red-400 font-medium flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20 w-full justify-center">
                        <AlertCircle size={18} />
                        File 'this_is_for.mp3' not found
                     </div>
                     
                     <p className="text-slate-400 text-sm text-center">
                       The local file was missing or format unsupported. <br/>Choose an option to continue:
                     </p>

                     <div className="flex flex-col w-full gap-3 mt-2">
                        <button 
                           onClick={handleBackupStart}
                           className="flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-all hover:shadow-lg"
                        >
                           <Music2 size={18} />
                           <span>Play Demo Track</span>
                        </button>

                        <div className="flex items-center gap-2 text-slate-600 text-xs uppercase font-bold justify-center my-1">
                           <div className="h-px w-full bg-slate-800"></div>
                           OR
                           <div className="h-px w-full bg-slate-800"></div>
                        </div>

                        <label className="cursor-pointer flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white rounded-lg transition-all group">
                           <Upload size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                           <span>Upload Your Own File</span>
                           <input 
                              type="file" 
                              accept="audio/*" 
                              onChange={handleFileUpload}
                              className="hidden" 
                           />
                        </label>
                     </div>
                  </div>
               )}
               
               {error && !isFallbackMode && (
                 <p className="absolute mt-32 text-red-400 flex items-center gap-2 text-sm font-medium animate-bounce">
                   <AlertCircle size={14}/> {error}
                 </p>
               )}
             </div>
          )}
        </div>

        {/* Right Panel: Data & Controls */}
        <div className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 p-6 flex flex-col gap-6 z-10 shadow-2xl">
          
          {/* Now Playing Info */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-cyan-500 uppercase tracking-wider">Current Track</h2>
                {isPlaying && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span></span>}
            </div>
            <div className="font-medium text-white text-lg truncate" title={trackName}>
              {trackName}
            </div>
            <div className="text-slate-400 text-sm">SonicStadium Audio</div>
          </div>

          {/* Visualizer Container */}
          <div className="h-32 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative shadow-inner">
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none z-10"></div>
             <Visualizer isPlaying={isPlaying} colorHex={currentZone?.color || '#06b6d4'} />
          </div>

          {/* Zone Info Card */}
          <div className="flex-1 bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 backdrop-blur-sm">
            <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-4">Acoustic Environment</h3>
            
            {currentZone ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                   <span className="text-2xl font-bold text-white">{currentZone.label}</span>
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentZone.color }}></div>
                </div>

                <div className="space-y-3">
                  {/* Volume Meter */}
                  <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-300">
                      <span>Volume Attenuation</span>
                      <span>{Math.round(currentZone.audio.gain * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${currentZone.audio.gain * 100}%` }}></div>
                    </div>
                  </div>

                  {/* Clarity Meter */}
                  <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-300">
                      <span>High Freq. Clarity</span>
                      <span>{Math.round((currentZone.audio.lowPassFreq / 20000) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full transition-all duration-500" style={{ width: `${(currentZone.audio.lowPassFreq / 20000) * 100}%` }}></div>
                    </div>
                  </div>

                   {/* Reverb Meter */}
                   <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-300">
                      <span>Reverb / Echo</span>
                      <span>{Math.round(currentZone.audio.reverbWet * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400 rounded-full transition-all duration-500" style={{ width: `${currentZone.audio.reverbWet * 100}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                    <div className={`px-3 py-1 rounded text-xs font-bold border ${currentZone.audio.pan < -0.2 ? 'border-cyan-500 text-cyan-400' : 'border-slate-700 text-slate-500'}`}>LEFT</div>
                    <div className={`px-3 py-1 rounded text-xs font-bold border ${Math.abs(currentZone.audio.pan) <= 0.2 ? 'border-cyan-500 text-cyan-400' : 'border-slate-700 text-slate-500'}`}>CENTER</div>
                    <div className={`px-3 py-1 rounded text-xs font-bold border ${currentZone.audio.pan > 0.2 ? 'border-cyan-500 text-cyan-400' : 'border-slate-700 text-slate-500'}`}>RIGHT</div>
                </div>
                
                {currentZone.audio.hasHaptics && (
                   <div className="flex items-center gap-2 text-xs text-rose-400 mt-2">
                     <Radio size={14} className="animate-pulse" /> BASS HAPTICS ACTIVE
                   </div>
                )}

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm text-center">
                <Volume2 className="mb-2 opacity-50" size={32} />
                <p>Select a zone on the map to hear the difference.</p>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <button 
            onClick={togglePlay}
            disabled={!hasStarted}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              hasStarted 
              ? 'bg-white text-slate-950 hover:bg-cyan-400' 
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
            {isPlaying ? 'PAUSE SIMULATION' : 'RESUME SIMULATION'}
          </button>

        </div>
      </main>
    </div>
  );
}