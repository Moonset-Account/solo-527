using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace DecorMatch3.Audio
{
    public enum SFXType
    {
        ButtonClick,
        GemSwap,
        GemMatch,
        GemClear,
        GemFall,
        Combo,
        LevelComplete,
        LevelFailed,
        MaterialGain,
        DecorationPlace,
        CustomerHappy,
        CustomerSad,
        Popup,
        Pause,
        Swipe,
        Tutorial,
        Error
    }

    public enum MusicType
    {
        MainMenu,
        Match3,
        Decoration,
        CustomerReview
    }

    public class AudioManager : DecorMatch3.Core.Singleton<AudioManager>
    {
        [Header("Audio Sources")]
        [SerializeField] private AudioSource musicSource;
        [SerializeField] private AudioSource sfxSource;

        [Header("Pool Settings")]
        [SerializeField] private int sfxPoolSize = 5;

        private List<AudioSource> _sfxPool;
        private int _currentSfxIndex = 0;

        private Dictionary<SFXType, AudioClip> _sfxClips = new Dictionary<SFXType, AudioClip>();
        private Dictionary<MusicType, AudioClip> _musicClips = new Dictionary<MusicType, AudioClip>();

        private float _masterVolume = 1f;
        private float _musicVolume = 0.7f;
        private float _sfxVolume = 1f;
        private bool _musicMuted = false;
        private bool _sfxMuted = false;

        public event Action<MusicType> OnMusicStarted;
        public event Action<SFXType> OnSfxPlayed;

        protected override void Awake()
        {
            base.Awake();
            InitializeAudioSources();
            InitializeSfxPool();
            LoadAllClips();
            ApplySavedSettings();
        }

        private void InitializeAudioSources()
        {
            if (musicSource == null)
            {
                GameObject musicObj = new GameObject("MusicSource");
                musicObj.transform.SetParent(transform);
                musicSource = musicObj.AddComponent<AudioSource>();
                musicSource.loop = true;
                musicSource.playOnAwake = false;
            }

            if (sfxSource == null)
            {
                GameObject sfxObj = new GameObject("SFXSource");
                sfxObj.transform.SetParent(transform);
                sfxSource = sfxObj.AddComponent<AudioSource>();
                sfxSource.loop = false;
                sfxSource.playOnAwake = false;
            }
        }

        private void InitializeSfxPool()
        {
            _sfxPool = new List<AudioSource>();
            for (int i = 0; i < sfxPoolSize; i++)
            {
                GameObject poolObj = new GameObject($"SfxPool_{i}");
                poolObj.transform.SetParent(transform);
                AudioSource source = poolObj.AddComponent<AudioSource>();
                source.loop = false;
                source.playOnAwake = false;
                _sfxPool.Add(source);
            }
        }

        private void LoadAllClips()
        {
            LoadSFXClips();
            LoadMusicClips();
        }

        private void LoadSFXClips()
        {
            foreach (SFXType type in Enum.GetValues(typeof(SFXType)))
            {
                string path = $"Audio/SFX/{type}";
                AudioClip clip = Resources.Load<AudioClip>(path);
                if (clip != null)
                {
                    _sfxClips[type] = clip;
                }
            }
        }

        private void LoadMusicClips()
        {
            foreach (MusicType type in Enum.GetValues(typeof(MusicType)))
            {
                string path = $"Audio/Music/{type}";
                AudioClip clip = Resources.Load<AudioClip>(path);
                if (clip != null)
                {
                    _musicClips[type] = clip;
                }
            }
        }

        private void ApplySavedSettings()
        {
            var settings = DecorMatch3.Data.SaveManager.Instance?.CurrentSave.Settings;
            if (settings != null)
            {
                SetMasterVolume(settings.Audio.MasterVolume);
                SetMusicVolume(settings.Audio.MusicVolume);
                SetSFXVolume(settings.Audio.SFXVolume);
                SetMusicMuted(settings.Audio.MusicMuted);
                SetSFXMuted(settings.Audio.SFXMuted);
            }
        }

        public void PlayMusic(MusicType type, float fadeDuration = 0.5f)
        {
            if (_musicMuted) return;

            if (!_musicClips.TryGetValue(type, out AudioClip clip))
            {
                Debug.LogWarning($"[AudioManager] Music clip not found: {type}");
                return;
            }

            StartCoroutine(CrossFadeMusic(clip, fadeDuration));
            OnMusicStarted?.Invoke(type);
        }

        private IEnumerator CrossFadeMusic(AudioClip newClip, float fadeDuration)
        {
            if (musicSource.isPlaying && fadeDuration > 0)
            {
                float startVolume = musicSource.volume;
                float elapsed = 0f;
                while (elapsed < fadeDuration)
                {
                    elapsed += Time.deltaTime;
                    musicSource.volume = Mathf.Lerp(startVolume, 0, elapsed / fadeDuration);
                    yield return null;
                }
            }

            musicSource.Stop();
            musicSource.clip = newClip;
            musicSource.Play();

            if (fadeDuration > 0)
            {
                float targetVolume = _musicVolume * _masterVolume;
                musicSource.volume = 0;
                float elapsed = 0f;
                while (elapsed < fadeDuration)
                {
                    elapsed += Time.deltaTime;
                    musicSource.volume = Mathf.Lerp(0, targetVolume, elapsed / fadeDuration);
                    yield return null;
                }
            }
        }

        public void StopMusic(float fadeDuration = 0.5f)
        {
            StartCoroutine(FadeOutMusic(fadeDuration));
        }

        private IEnumerator FadeOutMusic(float fadeDuration)
        {
            if (!musicSource.isPlaying) yield break;

            float startVolume = musicSource.volume;
            float elapsed = 0f;
            while (elapsed < fadeDuration)
            {
                elapsed += Time.deltaTime;
                musicSource.volume = Mathf.Lerp(startVolume, 0, elapsed / fadeDuration);
                yield return null;
            }

            musicSource.Stop();
        }

        public void PlaySFX(SFXType type, float volumeScale = 1f, float pitch = 1f)
        {
            if (_sfxMuted) return;

            if (!_sfxClips.TryGetValue(type, out AudioClip clip))
            {
                return;
            }

            AudioSource source = GetPooledSfxSource();
            source.clip = clip;
            source.volume = _sfxVolume * _masterVolume * volumeScale;
            source.pitch = pitch;
            source.Play();

            OnSfxPlayed?.Invoke(type);

            DecorMatch3.Core.EventBus.Publish(new SFXPlayedEvent { SfxType = type });
        }

        public void PlaySFXDelayed(SFXType type, float delay, float volumeScale = 1f, float pitch = 1f)
        {
            StartCoroutine(PlaySFXDelayedCoroutine(type, delay, volumeScale, pitch));
        }

        private IEnumerator PlaySFXDelayedCoroutine(SFXType type, float delay, float volumeScale, float pitch)
        {
            yield return new WaitForSeconds(delay);
            PlaySFX(type, volumeScale, pitch);
        }

        private AudioSource GetPooledSfxSource()
        {
            for (int i = 0; i < _sfxPool.Count; i++)
            {
                if (!_sfxPool[i].isPlaying)
                {
                    return _sfxPool[i];
                }
            }

            _currentSfxIndex = (_currentSfxIndex + 1) % _sfxPool.Count;
            return _sfxPool[_currentSfxIndex];
        }

        public void SetMasterVolume(float volume)
        {
            _masterVolume = Mathf.Clamp01(volume);
            UpdateMusicVolume();
            UpdateSfxVolume();
        }

        public void SetMusicVolume(float volume)
        {
            _musicVolume = Mathf.Clamp01(volume);
            UpdateMusicVolume();
        }

        public void SetSFXVolume(float volume)
        {
            _sfxVolume = Mathf.Clamp01(volume);
            UpdateSfxVolume();
        }

        private void UpdateMusicVolume()
        {
            if (musicSource != null)
            {
                musicSource.volume = _musicVolume * _masterVolume * (_musicMuted ? 0 : 1);
            }
        }

        private void UpdateSfxVolume()
        {
            float actualVolume = _sfxVolume * _masterVolume * (_sfxMuted ? 0 : 1);
            sfxSource.volume = actualVolume;
            foreach (var source in _sfxPool)
            {
                source.volume = actualVolume;
            }
        }

        public void SetMusicMuted(bool muted)
        {
            _musicMuted = muted;
            UpdateMusicVolume();
        }

        public void SetSFXMuted(bool muted)
        {
            _sfxMuted = muted;
            UpdateSfxVolume();
        }

        public void ToggleMusicMute()
        {
            SetMusicMuted(!_musicMuted);
        }

        public void ToggleSFXMute()
        {
            SetSFXMuted(!_sfxMuted);
        }

        public void PauseAll()
        {
            musicSource.Pause();
            foreach (var source in _sfxPool)
            {
                source.Pause();
            }
        }

        public void ResumeAll()
        {
            musicSource.UnPause();
            foreach (var source in _sfxPool)
            {
                if (source.clip != null)
                {
                    source.UnPause();
                }
            }
        }

        public float MasterVolume => _masterVolume;
        public float MusicVolume => _musicVolume;
        public float SFXVolume => _sfxVolume;
        public bool MusicMuted => _musicMuted;
        public bool SFXMuted => _sfxMuted;
    }

    public struct SFXPlayedEvent
    {
        public SFXType SfxType;
    }

    public struct MusicStartedEvent
    {
        public MusicType MusicType;
    }
}
