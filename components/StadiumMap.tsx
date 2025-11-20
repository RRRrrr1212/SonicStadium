import React from 'react';
import { ZONES } from '../constants';
import { ZoneData } from '../types';

interface StadiumMapProps {
  currentZoneId: string | null;
  onZoneSelect: (zone: ZoneData) => void;
}

const StadiumMap: React.FC<StadiumMapProps> = ({ currentZoneId, onZoneSelect }) => {
  return (
    <div className="relative w-full max-w-3xl mx-auto aspect-[4/3] p-4">
      <svg 
        viewBox="0 0 800 700" 
        className="w-full h-full shadow-map-path"
        style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}
      >
        {/* Stadium Base/Ground */}
        <path 
          d="M 50 100 L 750 100 L 750 600 L 50 600 Z" 
          fill="#0f172a" 
          stroke="#1e293b" 
          strokeWidth="2"
          className="opacity-50"
        />

        {/* Render Zones */}
        {ZONES.map((zone) => {
          const isActive = currentZoneId === zone.id;
          const isStage = zone.id === 'stage';
          
          return (
            <g 
              key={zone.id}
              onClick={() => !isStage && onZoneSelect(zone)}
              className={`${!isStage ? 'cursor-pointer hover:opacity-90 transition-opacity duration-200' : ''}`}
              style={{
                opacity: isActive ? 1 : 0.4,
                transition: 'all 0.4s ease'
              }}
            >
              {zone.path ? (
                <path 
                  d={zone.path} 
                  fill={zone.color}
                  stroke={isActive ? '#ffffff' : 'none'}
                  strokeWidth={isActive ? 3 : 0}
                  className="transition-all duration-300"
                />
              ) : (
                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.width}
                  height={zone.height}
                  fill={zone.color}
                  rx={isStage ? 4 : 8}
                  stroke={isActive ? '#ffffff' : 'none'}
                  strokeWidth={isActive ? 3 : 0}
                  className="transition-all duration-300"
                />
              )}

              {/* Zone Label (Only visible if active or large) */}
              {(isActive || isStage) && (
                <text
                  x={(zone.path) ? 400 : (zone.x! + zone.width! / 2)}
                  y={(zone.path) ? (zone.id.includes('upper') ? 150 : 300) : (zone.y! + zone.height! / 2)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={isStage ? 16 : 14}
                  fontWeight="bold"
                  pointerEvents="none"
                  className="drop-shadow-md"
                >
                  {zone.label}
                </text>
              )}
              
              {/* Active Glow Effect */}
              {isActive && (
                 <animate 
                   attributeName="opacity" 
                   values="0.8;1;0.8" 
                   dur="2s" 
                   repeatCount="indefinite" 
                 />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default StadiumMap;