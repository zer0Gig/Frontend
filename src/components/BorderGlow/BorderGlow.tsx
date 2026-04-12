import React from 'react';
import './BorderGlow.css';

interface BorderGlowProps {
  children: React.ReactNode;
  className?: string;
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  animated?: boolean;
  colors?: string[];
  fillOpacity?: number;
}

const BorderGlow: React.FC<BorderGlowProps> = ({ 
  children, 
  className = '',
  borderRadius = 999,
  glowColor = "180 70 75",
  backgroundColor = "#000000",
  colors = ["#38bdf8", "#a78bfa", "#22d3ee"],
  animated = true,
  fillOpacity = 0.3,
}) => {
  return (
    <div 
      className={`border-glow ${animated ? 'animated' : ''} ${className}`}
      style={{
        borderRadius,
        backgroundColor,
        '--glow-color': glowColor,
        '--fill-opacity': fillOpacity,
        '--glow-colors': colors.join(', '),
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

export default BorderGlow;