import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RotatingTextProps {
  texts: string[];
  mainClassName?: string;
  staggerFrom?: string;
  initial?: { y: string };
  animate?: { y: number };
  exit?: { y: string };
  staggerDuration?: number;
  splitLevelClassName?: string;
  transition?: { type: string; damping: number; stiffness: number };
  rotationInterval?: number;
  className?: string;
}

const RotatingText: React.FC<RotatingTextProps> = ({
  texts,
  mainClassName = '',
  initial = { y: "100%" },
  animate = { y: 0 },
  exit = { y: "-120%" },
  staggerDuration = 0.025,
  rotationInterval = 2500,
  className = '',
}) => {
  const [index, setIndex] = useState(0);
  const [displayText, setDisplayText] = useState(texts[0] || '');

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, rotationInterval);
    return () => clearInterval(interval);
  }, [texts.length, rotationInterval]);

  useEffect(() => {
    setDisplayText(texts[index]);
  }, [index, texts]);

  return (
    <div className={`rotating-text-container ${mainClassName}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={displayText}
          initial={initial}
          animate={animate}
          exit={exit}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 400,
          }}
          className={className}
        >
          {displayText}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

export default RotatingText;