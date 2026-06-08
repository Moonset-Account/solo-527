using UnityEngine;
using System.Collections.Generic;

namespace ShadowPlatformer.Audio
{
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [Header("Sources")]
        public AudioSource musicSource;
        public AudioSource sfxSource;

        [Header("Music")]
        public AudioClip menuMusic;
        public AudioClip[] levelMusicTracks;

        [Header("SFX")]
        public AudioClip jumpSfx;
        public AudioClip landSfx;
        public AudioClip deathSfx;
        public AudioClip checkpointSfx;
        public AudioClip lightSwitchSfx;
        public AudioClip mechanismActivateSfx;
        public AudioClip doorOpenSfx;
        public AudioClip levelCompleteSfx;

        private float _masterVolume = 1f;
        private float _musicVolume = 0.8f;
        private float _sfxVolume = 1f;
        private Dictionary<string, AudioClip> _sfxMap = new Dictionary<string, AudioClip>();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            var musicGo = new GameObject("MusicSource");
            musicGo.transform.SetParent(transform);
            musicSource = musicGo.AddComponent<AudioSource>();
            musicSource.loop = true;
            musicSource.playOnAwake = false;

            var sfxGo = new GameObject("SFXSource");
            sfxGo.transform.SetParent(transform);
            sfxSource = sfxGo.AddComponent<AudioSource>();
            sfxSource.playOnAwake = false;

            BuildSfxMap();
        }

        private void BuildSfxMap()
        {
            if (jumpSfx != null) _sfxMap["Jump"] = jumpSfx;
            if (landSfx != null) _sfxMap["Land"] = landSfx;
            if (deathSfx != null) _sfxMap["Death"] = deathSfx;
            if (checkpointSfx != null) _sfxMap["Checkpoint"] = checkpointSfx;
            if (lightSwitchSfx != null) _sfxMap["LightSwitch"] = lightSwitchSfx;
            if (mechanismActivateSfx != null) _sfxMap["MechanismActivate"] = mechanismActivateSfx;
            if (doorOpenSfx != null) _sfxMap["DoorOpen"] = doorOpenSfx;
            if (levelCompleteSfx != null) _sfxMap["LevelComplete"] = levelCompleteSfx;
        }

        private void OnEnable()
        {
            Core.EventBus.Instance.OnPlayerDeath += () => PlaySfx("Death");
            Core.EventBus.Instance.OnLightSwitched += () => PlaySfx("LightSwitch");
            Core.EventBus.Instance.OnCheckpointReached += () => PlaySfx("Checkpoint");
            Core.EventBus.Instance.OnMechanismActivated += () => PlaySfx("MechanismActivate");
        }

        private void OnDisable()
        {
        }

        public void PlayMusic(AudioClip clip, bool loop = true)
        {
            if (musicSource == null || clip == null) return;
            musicSource.clip = clip;
            musicSource.loop = loop;
            musicSource.volume = _musicVolume * _masterVolume;
            musicSource.Play();
        }

        public void PlayMenuMusic()
        {
            PlayMusic(menuMusic);
        }

        public void PlayLevelMusic(int trackIndex = 0)
        {
            if (levelMusicTracks == null || trackIndex >= levelMusicTracks.Length) return;
            PlayMusic(levelMusicTracks[trackIndex]);
        }

        public void StopMusic()
        {
            if (musicSource != null) musicSource.Stop();
        }

        public void PlaySfx(string sfxName)
        {
            if (sfxSource == null) return;
            if (_sfxMap.TryGetValue(sfxName, out var clip))
            {
                sfxSource.volume = _sfxVolume * _masterVolume;
                sfxSource.PlayOneShot(clip);
            }
        }

        public void PlaySfx(AudioClip clip)
        {
            if (sfxSource == null || clip == null) return;
            sfxSource.volume = _sfxVolume * _masterVolume;
            sfxSource.PlayOneShot(clip);
        }

        public void SetMasterVolume(float v)
        {
            _masterVolume = Mathf.Clamp01(v);
            ApplyVolumes();
        }

        public void SetMusicVolume(float v)
        {
            _musicVolume = Mathf.Clamp01(v);
            ApplyVolumes();
        }

        public void SetSFXVolume(float v)
        {
            _sfxVolume = Mathf.Clamp01(v);
        }

        private void ApplyVolumes()
        {
            if (musicSource != null)
                musicSource.volume = _musicVolume * _masterVolume;
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }
    }
}
