using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using DecorMatch3.Utils;
using DecorMatch3.Core;
using DecorMatch3.Core.Events;

namespace DecorMatch3.Audio
{
    public enum SfxType
    {
        ButtonClick,
        TileSelect,
        TileSwap,
        TileMatch,
        TileMatchCombo,
        TileFall,
        LevelStart,
        LevelComplete,
        LevelFail,
        MaterialCollect,
        OrderAccept,
        OrderComplete,
        DecorationPlace,
        AchievementUnlock,
        DailyChallengeComplete,
        StarEarn,
        CoinGain,
        PopupShow,
        Error
    }

    public enum MusicType
    {
        MainMenu,
        Match3,
        Decoration,
        Result
    }

    [System.Serializable]
    public class AudioClipMapping
    {
        public SfxType Type;
        public AudioClip Clip;
        [Range(0f, 1f)] public float Volume = 1f;
        [Range(0.5f, 2f)] public float Pitch = 1f;
    }

    [System.Serializable]
    public class MusicClipMapping
    {
        public MusicType Type;
        public AudioClip Clip;
        [Range(0f, 1f)] public float Volume = 0.8f;
        public bool Loop = true;
    }

    public class AudioManager : Singleton<AudioManager>
    {
        [SerializeField] private List<AudioClipMapping> _sfxMappings = new List<AudioClipMapping>();
        [SerializeField] private List<MusicClipMapping> _musicMappings = new List<MusicClipMapping>();

        [SerializeField] private AudioSource _musicSource;
        [SerializeField] private AudioSource _ambientSource;
        [SerializeField] private int _maxSfxSources = 10;

        private readonly List<AudioSource> _sfxSources = new List<AudioSource>();
        private readonly Dictionary<SfxType, AudioClipMapping> _sfxMap = new Dictionary<SfxType, AudioClipMapping>();
        private readonly Dictionary<MusicType, MusicClipMapping> _musicMap = new Dictionary<MusicType, MusicClipMapping>();

        private MusicType _currentMusic = MusicType.MainMenu;
        private Coroutine _fadeCoroutine;

        public float MasterVolume { get; private set; } = 1f;
        public float MusicVolume { get; private set; } = 0.8f;
        public float SfxVolume { get; private set; } = 1f;
        public bool VibrationEnabled { get; private set; } = true;

        protected override void Awake()
        {
            base.Awake();
            InitializeSources();
            BuildMappings();
            LoadVolumeSettings();
            SubscribeToEvents();
        }

        private void Start()
        {
            PlayMusic(MusicType.MainMenu);
        }

        private void InitializeSources()
        {
            if (_musicSource == null)
            {
                GameObject musicGO = new GameObject("MusicSource");
                musicGO.transform.SetParent(transform);
                _musicSource = musicGO.AddComponent<AudioSource>();
            }
            _musicSource.loop = true;
            _musicSource.playOnAwake = false;

            if (_ambientSource == null)
            {
                GameObject ambientGO = new GameObject("AmbientSource");
                ambientGO.transform.SetParent(transform);
                _ambientSource = ambientGO.AddComponent<AudioSource>();
            }
            _ambientSource.loop = true;
            _ambientSource.playOnAwake = false;

            for (int i = 0; i < _maxSfxSources; i++)
            {
                GameObject sfxGO = new GameObject($"SfxSource_{i}");
                sfxGO.transform.SetParent(transform);
                AudioSource source = sfxGO.AddComponent<AudioSource>();
                source.loop = false;
                source.playOnAwake = false;
                _sfxSources.Add(source);
            }
        }

        private void BuildMappings()
        {
            foreach (AudioClipMapping mapping in _sfxMappings)
            {
                _sfxMap[mapping.Type] = mapping;
            }

            foreach (MusicClipMapping mapping in _musicMappings)
            {
                _musicMap[mapping.Type] = mapping;
            }
        }

        private void LoadVolumeSettings()
        {
            if (SaveSystem.Instance != null)
            {
                MasterVolume = SaveSystem.Instance.CurrentSave.MasterVolume;
                MusicVolume = SaveSystem.Instance.CurrentSave.MusicVolume;
                SfxVolume = SaveSystem.Instance.CurrentSave.SFXVolume;
                VibrationEnabled = SaveSystem.Instance.CurrentSave.VibrationEnabled;
            }
            ApplyVolumes();
        }

        private void SubscribeToEvents()
        {
            EventBus.Subscribe<MatchDetectedEvent>(HandleMatchDetected);
            EventBus.Subscribe<TileSwappedEvent>(HandleTileSwapped);
            EventBus.Subscribe<LevelStartedEvent>(_ => PlaySfx(SfxType.LevelStart));
            EventBus.Subscribe<LevelCompletedEvent>(_ => PlaySfx(SfxType.LevelComplete));
            EventBus.Subscribe<LevelFailedEvent>(_ => PlaySfx(SfxType.LevelFail));
            EventBus.Subscribe<MaterialsCollectedEvent>(_ => PlaySfx(SfxType.MaterialCollect));
            EventBus.Subscribe<OrderCompletedEvent>(_ => PlaySfx(SfxType.OrderComplete));
            EventBus.Subscribe<AchievementUnlockedEvent>(_ => PlaySfx(SfxType.AchievementUnlock));
            EventBus.Subscribe<DailyChallengeCompletedEvent>(_ => PlaySfx(SfxType.DailyChallengeComplete));
            EventBus.Subscribe<GameStateChangedEvent>(HandleGameStateChanged);
            EventBus.Subscribe<SettingsChangedEvent>(HandleSettingsChanged);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<MatchDetectedEvent>(HandleMatchDetected);
            EventBus.Unsubscribe<TileSwappedEvent>(HandleTileSwapped);
            EventBus.Unsubscribe<LevelStartedEvent>(_ => PlaySfx(SfxType.LevelStart));
            EventBus.Unsubscribe<LevelCompletedEvent>(_ => PlaySfx(SfxType.LevelComplete));
            EventBus.Unsubscribe<LevelFailedEvent>(_ => PlaySfx(SfxType.LevelFail));
            EventBus.Unsubscribe<MaterialsCollectedEvent>(_ => PlaySfx(SfxType.MaterialCollect));
            EventBus.Unsubscribe<OrderCompletedEvent>(_ => PlaySfx(SfxType.OrderComplete));
            EventBus.Unsubscribe<AchievementUnlockedEvent>(_ => PlaySfx(SfxType.AchievementUnlock));
            EventBus.Unsubscribe<DailyChallengeCompletedEvent>(_ => PlaySfx(SfxType.DailyChallengeComplete));
            EventBus.Unsubscribe<GameStateChangedEvent>(HandleGameStateChanged);
            EventBus.Unsubscribe<SettingsChangedEvent>(HandleSettingsChanged);
        }

        public void PlaySfx(SfxType type, float volumeScale = 1f, float pitchVariance = 0f)
        {
            if (!_sfxMap.TryGetValue(type, out AudioClipMapping mapping))
            {
                Debug.LogWarning($"[AudioManager] SFX not mapped: {type}");
                return;
            }

            AudioSource source = GetAvailableSfxSource();
            if (source == null) return;

            source.clip = mapping.Clip;
            source.volume = mapping.Volume * SfxVolume * MasterVolume * volumeScale;
            source.pitch = mapping.Pitch + Random.Range(-pitchVariance, pitchVariance);
            source.Play();
        }

        public void PlayCustomSfx(AudioClip clip, float volume = 1f, float pitch = 1f)
        {
            AudioSource source = GetAvailableSfxSource();
            if (source == null || clip == null) return;

            source.clip = clip;
            source.volume = volume * SfxVolume * MasterVolume;
            source.pitch = pitch;
            source.Play();
        }

        private AudioSource GetAvailableSfxSource()
        {
            foreach (AudioSource source in _sfxSources)
            {
                if (!source.isPlaying) return source;
            }
            return _sfxSources[Random.Range(0, _sfxSources.Count)];
        }

        public void PlayMusic(MusicType type, float fadeDuration = 1f)
        {
            if (_currentMusic == type && _musicSource.isPlaying) return;

            if (!_musicMap.TryGetValue(type, out MusicClipMapping mapping))
            {
                Debug.LogWarning($"[AudioManager] Music not mapped: {type}");
                return;
            }

            _currentMusic = type;

            if (_fadeCoroutine != null) StopCoroutine(_fadeCoroutine);
            _fadeCoroutine = StartCoroutine(CrossFadeMusic(mapping, fadeDuration));
        }

        private IEnumerator CrossFadeMusic(MusicClipMapping newMusic, float duration)
        {
            if (_musicSource.isPlaying)
            {
                float startVolume = _musicSource.volume;
                float elapsed = 0f;
                while (elapsed < duration / 2f)
                {
                    elapsed += Time.unscaledDeltaTime;
                    _musicSource.volume = Mathf.Lerp(startVolume, 0f, elapsed / (duration / 2f));
                    yield return null;
                }
                _musicSource.Stop();
            }

            _musicSource.clip = newMusic.Clip;
            _musicSource.loop = newMusic.Loop;
            _musicSource.volume = 0f;
            _musicSource.Play();

            float targetVolume = newMusic.Volume * MusicVolume * MasterVolume;
            float fadeElapsed = 0f;
            while (fadeElapsed < duration / 2f)
            {
                fadeElapsed += Time.unscaledDeltaTime;
                _musicSource.volume = Mathf.Lerp(0f, targetVolume, fadeElapsed / (duration / 2f));
                yield return null;
            }
            _musicSource.volume = targetVolume;
        }

        public void StopMusic(float fadeDuration = 0.5f)
        {
            if (_fadeCoroutine != null) StopCoroutine(_fadeCoroutine);
            _fadeCoroutine = StartCoroutine(FadeOutMusic(fadeDuration));
        }

        private IEnumerator FadeOutMusic(float duration)
        {
            float startVolume = _musicSource.volume;
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                _musicSource.volume = Mathf.Lerp(startVolume, 0f, elapsed / duration);
                yield return null;
            }
            _musicSource.Stop();
            _musicSource.volume = startVolume;
        }

        public void TriggerVibration(float duration = 0.1f, float strength = 1f)
        {
            if (!VibrationEnabled) return;
#if UNITY_ANDROID || UNITY_IOS
            Handheld.Vibrate();
#endif
        }

        public void SetMasterVolume(float volume)
        {
            MasterVolume = Mathf.Clamp01(volume);
            SaveSystem.Instance?.UpdateSettings("MasterVolume", MasterVolume);
            ApplyVolumes();
        }

        public void SetMusicVolume(float volume)
        {
            MusicVolume = Mathf.Clamp01(volume);
            SaveSystem.Instance?.UpdateSettings("MusicVolume", MusicVolume);
            ApplyVolumes();
        }

        public void SetSfxVolume(float volume)
        {
            SfxVolume = Mathf.Clamp01(volume);
            SaveSystem.Instance?.UpdateSettings("SFXVolume", SfxVolume);
            ApplyVolumes();
        }

        public void SetVibrationEnabled(bool enabled)
        {
            VibrationEnabled = enabled;
            SaveSystem.Instance?.UpdateSettings("VibrationEnabled", VibrationEnabled);
        }

        private void ApplyVolumes()
        {
            _musicSource.volume = MusicVolume * MasterVolume;
            _ambientSource.volume = MusicVolume * MasterVolume * 0.5f;
        }

        private void HandleMatchDetected(MatchDetectedEvent e)
        {
            if (e.ComboLevel >= 2)
                PlaySfx(SfxType.TileMatchCombo, 1f, 0.1f * e.ComboLevel);
            else
                PlaySfx(SfxType.TileMatch, 1f, 0.05f);

            if (e.ComboLevel >= 3)
                TriggerVibration(0.15f, 0.8f);
        }

        private void HandleTileSwapped(TileSwappedEvent e)
        {
            PlaySfx(e.IsValid ? SfxType.TileSwap : SfxType.Error);
            if (!e.IsValid) TriggerVibration(0.05f, 0.3f);
        }

        private void HandleGameStateChanged(GameStateChangedEvent e)
        {
            switch (e.NewState)
            {
                case GameState.MainMenu:
                    PlayMusic(MusicType.MainMenu);
                    break;
                case GameState.Match3Level:
                    PlayMusic(MusicType.Match3);
                    break;
                case GameState.Decoration:
                case GameState.OrderManagement:
                    PlayMusic(MusicType.Decoration);
                    break;
            }
        }

        private void HandleSettingsChanged(SettingsChangedEvent e)
        {
            switch (e.SettingKey)
            {
                case "MasterVolume":
                    MasterVolume = Convert.ToSingle(e.NewValue);
                    break;
                case "MusicVolume":
                    MusicVolume = Convert.ToSingle(e.NewValue);
                    break;
                case "SFXVolume":
                    SfxVolume = Convert.ToSingle(e.NewValue);
                    break;
                case "VibrationEnabled":
                    VibrationEnabled = Convert.ToBoolean(e.NewValue);
                    break;
            }
            ApplyVolumes();
        }

        public void RegisterSfxMapping(SfxType type, AudioClip clip, float volume = 1f, float pitch = 1f)
        {
            AudioClipMapping mapping = new AudioClipMapping
            {
                Type = type,
                Clip = clip,
                Volume = volume,
                Pitch = pitch
            };
            _sfxMappings.Add(mapping);
            _sfxMap[type] = mapping;
        }

        public void RegisterMusicMapping(MusicType type, AudioClip clip, float volume = 0.8f, bool loop = true)
        {
            MusicClipMapping mapping = new MusicClipMapping
            {
                Type = type,
                Clip = clip,
                Volume = volume,
                Loop = loop
            };
            _musicMappings.Add(mapping);
            _musicMap[type] = mapping;
        }
    }
}
