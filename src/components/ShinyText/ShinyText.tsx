import React from 'react';
import './ShinyText.css';

interface ShinyTextProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  color?: string;
  shineColor?: string;
  spread?: number;
  yoyo?: boolean;
}

const ShinyText: React.FC<ShinyTextProps> = ({ 
  text, 
  className = '', 
  speed = 3,
  delay = 0,
  color = 'rgba(255,255,255,0.85)',
  shineColor = '#22d3ee',
  spread = 80,
  yoyo = true
}) => {
  return (
    <span 
      className={`shiny-text ${className}`}
      style={{
        color,
        '--shine-color': shineColor,
        '--spread': spread,
        animationDuration: `${speed}s`,
        animationDelay: `${delay}s`,
        animationDirection: yoyo ? 'alternate' : 'normal',
      } as React.CSSProperties}
    >
      {text}
    </span>
  );
};

export default ShinyText;