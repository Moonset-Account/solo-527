using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace BeatRunner.Audio
{
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [Header("Audio Sources")]
        [SerializeField] private AudioSource _musicSource;
        [SerializeField] private AudioSource _sfxSource;

        [Header("Mix")]
        [Range(0f, 1f)] public float musicVolume = 0.8f;
        [Range(0f, 1f)] public float sfxVolume = 1.0f;

        [Header("Latency")]
        public float audioLatencyMs = 0f;

        [Header("Playback")]
        public double startTime;
        public double currentPlaybackTime;

        public bool IsPlaying => _musicSource != null && _musicSource.isPlaying;
        public AudioClip CurrentClip => _musicSource?.clip;

        public event Action OnBeat;
        public event Action<int> OnBeatIndex;
        public event Action<double> OnPlaybackTimeUpdate;

        private double _startDspTime;
        private Coroutine _playbackCoroutine;
        private bool _isInitialized;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            EnsureAudioSources();
        }

        private void EnsureAudioSources()
        {
            if (_musicSource == null)
            {
                _musicSource = gameObject.AddComponent<AudioSource>();
                _musicSource.playOnAwake = false;
                _musicSource.loop = false;
            }
            if (_sfxSource == null)
            {
                _sfxSource = gameObject.AddComponent<AudioSource>();
                _sfxSource.playOnAwake = false;
                _sfxSource.loop = false;
            }
            _isInitialized = true;
        }

        public void SetLatency(float latencyMs)
        {
            audioLatencyMs = Mathf.Clamp(latencyMs, -500f, 500f);
        }

        public void PlayMusic(AudioClip clip, double delaySeconds = 0.5)
        {
            if (!_isInitialized) EnsureAudioSources();

            StopMusic();
            _musicSource.clip = clip;
            _musicSource.volume = musicVolume;

            startTime = AudioSettings.dspTime + delaySeconds;
            _startDspTime = AudioSettings.dspTime;
            _musicSource.PlayScheduled(startTime);

            if (_playbackCoroutine != null) StopCoroutine(_playbackCoroutine);
            _playbackCoroutine = StartCoroutine(UpdatePlaybackTime());
        }

        public void StopMusic()
        {
            if (_musicSource != null)
            {
                _musicSource.Stop();
            }
            if (_playbackCoroutine != null)
            {
                StopCoroutine(_playbackCoroutine);
                _playbackCoroutine = null;
            }
        }

        public void PauseMusic()
        {
            if (_musicSource != null && _musicSource.isPlaying)
            {
                _musicSource.Pause();
            }
        }

        public void ResumeMusic()
        {
            if (_musicSource != null)
            {
                _musicSource.UnPause();
            }
        }

        private IEnumerator UpdatePlaybackTime()
        {
            while (true)
            {
                double latencySec = audioLatencyMs / 1000.0;
                currentPlaybackTime = (AudioSettings.dspTime - _startDspTime) - latencySec;
                OnPlaybackTimeUpdate?.Invoke(currentPlaybackTime);
                yield return null;
            }
        }

        public void PlaySfx(AudioClip clip, float volumeScale = 1f, float pitch = 1f)
        {
            if (!_isInitialized) EnsureAudioSources();
            if (clip == null || _sfxSource == null) return;

            _sfxSource.pitch = pitch;
            _sfxSource.PlayOneShot(clip, sfxVolume * volumeScale);
        }

        public void InvokeBeat(int beatIndex)
        {
            OnBeat?.Invoke();
            OnBeatIndex?.Invoke(beatIndex);
        }

        public double GetAdjustedTime(double time)
        {
            return time - (audioLatencyMs / 1000.0);
        }
    }
}
