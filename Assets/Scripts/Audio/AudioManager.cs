using UnityEngine;
using System.Collections.Generic;

namespace InkMountainBridge
{
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [SerializeField] private AudioEventConfig audioEventConfig;
        [SerializeField] private float musicVolume = 1f;
        [SerializeField] private float sfxVolume = 1f;
        [SerializeField] private AudioSource musicSource;
        [SerializeField] private int sfxPoolSize = 10;

        private List<AudioSource> sfxPool;
        private int sfxPoolIndex;
        private Dictionary<string, AudioClip> clipCache;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);

            InitializeSFXPool();
            clipCache = new Dictionary<string, AudioClip>();

            if (musicSource == null)
            {
                GameObject musicObj = new GameObject("MusicSource");
                musicObj.transform.SetParent(transform);
                musicSource = musicObj.AddComponent<AudioSource>();
                musicSource.loop = true;
                musicSource.volume = musicVolume;
            }
        }

        private void InitializeSFXPool()
        {
            sfxPool = new List<AudioSource>(sfxPoolSize);
            for (int i = 0; i < sfxPoolSize; i++)
            {
                GameObject sfxObj = new GameObject($"SFX_{i}");
                sfxObj.transform.SetParent(transform);
                AudioSource source = sfxObj.AddComponent<AudioSource>();
                source.playOnAwake = false;
                source.volume = sfxVolume;
                sfxPool.Add(source);
            }
            sfxPoolIndex = 0;
        }

        public void PlaySFX(string clipPath)
        {
            AudioClip clip = LoadClip(clipPath);
            if (clip == null) return;

            AudioSource source = GetNextSFXSource();
            source.clip = clip;
            source.volume = sfxVolume;
            source.Play();
        }

        public void PlayMusic(string clipPath)
        {
            AudioClip clip = LoadClip(clipPath);
            if (clip == null) return;

            musicSource.clip = clip;
            musicSource.volume = musicVolume;
            musicSource.Play();
        }

        public void StopMusic()
        {
            if (musicSource != null)
                musicSource.Stop();
        }

        public void SetMusicVolume(float volume)
        {
            musicVolume = Mathf.Clamp01(volume);
            if (musicSource != null)
                musicSource.volume = musicVolume;
        }

        public void SetSFXVolume(float volume)
        {
            sfxVolume = Mathf.Clamp01(volume);
            foreach (AudioSource source in sfxPool)
            {
                source.volume = sfxVolume;
            }
        }

        public void PlayAudioEvent(AudioEventType eventType)
        {
            if (audioEventConfig == null) return;

            string clipPath = GetClipPathForEvent(eventType);
            if (string.IsNullOrEmpty(clipPath)) return;

            AudioClip clip = LoadClip(clipPath);
            if (clip == null) return;

            AudioSource source = GetNextSFXSource();
            source.clip = clip;
            source.volume = sfxVolume;
            source.Play();
        }

        private AudioSource GetNextSFXSource()
        {
            AudioSource source = sfxPool[sfxPoolIndex];
            sfxPoolIndex = (sfxPoolIndex + 1) % sfxPool.Count;
            return source;
        }

        private string GetClipPathForEvent(AudioEventType eventType)
        {
            switch (eventType)
            {
                case AudioEventType.BeamPlace: return audioEventConfig.beamPlaceClip;
                case AudioEventType.RopePlace: return audioEventConfig.ropePlaceClip;
                case AudioEventType.PierPlace: return audioEventConfig.pierPlaceClip;
                case AudioEventType.BridgeSnap: return audioEventConfig.bridgeSnapClip;
                case AudioEventType.BridgeCreak: return audioEventConfig.bridgeCreakClip;
                case AudioEventType.CaravanMove: return audioEventConfig.caravanMoveClip;
                case AudioEventType.CaravanFall: return audioEventConfig.caravanFallClip;
                case AudioEventType.SuccessFanfare: return audioEventConfig.successFanfareClip;
                case AudioEventType.FailureDrum: return audioEventConfig.failureDrumClip;
                case AudioEventType.RainAmbient: return audioEventConfig.rainAmbientClip;
                case AudioEventType.WindAmbient: return audioEventConfig.windAmbientClip;
                case AudioEventType.StormAmbient: return audioEventConfig.stormAmbientClip;
                case AudioEventType.ButtonClick: return audioEventConfig.buttonClickClip;
                case AudioEventType.TutorialStep: return audioEventConfig.tutorialStepClip;
                case AudioEventType.BudgetWarning: return audioEventConfig.budgetWarningClip;
                case AudioEventType.StressWarning: return audioEventConfig.stressWarningClip;
                default: return null;
            }
        }

        private AudioClip LoadClip(string path)
        {
            if (string.IsNullOrEmpty(path)) return null;

            if (clipCache.TryGetValue(path, out AudioClip cached))
                return cached;

            AudioClip clip = Resources.Load<AudioClip>(path);
            if (clip != null)
                clipCache[path] = clip;

            return clip;
        }

        private void OnDestroy()
        {
            if (Instance == this)
                Instance = null;
        }
    }
}
