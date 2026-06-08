using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using YouthTrainingManagement.Core;

namespace YouthTrainingManagement.Audio
{
    public enum SoundType
    {
        UIClick,
        UIHover,
        Success,
        Warning,
        Error,
        Achievement,
        StatChange,
        TrainingStart,
        TrainingComplete,
        MatchStart,
        MatchWhistle,
        GoalScored,
        CrowdCheer,
        CrowdBoo,
        Injury,
        RecoveryComplete,
        MenuOpen,
        MenuClose,
        ButtonPress,
        SliderMove
    }

    public enum MusicType
    {
        MainMenu,
        Training,
        Match,
        Result,
        Ambient
    }

    public enum VolumeChannel
    {
        Master,
        Music,
        SFX,
        UI
    }

    [Serializable]
    public class SoundClip
    {
        public SoundType Type;
        public AudioClip Clip;
        [Range(0f, 2f)] public float Volume = 1f;
        [Range(0.1f, 3f)] public float Pitch = 1f;
        public bool Loop;
    }

    [Serializable]
    public class MusicTrack
    {
        public MusicType Type;
        public AudioClip Clip;
        [Range(0f, 1f)] public float Volume = 0.7f;
    }

    public class AudioManager
    {
        private readonly GameManager _gameManager;
        private GameObject _audioObject;
        private AudioSource _musicSource;
        private readonly List<AudioSource> _sfxSources = new List<AudioSource>();
        private readonly Dictionary<SoundType, SoundClip> _soundClips = new Dictionary<SoundType, SoundClip>();
        private readonly Dictionary<MusicType, MusicTrack> _musicTracks = new Dictionary<MusicType, MusicTrack>();
        private readonly Dictionary<VolumeChannel, float> _volumes = new Dictionary<VolumeChannel, float>();

        private const int MaxSFXChannels = 16;

        public AudioManager(GameManager gameManager)
        {
            _gameManager = gameManager ?? throw new ArgumentNullException(nameof(gameManager));
        }

        public void Initialize()
        {
            try
            {
                CreateAudioHierarchy();
                InitializeVolumes();
                LoadDefaultAudioData();
                Debug.Log("AudioManager initialized.");
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to initialize AudioManager: {ex.Message}");
            }
        }

        private void CreateAudioHierarchy()
        {
            _audioObject = new GameObject("AudioManager");
            if (_gameManager != null)
                _audioObject.transform.SetParent(_gameManager.transform);

            _musicSource = _audioObject.AddComponent<AudioSource>();
            _musicSource.playOnAwake = false;
            _musicSource.loop = true;
            _musicSource.spatialBlend = 0f;

            for (int i = 0; i < MaxSFXChannels; i++)
            {
                var src = _audioObject.AddComponent<AudioSource>();
                src.playOnAwake = false;
                src.loop = false;
                src.spatialBlend = 0f;
                _sfxSources.Add(src);
            }
        }

        private void InitializeVolumes()
        {
            _volumes[VolumeChannel.Master] = _gameManager.Settings.MasterVolume;
            _volumes[VolumeChannel.Music] = _gameManager.Settings.MusicVolume;
            _volumes[VolumeChannel.SFX] = _gameManager.Settings.SFXVolume;
            _volumes[VolumeChannel.UI] = _gameManager.Settings.UIVolume;
        }

        private void LoadDefaultAudioData()
        {
            var defaultSounds = new List<(SoundType type, float vol, float pitch)>
            {
                (SoundType.UIClick, 0.6f, 1f),
                (SoundType.UIHover, 0.3f, 1.1f),
                (SoundType.Success, 0.8f, 1f),
                (SoundType.Warning, 0.7f, 0.9f),
                (SoundType.Error, 0.8f, 0.85f),
                (SoundType.Achievement, 0.9f, 1f),
                (SoundType.StatChange, 0.5f, 1.2f),
                (SoundType.TrainingStart, 0.7f, 1f),
                (SoundType.TrainingComplete, 0.8f, 1f),
                (SoundType.MatchStart, 0.9f, 1f),
                (SoundType.MatchWhistle, 1f, 1f),
                (SoundType.GoalScored, 1f, 1f),
                (SoundType.CrowdCheer, 0.7f, 1f),
                (SoundType.CrowdBoo, 0.7f, 1f),
                (SoundType.Injury, 0.8f, 0.9f),
                (SoundType.RecoveryComplete, 0.7f, 1f),
                (SoundType.MenuOpen, 0.5f, 1.1f),
                (SoundType.MenuClose, 0.5f, 0.95f),
                (SoundType.ButtonPress, 0.6f, 1.05f),
                (SoundType.SliderMove, 0.3f, 1.15f)
            };

            foreach (var s in defaultSounds)
            {
                _soundClips[s.type] = new SoundClip
                {
                    Type = s.type,
                    Volume = s.vol,
                    Pitch = s.pitch
                };
            }

            var defaultTracks = new List<(MusicType type, float vol)>
            {
                (MusicType.MainMenu, 0.6f),
                (MusicType.Training, 0.5f),
                (MusicType.Match, 0.7f),
                (MusicType.Result, 0.65f),
                (MusicType.Ambient, 0.3f)
            };
            foreach (var t in defaultTracks)
            {
                _musicTracks[t.type] = new MusicTrack { Type = t.type, Volume = t.vol };
            }
        }

        public void SetVolume(VolumeChannel channel, float value)
        {
            value = Math.Clamp(value, 0f, 1f);
            _volumes[channel] = value;

            if (channel == VolumeChannel.Master || channel == VolumeChannel.Music)
            {
                _musicSource.volume = _musicTracks.TryGetValue(MusicType.MainMenu, out var t)
                    ? t.Volume * _volumes[VolumeChannel.Music] * _volumes[VolumeChannel.Master]
                    : _volumes[VolumeChannel.Music] * _volumes[VolumeChannel.Master];
            }
        }

        public float GetVolume(VolumeChannel channel)
        {
            return _volumes.TryGetValue(channel, out var v) ? v : 1f;
        }

        public void PlaySound(SoundType type)
        {
            if (!_soundClips.TryGetValue(type, out var clip)) return;

            var source = GetAvailableSFXSource();
            if (source == null) return;

            float finalVolume = clip.Volume * _volumes[VolumeChannel.SFX] * _volumes[VolumeChannel.Master];
            if (type == SoundType.UIClick || type == SoundType.UIHover ||
                type == SoundType.ButtonPress || type == SoundType.SliderMove ||
                type == SoundType.MenuOpen || type == SoundType.MenuClose)
            {
                finalVolume = clip.Volume * _volumes[VolumeChannel.UI] * _volumes[VolumeChannel.Master];
            }

            source.clip = clip.Clip;
            source.volume = finalVolume;
            source.pitch = clip.Pitch;
            source.loop = clip.Loop;
            source.Play();
        }

        public void PlaySoundWithPitchVariation(SoundType type, float variation = 0.1f)
        {
            if (!_soundClips.TryGetValue(type, out var clip)) return;

            var source = GetAvailableSFXSource();
            if (source == null) return;

            float finalVolume = clip.Volume * _volumes[VolumeChannel.SFX] * _volumes[VolumeChannel.Master];
            float variedPitch = clip.Pitch * (1f + (UnityEngine.Random.value * 2f - 1f) * variation);

            source.clip = clip.Clip;
            source.volume = finalVolume;
            source.pitch = Math.Clamp(variedPitch, 0.2f, 3f);
            source.loop = clip.Loop;
            source.Play();
        }

        public void PlayMusic(MusicType type, bool fade = true)
        {
            if (!_musicTracks.TryGetValue(type, out var track)) return;

            _gameManager?.StartCoroutine(PlayMusicRoutine(track, fade));
        }

        private IEnumerator PlayMusicRoutine(MusicTrack track, bool fade)
        {
            float targetVolume = track.Volume * _volumes[VolumeChannel.Music] * _volumes[VolumeChannel.Master];

            if (fade && _musicSource.isPlaying)
            {
                float startVol = _musicSource.volume;
                float fadeOut = 0.5f;
                for (float t = 0; t < fadeOut; t += Time.unscaledDeltaTime)
                {
                    _musicSource.volume = Mathf.Lerp(startVol, 0f, t / fadeOut);
                    yield return null;
                }
                _musicSource.Stop();
            }

            if (track.Clip != null)
            {
                _musicSource.clip = track.Clip;
                _musicSource.Play();
            }

            if (fade)
            {
                _musicSource.volume = 0f;
                float fadeIn = 0.5f;
                for (float t = 0; t < fadeIn; t += Time.unscaledDeltaTime)
                {
                    _musicSource.volume = Mathf.Lerp(0f, targetVolume, t / fadeIn);
                    yield return null;
                }
            }
            _musicSource.volume = targetVolume;
        }

        public void StopMusic(bool fade = true)
        {
            _gameManager?.StartCoroutine(StopMusicRoutine(fade));
        }

        private IEnumerator StopMusicRoutine(bool fade)
        {
            if (fade && _musicSource.isPlaying)
            {
                float startVol = _musicSource.volume;
                float fadeOut = 0.5f;
                for (float t = 0; t < fadeOut; t += Time.unscaledDeltaTime)
                {
                    _musicSource.volume = Mathf.Lerp(startVol, 0f, t / fadeOut);
                    yield return null;
                }
            }
            _musicSource.Stop();
        }

        private AudioSource GetAvailableSFXSource()
        {
            foreach (var src in _sfxSources)
            {
                if (!src.isPlaying) return src;
            }
            return _sfxSources.Count > 0 ? _sfxSources[0] : null;
        }

        public void StopAllSounds()
        {
            foreach (var src in _sfxSources) src.Stop();
            StopMusic(true);
        }

        public void RegisterClip(SoundType type, AudioClip clip)
        {
            if (!_soundClips.ContainsKey(type))
            {
                _soundClips[type] = new SoundClip { Type = type, Volume = 1f, Pitch = 1f };
            }
            _soundClips[type].Clip = clip;
        }

        public void RegisterMusic(MusicType type, AudioClip clip)
        {
            if (!_musicTracks.ContainsKey(type))
            {
                _musicTracks[type] = new MusicTrack { Type = type, Volume = 0.7f };
            }
            _musicTracks[type].Clip = clip;
        }
    }
}
