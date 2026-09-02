import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronUp } from 'lucide-react';

export const ALPHABET_INDEX = [
  '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'
];

interface AlphabetScrollerProps {
  availableLetters: Set<string>;
  activeLetter?: string | null;
  onSelectLetter: (letter: string) => void;
  onScrollToTop: () => void;
  showScrollToTop?: boolean;
}

export const AlphabetScroller: React.FC<AlphabetScrollerProps> = ({
  availableLetters,
  activeLetter,
  onSelectLetter,
  onScrollToTop,
  showScrollToTop = true
}) => {
  const [touchingLetter, setTouchingLetter] = useState<string | null>(null);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerLetter = useCallback((letter: string) => {
    setTouchingLetter(letter);
    setBubbleVisible(true);
    onSelectLetter(letter);

    if (bubbleTimeoutRef.current) {
      clearTimeout(bubbleTimeoutRef.current);
    }
    bubbleTimeoutRef.current = setTimeout(() => {
      setBubbleVisible(false);
      setTouchingLetter(null);
    }, 1200);
  }, [onSelectLetter]);

  const handlePointerMove = (clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const height = rect.height;
    
    if (relativeY >= 0 && relativeY <= height) {
      const index = Math.floor((relativeY / height) * ALPHABET_INDEX.length);
      const clampedIndex = Math.max(0, Math.min(ALPHABET_INDEX.length - 1, index));
      const letter = ALPHABET_INDEX[clampedIndex];
      if (letter) {
        triggerLetter(letter);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handlePointerMove(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handlePointerMove(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    if (bubbleTimeoutRef.current) {
      clearTimeout(bubbleTimeoutRef.current);
    }
    bubbleTimeoutRef.current = setTimeout(() => {
      setBubbleVisible(false);
      setTouchingLetter(null);
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    };
  }, []);

  return (
    <>
      {/* Floating Letter Preview Bubble (HUD badge when dragging/clicking A-Z) */}
      {bubbleVisible && touchingLetter && (
        <div
          id="alphabet-floating-bubble"
          className="fixed right-12 top-1/2 -translate-y-1/2 z-50 pointer-events-none flex items-center justify-center animate-in fade-in zoom-in-75 duration-150"
        >
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-950/95 border-2 border-cyan-400 text-white shadow-2xl shadow-cyan-500/30 backdrop-blur-xl">
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-200 to-cyan-400 font-['Syne',sans-serif]">
              {touchingLetter}
            </span>
            {/* Arrow pointing to alphabet rail */}
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-cyan-400" />
          </div>
        </div>
      )}

      {/* Vertical A-Z Rail */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="sticky top-20 right-0 z-30 select-none flex flex-col items-center justify-between py-2 px-1 rounded-full bg-zinc-950/70 hover:bg-zinc-950/90 border border-white/10 backdrop-blur-md shadow-xl transition-all duration-200 w-6 h-[460px] sm:h-[500px]"
        style={{ touchAction: 'none' }}
      >
        {ALPHABET_INDEX.map((char) => {
          const isAvailable = availableLetters.has(char) || char === '@';
          const isSelected = activeLetter === char || touchingLetter === char;

          return (
            <button
              key={char}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerLetter(char);
              }}
              className={`w-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold font-mono transition-transform duration-150 cursor-pointer ${
                isSelected
                  ? 'text-cyan-300 font-extrabold scale-135 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]'
                  : isAvailable
                  ? 'text-zinc-300 hover:text-cyan-400 hover:scale-125'
                  : 'text-zinc-600/60 hover:text-zinc-400'
              }`}
            >
              {char}
            </button>
          );
        })}
      </div>

      {/* Quick Scroll To Top Floating Button (as seen in DDMusic UI) */}
      {showScrollToTop && (
        <button
          id="btn-scroll-to-top"
          onClick={onScrollToTop}
          className="fixed bottom-24 right-5 sm:right-8 z-40 w-11 h-11 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white border border-white/15 shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md group"
          title="Scroll to Top"
        >
          <ChevronUp className="w-5 h-5 text-cyan-400 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}
    </>
  );
};
