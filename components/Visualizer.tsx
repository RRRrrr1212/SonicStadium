import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/AudioEngine';

interface VisualizerProps {
  isPlaying: boolean;
  colorHex: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ isPlaying, colorHex }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(128); // FFT Size / 2

    const render = () => {
      // Match parent container width dynamically
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = canvas.parentElement?.clientHeight || 100;

      audioEngine.getAnalysisData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isPlaying) {
         // Draw a flat line when paused
         ctx.beginPath();
         ctx.moveTo(0, canvas.height / 2);
         ctx.lineTo(canvas.width, canvas.height / 2);
         ctx.strokeStyle = '#334155';
         ctx.lineWidth = 2;
         ctx.stroke();
         return;
      }

      const barWidth = (canvas.width / dataArray.length) * 1.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        ctx.fillStyle = colorHex;
        
        // Create a gradient for a "neon" look
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, colorHex);
        gradient.addColorStop(1, `${colorHex}00`); // Fade out
        
        ctx.fillStyle = gradient;

        // Draw rounded top bars
        ctx.beginPath();
        ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, 2);
        ctx.fill();

        x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, colorHex]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
    />
  );
};

export default Visualizer;