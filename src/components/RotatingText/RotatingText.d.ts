import { ComponentPropsWithRef } from 'react';

interface RotatingTextProps extends ComponentPropsWithRef<'span'> {
  texts: string[];
  transition?: object;
  initial?: object;
  animate?: object;
  exit?: object;
  animatePresenceMode?: 'wait' | 'sync' | 'popLayout';
  animatePresenceInitial?: boolean;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: 'first' | 'last' | 'center' | 'random' | number;
  loop?: boolean;
  auto?: boolean;
  splitBy?: 'characters' | 'words' | 'lines' | string;
  onNext?: (index: number) => void;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
}

declare const RotatingText: React.ForwardRefExoticComponent<
  RotatingTextProps & React.RefAttributes<{ next: () => void; previous: () => void; jumpTo: (index: number) => void; reset: () => void }>
>;

export default RotatingText;
