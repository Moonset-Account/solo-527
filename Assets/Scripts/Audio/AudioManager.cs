using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using SpaceCourier.Core;
using SpaceCourier.SaveSystem;

namespace SpaceCourier.Audio
{
    public enum SfxType
    {
        UI_ButtonClick,
        UI_PanelOpen,
        UI_PanelClose,
        UI_Notification,
        UI_Error,

        Node_Select,
        Node_Hover,
        Route_Planning,
        Route_Confirm,

        Ship_EngineStart,
        Ship_Traveling,
        Ship_Arrive,
        Ship_FuelLow,

        Contract_Accept,
        Contract_Complete,
        Contract_Fail,

        Event_Trigger,
        Event_Positive,
        Event_Negative,
        Event_Critical,

        Turn_Start,
        Turn_End,
        Turn_Warning,

        Refuel_Start,
        Refuel_Complete,

        Game_Victory,
        Game_Defeat
    }

    public enum MusicType
    {
        MainMenu,
        MapExploration,
        EventTension,
        Victory,
        Defeat
    }

    public class AudioManager : MonoBehaviour, IModule
    {
        public ModuleType Type => ModuleType.AudioManager;

        [Header("Audio Sources")]
        public AudioSource musicSource;
        public AudioSource sfxSource;
        public AudioSource ambientSource;

        [Header("Audio Clips (可在Inspector配置或代码加载)")]
        public List<SfxAudioClipEntry> sfxClips = new List<SfxAudioClipEntry>();
        public List<MusicAudioClipEntry> musicClips = new List<MusicAudioClipEntry>();

        [Header("Volume Settings")]
        [Range(0, 1)] public float masterVolume = 1.0f;
        [Range(0, 1)] public float musicVolume = 0.8f;
        [Range(0, 1)] public float sfxVolume = 0.9f;
        public bool muted = false;

        [Header("Fade Settings")]
        public float defaultFadeDuration = 0.8f;
        public AnimationCurve fadeCurve = AnimationCurve.EaseInOut(0, 0, 1, 1);

        [Header("Pooling")]
        public int maxSfxInstances = 8;
        public float sfxCooldown = 0.05f;

        private Dictionary<SfxType, AudioClip> sfxLookup = new Dictionary<SfxType, AudioClip>();
        private Dictionary<MusicType, AudioClip> musicLookup = new Dictionary<MusicType, AudioClip>();

        private MusicType currentMusic = MusicType.MainMenu;
        private Coroutine fadeCoroutine;
        private Coroutine ambientCoroutine;
        private float lastSfxTime;

        private SaveManager saveManager;

        public event Action<float> OnMasterVolumeChanged;
        public event Action<float> OnMusicVolumeChanged;
        public event Action<float> OnSfxVolumeChanged;
        public event Action<bool> OnMuteStateChanged;

        public void Initialize()
        {
            EnsureAudioSources();
            InitializeClipLookup();
            LoadVolumeSettings();
            SubscribeToEvents();

            Debug.Log("[AudioManager] Initialized.");
            PlayMusic(MusicType.MainMenu);
        }

        private void EnsureAudioSources()
        {
            if (musicSource == null)
            {
                var go = new GameObject("MusicSource");
                go.transform.SetParent(transform, false);
                musicSource = go.AddComponent<AudioSource>();
                musicSource.loop = true;
                musicSource.playOnAwake = false;
                musicSource.priority = 0;
            }

            if (sfxSource == null)
            {
                var go = new GameObject("SfxSource");
                go.transform.SetParent(transform, false);
                sfxSource = go.AddComponent<AudioSource>();
                sfxSource.loop = false;
                sfxSource.playOnAwake = false;
                sfxSource.priority = 128;
            }

            if (ambientSource == null)
            {
                var go = new GameObject("AmbientSource");
                go.transform.SetParent(transform, false);
                ambientSource = go.AddComponent<AudioSource>();
                ambientSource.loop = true;
                ambientSource.playOnAwake = false;
                ambientSource.priority = 200;
                ambientSource.volume = 0.15f;
            }
        }

        private void InitializeClipLookup()
        {
            sfxLookup.Clear();
            foreach (var entry in sfxClips)
            {
                if (entry.Clip != null && !sfxLookup.ContainsKey(entry.Type))
                {
                    sfxLookup[entry.Type] = entry.Clip;
                }
            }

            musicLookup.Clear();
            foreach (var entry in musicClips)
            {
                if (entry.Clip != null && !musicLookup.ContainsKey(entry.Type))
                {
                    musicLookup[entry.Type] = entry.Clip;
                }
            }

            if (sfxLookup.Count == 0) GeneratePlaceholders();
        }

        private void GeneratePlaceholders()
        {
            foreach (SfxType type in Enum.GetValues(typeof(SfxType)))
            {
                if (!sfxLookup.ContainsKey(type))
                {
                    sfxLookup[type] = GenerateToneClip(GetSfxTone(type), 0.1f, 440);
                }
            }

            foreach (MusicType type in Enum.GetValues(typeof(MusicType)))
            {
                if (!musicLookup.ContainsKey(type))
                {
                    musicLookup[type] = GenerateToneClip(0.15f, 5f, GetMusicTone(type));
                }
            }
        }

        private int GetSfxTone(SfxType type)
        {
            switch (type)
            {
                case SfxType.UI_ButtonClick: return 880;
                case SfxType.UI_PanelOpen: return 660;
                case SfxType.UI_PanelClose: return 330;
                case SfxType.UI_Notification: return 770;
                case SfxType.UI_Error: return 200;

                case SfxType.Node_Select: return 520;
                case SfxType.Node_Hover: return 440;
                case SfxType.Route_Planning: return 392;
                case SfxType.Route_Confirm: return 588;

                case SfxType.Ship_EngineStart: return 150;
                case SfxType.Ship_Traveling: return 180;
                case SfxType.Ship_Arrive: return 520;
                case SfxType.Ship_FuelLow: return 220;

                case SfxType.Contract_Accept: return 660;
                case SfxType.Contract_Complete: return 880;
                case SfxType.Contract_Fail: return 165;

                case SfxType.Event_Trigger: return 400;
                case SfxType.Event_Positive: return 990;
                case SfxType.Event_Negative: return 260;
                case SfxType.Event_Critical: return 196;

                case SfxType.Turn_Start: return 523;
                case SfxType.Turn_End: return 392;
                case SfxType.Turn_Warning: return 294;

                case SfxType.Refuel_Start: return 300;
                case SfxType.Refuel_Complete: return 600;

                case SfxType.Game_Victory: return 1047;
                case SfxType.Game_Defeat: return 130;
                default: return 440;
            }
        }

        private int GetMusicTone(MusicType type)
        {
            switch (type)
            {
                case MusicType.MainMenu: return 220;
                case MusicType.MapExploration: return 262;
                case MusicType.EventTension: return 175;
                case MusicType.Victory: return 330;
                case MusicType.Defeat: return 146;
                default: return 220;
            }
        }

        private AudioClip GenerateToneClip(float volume, float duration, int frequency)
        {
            int sampleRate = 44100;
            int sampleCount = Mathf.RoundToInt(duration * sampleRate);
            float[] samples = new float[sampleCount];

            for (int i = 0; i < sampleCount; i++)
            {
                float t = (float)i / sampleRate;
                float envelope = Mathf.Sin(Mathf.PI * (float)i / sampleCount);
                float tone = Mathf.Sin(2f * Mathf.PI * frequency * t);
                samples[i] = tone * envelope * volume * 0.5f;
            }

            var clip = AudioClip.Create("Tone_" + frequency, sampleCount, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        private void LoadVolumeSettings()
        {
            saveManager = GameManager.Instance?.GetModule<SaveManager>(ModuleType.SaveManager);
            if (saveManager == null) return;

            var settings = saveManager.LoadSettings();
            masterVolume = settings.Muted ? 0f : settings.MasterVolume;
            musicVolume = settings.MusicVolume;
            sfxVolume = settings.SfxVolume;
            muted = settings.Muted;

            ApplyVolume();
        }

        private void SubscribeToEvents()
        {
            EventBus.Subscribe<GameEvents.SettingsChanged>(HandleSettingsChanged);
            EventBus.Subscribe<GameEvents.GameStarted>(HandleGameStarted);
            EventBus.Subscribe<GameEvents.GameEnded>(HandleGameEnded);
            EventBus.Subscribe<GameEvents.NodeSelected>(HandleNodeSelected);
            EventBus.Subscribe<GameEvents.RoutePlanned>(HandleRoutePlanned);
            EventBus.Subscribe<GameEvents.ShipMoved>(HandleShipMoved);
            EventBus.Subscribe<GameEvents.EventCardDrawn>(HandleEventDrawn);
            EventBus.Subscribe<GameEvents.EventResolved>(HandleEventResolved);
            EventBus.Subscribe<GameEvents.ContractAccepted>(HandleContractAccepted);
            EventBus.Subscribe<GameEvents.ContractCompleted>(HandleContractCompleted);
            EventBus.Subscribe<GameEvents.FuelChanged>(HandleFuelChanged);
            EventBus.Subscribe<GameEvents.TurnStarted>(HandleTurnStarted);
        }

        private void HandleSettingsChanged(GameEvents.SettingsChanged e)
        {
            SetMasterVolume(e.MasterVolume);
            SetMusicVolume(e.MusicVolume);
            SetSfxVolume(e.SfxVolume);
        }

        private void HandleGameStarted(GameEvents.GameStarted e)
        {
            PlayMusic(MusicType.MapExploration, true);
            PlaySfx(SfxType.UI_PanelOpen);
        }

        private void HandleGameEnded(GameEvents.GameEnded e)
        {
            if (e.IsVictory)
            {
                PlayMusic(MusicType.Victory, true);
                PlaySfx(SfxType.Game_Victory);
            }
            else
            {
                PlayMusic(MusicType.Defeat, true);
                PlaySfx(SfxType.Game_Defeat);
            }
        }

        private void HandleNodeSelected(GameEvents.NodeSelected e)
        {
            PlaySfx(SfxType.Node_Select);
        }

        private void HandleRoutePlanned(GameEvents.RoutePlanned e)
        {
            PlaySfx(SfxType.Route_Confirm);
        }

        private void HandleShipMoved(GameEvents.ShipMoved e)
        {
            PlaySfx(SfxType.Ship_Arrive);
        }

        private void HandleEventDrawn(GameEvents.EventCardDrawn e)
        {
            PlayMusic(MusicType.EventTension, true);
            PlaySfx(SfxType.Event_Trigger);
        }

        private void HandleEventResolved(GameEvents.EventResolved e)
        {
            PlayMusic(MusicType.MapExploration, true);
        }

        private void HandleContractAccepted(GameEvents.ContractAccepted e)
        {
            PlaySfx(SfxType.Contract_Accept);
        }

        private void HandleContractCompleted(GameEvents.ContractCompleted e)
        {
            PlaySfx(e.IsSuccess ? SfxType.Contract_Complete : SfxType.Contract_Fail);
        }

        private void HandleFuelChanged(GameEvents.FuelChanged e)
        {
            if ((float)e.CurrentFuel / e.MaxFuel <= 0.2f && e.Delta < 0)
            {
                PlaySfx(SfxType.Ship_FuelLow);
            }
        }

        private void HandleTurnStarted(GameEvents.TurnStarted e)
        {
            PlaySfx(SfxType.Turn_Start);
        }

        public void SetMasterVolume(float volume)
        {
            masterVolume = Mathf.Clamp01(volume);
            ApplyVolume();
            OnMasterVolumeChanged?.Invoke(masterVolume);
        }

        public void SetMusicVolume(float volume)
        {
            musicVolume = Mathf.Clamp01(volume);
            ApplyVolume();
            OnMusicVolumeChanged?.Invoke(musicVolume);
        }

        public void SetSfxVolume(float volume)
        {
            sfxVolume = Mathf.Clamp01(volume);
            ApplyVolume();
            OnSfxVolumeChanged?.Invoke(sfxVolume);
        }

        public void SetMuted(bool isMuted)
        {
            muted = isMuted;
            ApplyVolume();
            OnMuteStateChanged?.Invoke(muted);
        }

        private void ApplyVolume()
        {
            float m = muted ? 0f : masterVolume;
            if (musicSource != null) musicSource.volume = m * musicVolume;
            if (sfxSource != null) sfxSource.volume = m * sfxVolume;
            if (ambientSource != null) ambientSource.volume = m * musicVolume * 0.2f;
        }

        public void PlaySfx(SfxType type, float volumeScale = 1f, float pitchVariance = 0.05f)
        {
            if (Time.realtimeSinceStartup - lastSfxTime < sfxCooldown) return;

            if (!sfxLookup.TryGetValue(type, out var clip)) return;
            if (clip == null || sfxSource == null) return;

            float pitch = 1f + UnityEngine.Random.Range(-pitchVariance, pitchVariance);
            sfxSource.pitch = pitch;
            sfxSource.PlayOneShot(clip, volumeScale);
            lastSfxTime = Time.realtimeSinceStartup;
        }

        public void PlaySfxAtPosition(SfxType type, Vector3 position, float volumeScale = 1f)
        {
            if (!sfxLookup.TryGetValue(type, out var clip)) return;
            if (clip == null) return;

            AudioSource.PlayClipAtPoint(clip, position, (muted ? 0f : masterVolume) * sfxVolume * volumeScale);
        }

        public void PlayMusic(MusicType type, bool fade = false)
        {
            if (currentMusic == type && musicSource != null && musicSource.isPlaying) return;
            if (!musicLookup.TryGetValue(type, out var clip)) return;

            currentMusic = type;

            if (fade && musicSource != null)
            {
                if (fadeCoroutine != null) StopCoroutine(fadeCoroutine);
                fadeCoroutine = StartCoroutine(FadeToMusicCoroutine(clip));
            }
            else if (musicSource != null)
            {
                musicSource.clip = clip;
                musicSource.Play();
            }
        }

        private IEnumerator FadeToMusicCoroutine(AudioClip newClip)
        {
            if (musicSource == null) yield break;

            float startVolume = musicSource.volume;
            float targetVolume = (muted ? 0f : masterVolume) * musicVolume;

            float elapsed = 0f;
            float halfDuration = defaultFadeDuration / 2f;

            while (elapsed < halfDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / halfDuration;
                musicSource.volume = Mathf.Lerp(startVolume, 0f, t);
                yield return null;
            }

            musicSource.clip = newClip;
            musicSource.Play();

            elapsed = 0f;
            while (elapsed < halfDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / halfDuration;
                musicSource.volume = Mathf.Lerp(0f, targetVolume, t);
                yield return null;
            }

            musicSource.volume = targetVolume;
        }

        public void PauseMusic()
        {
            if (musicSource != null) musicSource.Pause();
        }

        public void ResumeMusic()
        {
            if (musicSource != null) musicSource.UnPause();
        }

        public void StopAllAudio()
        {
            if (musicSource != null) musicSource.Stop();
            if (sfxSource != null) sfxSource.Stop();
            if (ambientSource != null) ambientSource.Stop();
        }

        public void StartAmbient()
        {
            if (ambientCoroutine != null || ambientSource == null) return;
            ambientCoroutine = StartCoroutine(AmbientLoop());
        }

        private IEnumerator AmbientLoop()
        {
            while (true)
            {
                PlaySfxAtPosition(SfxType.Ship_Traveling, Vector3.zero, 0.3f);
                yield return new WaitForSeconds(1.5f);
            }
        }

        public void StopAmbient()
        {
            if (ambientCoroutine != null)
            {
                StopCoroutine(ambientCoroutine);
                ambientCoroutine = null;
            }
        }

        public void Shutdown()
        {
            StopAllAudio();
            EventBus.Unsubscribe<GameEvents.SettingsChanged>(HandleSettingsChanged);
            EventBus.Unsubscribe<GameEvents.GameStarted>(HandleGameStarted);
            EventBus.Unsubscribe<GameEvents.GameEnded>(HandleGameEnded);
            EventBus.Unsubscribe<GameEvents.NodeSelected>(HandleNodeSelected);
            EventBus.Unsubscribe<GameEvents.RoutePlanned>(HandleRoutePlanned);
            EventBus.Unsubscribe<GameEvents.ShipMoved>(HandleShipMoved);
            EventBus.Unsubscribe<GameEvents.EventCardDrawn>(HandleEventDrawn);
            EventBus.Unsubscribe<GameEvents.EventResolved>(HandleEventResolved);
            EventBus.Unsubscribe<GameEvents.ContractAccepted>(HandleContractAccepted);
            EventBus.Unsubscribe<GameEvents.ContractCompleted>(HandleContractCompleted);
            EventBus.Unsubscribe<GameEvents.FuelChanged>(HandleFuelChanged);
            EventBus.Unsubscribe<GameEvents.TurnStarted>(HandleTurnStarted);

            Debug.Log("[AudioManager] Shutdown.");
        }
    }

    [Serializable]
    public class SfxAudioClipEntry
    {
        public SfxType Type;
        public AudioClip Clip;
    }

    [Serializable]
    public class MusicAudioClipEntry
    {
        public MusicType Type;
        public AudioClip Clip;
    }
}
