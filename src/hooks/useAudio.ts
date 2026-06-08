import { useEffect } from 'react';
import * as AudioTrigger from '@/engine/AudioTrigger';
import { useSettingsStore } from '@/store/useSettingsStore';

export function useAudio() {
  const masterVolume = useSettingsStore((s) => s.masterVolume);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const bgmVolume = useSettingsStore((s) => s.bgmVolume);

  useEffect(() => {
    AudioTrigger.init();
  }, []);

  useEffect(() => {
    AudioTrigger.setMasterVolume(masterVolume);
  }, [masterVolume]);

  useEffect(() => {
    AudioTrigger.setSfxVolume(sfxVolume);
  }, [sfxVolume]);

  useEffect(() => {
    AudioTrigger.setBgmVolume(bgmVolume);
  }, [bgmVolume]);
}
