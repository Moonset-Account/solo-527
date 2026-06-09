using UnityEngine;
using System;
using System.Collections;
using System.Collections.Generic;
using LakeSailing.Core;

namespace LakeSailing.Audio
{
    public enum AudioType
    {
        Master,
        Music,
        SFX,
        Ambient,
        Voice
    }

    public enum SfxType
    {
        ButtonClick,
        BoatEngine,
        BoatSail,
        Wave,
        PhotoShutter,
        WeatherChange,
        Warning,
        Achievement,
        LevelComplete,
        LevelFail,
        Coin,
        LowFuel,
        Wind,
        Rain,
        Thunder
    }

    [Serializable]
    public class AudioClipData
    {
        public SfxType sfxType;
        public AudioClip clip;
        [Range(0f, 1f)] public float volume = 1f;
        [Range(0.5f, 2f)] public float pitch = 1f;
        public bool loop = false;
    }

    public class AudioManager : PersistentSingleton<AudioManager>
    {
        [Header("Audio Sources")]
        [SerializeField] private AudioSource musicSource;
        [SerializeField] private AudioSource sfxSource;
        [SerializeField] private AudioSource ambientSource;

        [Header("Clip Library")]
        [SerializeField] private List<AudioClipData> sfxClips = new List<AudioClipData>();
        [SerializeField] private AudioClip[] musicTracks;
        [SerializeField] private AudioClip[] ambientTracks;

        [Header("Volume Settings")]
        [SerializeField] [Range(0f, 1f)] private float masterVolume = 1f;
        [SerializeField] [Range(0f, 1f)] private float musicVolume = 0.7f;
        [SerializeField] [Range(0f, 1f)] private float sfxVolume = 0.9f;
        [SerializeField] [Range(0f, 1f)] private float ambientVolume = 0.6f;

        [Header("Music Settings")]
        [SerializeField] private float musicFadeDuration = 1.5f;
        [SerializeField] private int currentMusicTrackIndex = -1;
        [SerializeField] private int currentAmbientTrackIndex = -1;

        private Dictionary<SfxType, AudioClipData> sfxLookup;
        private Coroutine activeMusicFade;
        private Coroutine activeAmbientFade;

        protected override void Awake()
        {
            base.Awake();
            InitializeSources();
            BuildSfxLookup();
        }

        private void InitializeSources()
        {
            if (musicSource == null)
            {
                var go = new GameObject("MusicSource");
                go.transform.SetParent(transform);
                musicSource = go.AddComponent<AudioSource>();
                musicSource.loop = true;
                musicSource.playOnAwake = false;
            }
            if (sfxSource == null)
            {
                var go = new GameObject("SFXSource");
                go.transform.SetParent(transform);
                sfxSource = go.AddComponent<AudioSource>();
                sfxSource.loop = false;
                sfxSource.playOnAwake = false;
            }
            if (ambientSource == null)
            {
                var go = new GameObject("AmbientSource");
                go.transform.SetParent(transform);
                ambientSource = go.AddComponent<AudioSource>();
                ambientSource.loop = true;
                ambientSource.playOnAwake = false;
            }
        }

        private void BuildSfxLookup()
        {
            sfxLookup = new Dictionary<SfxType, AudioClipData>();
            foreach (var clip in sfxClips)
            {
                if (clip != null && !sfxLookup.ContainsKey(clip.sfxType))
                {
                    sfxLookup[clip.sfxType] = clip;
                }
            }
        }

        public void ApplySettings(float master, float music, float sfx, float ambient)
        {
            masterVolume = Mathf.Clamp01(master);
            musicVolume = Mathf.Clamp01(music);
            sfxVolume = Mathf.Clamp01(sfx);
            ambientVolume = Mathf.Clamp01(ambient);

            UpdateAllVolumes();
        }

        public void UpdateAllVolumes()
        {
            if (musicSource != null) musicSource.volume = musicVolume * masterVolume;
            if (sfxSource != null) sfxSource.volume = sfxVolume * masterVolume;
            if (ambientSource != null) ambientSource.volume = ambientVolume * masterVolume;
        }

        public void PlaySfx(SfxType type)
        {
            if (sfxLookup.TryGetValue(type, out var data))
            {
                PlaySfxInternal(data.clip, data.volume, data.pitch, data.loop);
            }
        }

        public void PlaySfx(SfxType type, float volumeMultiplier)
        {
            if (sfxLookup.TryGetValue(type, out var data))
            {
                PlaySfxInternal(data.clip, data.volume * volumeMultiplier, data.pitch, data.loop);
            }
        }

        private void PlaySfxInternal(AudioClip clip, float volume, float pitch, bool loop)
        {
            if (clip == null || sfxSource == null) return;

            float finalVolume = volume * sfxVolume * masterVolume;
            if (loop)
            {
                sfxSource.clip = clip;
                sfxSource.volume = finalVolume;
                sfxSource.pitch = pitch;
                sfxSource.loop = true;
                sfxSource.Play();
            }
            else
            {
                sfxSource.PlayOneShot(clip, finalVolume);
            }
        }

        public void PlayMusic(int trackIndex)
        {
            if (musicTracks == null || trackIndex < 0 || trackIndex >= musicTracks.Length) return;
            if (currentMusicTrackIndex == trackIndex && musicSource.isPlaying) return;

            if (activeMusicFade != null) StopCoroutine(activeMusicFade);
            activeMusicFade = StartCoroutine(FadeAndPlayMusic(trackIndex));
        }

        private IEnumerator FadeAndPlayMusic(int trackIndex)
        {
            if (musicSource.isPlaying)
            {
                float startVol = musicSource.volume;
                float elapsed = 0f;
                while (elapsed < musicFadeDuration * 0.5f)
                {
                    elapsed += Time.deltaTime;
                    musicSource.volume = Mathf.Lerp(startVol, 0f, elapsed / (musicFadeDuration * 0.5f));
                    yield return null;
                }
                musicSource.Stop();
            }

            currentMusicTrackIndex = trackIndex;
            musicSource.clip = musicTracks[trackIndex];
            musicSource.volume = 0f;
            musicSource.Play();

            float fadeElapsed = 0f;
            float targetVol = musicVolume * masterVolume;
            while (fadeElapsed < musicFadeDuration * 0.5f)
            {
                fadeElapsed += Time.deltaTime;
                musicSource.volume = Mathf.Lerp(0f, targetVol, fadeElapsed / (musicFadeDuration * 0.5f));
                yield return null;
            }
            musicSource.volume = targetVol;
        }

        public void PlayAmbient(int trackIndex)
        {
            if (ambientTracks == null || trackIndex < 0 || trackIndex >= ambientTracks.Length) return;
            if (currentAmbientTrackIndex == trackIndex && ambientSource.isPlaying) return;

            if (activeAmbientFade != null) StopCoroutine(activeAmbientFade);
            activeAmbientFade = StartCoroutine(FadeAndPlayAmbient(trackIndex));
        }

        private IEnumerator FadeAndPlayAmbient(int trackIndex)
        {
            if (ambientSource.isPlaying)
            {
                float startVol = ambientSource.volume;
                float elapsed = 0f;
                while (elapsed < musicFadeDuration * 0.5f)
                {
                    elapsed += Time.deltaTime;
                    ambientSource.volume = Mathf.Lerp(startVol, 0f, elapsed / (musicFadeDuration * 0.5f));
                    yield return null;
                }
                ambientSource.Stop();
            }

            currentAmbientTrackIndex = trackIndex;
            ambientSource.clip = ambientTracks[trackIndex];
            ambientSource.volume = 0f;
            ambientSource.Play();

            float fadeElapsed = 0f;
            float targetVol = ambientVolume * masterVolume;
            while (fadeElapsed < musicFadeDuration * 0.5f)
            {
                fadeElapsed += Time.deltaTime;
                ambientSource.volume = Mathf.Lerp(0f, targetVol, fadeElapsed / (musicFadeDuration * 0.5f));
                yield return null;
            }
            ambientSource.volume = targetVol;
        }

        public void StopMusic()
        {
            if (musicSource.isPlaying)
            {
                if (activeMusicFade != null) StopCoroutine(activeMusicFade);
                StartCoroutine(FadeOutMusic());
            }
        }

        private IEnumerator FadeOutMusic()
        {
            float startVol = musicSource.volume;
            float elapsed = 0f;
            while (elapsed < musicFadeDuration)
            {
                elapsed += Time.deltaTime;
                musicSource.volume = Mathf.Lerp(startVol, 0f, elapsed / musicFadeDuration);
                yield return null;
            }
            musicSource.Stop();
            currentMusicTrackIndex = -1;
        }

        public void StopAmbient()
        {
            if (ambientSource.isPlaying)
            {
                ambientSource.Stop();
                currentAmbientTrackIndex = -1;
            }
        }

        public void StopSfx()
        {
            sfxSource.Stop();
        }

        public void StopAll()
        {
            StopMusic();
            StopAmbient();
            StopSfx();
        }

        public float GetVolume(AudioType type)
        {
            switch (type)
            {
                case AudioType.Master: return masterVolume;
                case AudioType.Music: return musicVolume;
                case AudioType.SFX: return sfxVolume;
                case AudioType.Ambient: return ambientVolume;
                default: return 1f;
            }
        }

        public void RegisterSfxClip(SfxType type, AudioClip clip, float volume = 1f, float pitch = 1f)
        {
            var data = new AudioClipData { sfxType = type, clip = clip, volume = volume, pitch = pitch };
            sfxClips.Add(data);
            sfxLookup[type] = data;
        }
    }
}
