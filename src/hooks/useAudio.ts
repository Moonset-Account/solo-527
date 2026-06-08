import { useRef, useCallback } from 'react';
import { AudioManager, type SoundId } from '@/audio/AudioManager';

let audioManager: AudioManager | null = null;

function getAudioManager(): AudioManager {
  if (!audioManager) {
    audioManager = new AudioManager();
  }
  return audioManager;
}

export function useAudio() {
  const managerRef = useRef<AudioManager | null>(null);

  if (!managerRef.current) {
    managerRef.current = getAudioManager();
  }

  const play = useCallback((soundId: SoundId) => {
    managerRef.current?.play(soundId);
  }, []);

  const stop = useCallback((soundId: SoundId) => {
    managerRef.current?.stop(soundId);
  }, []);

  const stopAll = useCallback(() => {
    managerRef.current?.stopAll();
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    managerRef.current?.setMuted(muted);
  }, []);

  const isMuted = useCallback(() => {
    return managerRef.current?.isMuted() ?? false;
  }, []);

  return { play, stop, stopAll, setMuted, isMuted };
}
