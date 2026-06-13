
import { useCallback, useEffect, useRef } from 'react';

type SoundType = 'success' | 'error' | 'click' | 'unlock' | 'complete' | 'whoosh';

export const useSound = () => {
  // Refs for file-based audio elements
  const successRef = useRef<HTMLAudioElement | null>(null);
  const errorRef = useRef<HTMLAudioElement | null>(null);
  const clickRef = useRef<HTMLAudioElement | null>(null);
  const completeRef = useRef<HTMLAudioElement | null>(null);
  const whooshRef = useRef<HTMLAudioElement | null>(null);

  // Ref for Web Audio API (Used for 'unlock' synth sound)
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Initialize File-based Audio
      // We use relative paths (no leading slash) to ensure they work if the app is served from a subdirectory
      successRef.current = new Audio('sounds/correct.wav');
      errorRef.current = new Audio('sounds/wrong.wav');
      clickRef.current = new Audio('sounds/click.mp3');
      completeRef.current = new Audio('sounds/session_complete.mp3');
      whooshRef.current = new Audio('sounds/whoosh.mp3');

      // Preload to reduce latency
      // We add error listeners to help debug specific missing files
      [successRef, errorRef, clickRef, completeRef, whooshRef].forEach((ref, index) => {
          if(ref.current) {
              ref.current.load();
          }
      });

      // 2. Initialize Web Audio Context (for synthesized effects)
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }

    return () => {
      // Cleanup Web Audio Context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playSound = useCallback((type: SoundType) => {
    // Helper to play file audio with reset
    const playFile = (audio: HTMLAudioElement | null, volume = 0.5) => {
        if (!audio) {
            return;
        }
        
        // Reset and Play
        try {
            audio.currentTime = 0; 
            audio.volume = volume;
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .catch(() => {
                        // Silent catch
                    });
            }
        } catch (e) {
            // Silent catch
        }
    };

    switch (type) {
      case 'success':
        playFile(successRef.current, 0.6);
        break;

      case 'error':
        playFile(errorRef.current, 0.5);
        break;

      case 'click':
        playFile(clickRef.current, 0.3);
        break;
        
      case 'complete':
        playFile(completeRef.current, 0.7);
        break;

      case 'whoosh':
        playFile(whooshRef.current, 0.5);
        break;

      case 'unlock':
        // Keep synthesized logic for 'unlock' (Level Up sound / Streak)
        const ctx = audioContextRef.current;
        if (!ctx) {
             return;
        }
        
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);
            
            // Arpeggio
            osc.type = 'square';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.1);
            osc.frequency.setValueAtTime(783.99, now + 0.2);

            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0.05, now + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            
            osc.start(now);
            osc.stop(now + 0.6);
        } catch (e) {
            // Silent catch
        }
        break;
    }
  }, []);

  return { playSound };
};
