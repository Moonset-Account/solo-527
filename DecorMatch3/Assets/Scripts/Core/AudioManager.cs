using System.Collections;
using UnityEngine;

namespace DecorMatch3
{
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        private AudioSource _musicSource;
        private AudioSource _sfxSource;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public void Init()
        {
            _musicSource = gameObject.AddComponent<AudioSource>();
            _sfxSource = gameObject.AddComponent<AudioSource>();

            _musicSource.loop = true;
            _musicSource.playOnAwake = false;
            _sfxSource.loop = false;
            _sfxSource.playOnAwake = false;

            if (SaveManager.Instance != null && SaveManager.Instance.CurrentSave != null)
            {
                var settings = SaveManager.Instance.CurrentSave.settings;
                _musicSource.volume = settings.musicVolume;
                _sfxSource.volume = settings.sfxVolume;
            }
            else
            {
                _musicSource.volume = 0.7f;
                _sfxSource.volume = 1.0f;
            }
        }

        public void PlaySFX(string clipName)
        {
            AudioClip clip = Resources.Load<AudioClip>($"Audio/SFX/{clipName}");
            if (clip != null)
            {
                _sfxSource.PlayOneShot(clip);
            }
            else
            {
                Debug.LogWarning($"SFX not found: Audio/SFX/{clipName}");
            }
        }

        public void PlayMusic(string trackName)
        {
            AudioClip newClip = Resources.Load<AudioClip>($"Audio/Music/{trackName}");
            if (newClip == null)
            {
                Debug.LogWarning($"Music not found: Audio/Music/{trackName}");
                return;
            }

            if (_musicSource.clip == newClip && _musicSource.isPlaying)
            {
                return;
            }

            StartCoroutine(CrossFadeMusic(newClip));
        }

        public void StopMusic()
        {
            StartCoroutine(FadeOutMusic(1f));
        }

        public void SetMusicVolume(float v)
        {
            _musicSource.volume = v;
            if (SaveManager.Instance != null && SaveManager.Instance.CurrentSave != null)
            {
                SaveManager.Instance.CurrentSave.settings.musicVolume = v;
            }
        }

        public void SetSFXVolume(float v)
        {
            _sfxSource.volume = v;
            if (SaveManager.Instance != null && SaveManager.Instance.CurrentSave != null)
            {
                SaveManager.Instance.CurrentSave.settings.sfxVolume = v;
            }
        }

        private IEnumerator CrossFadeMusic(AudioClip newClip, float duration = 1f)
        {
            if (_musicSource.isPlaying)
            {
                yield return FadeOutMusic(duration);
            }

            _musicSource.clip = newClip;
            _musicSource.volume = 0f;
            _musicSource.Play();

            float targetVolume = SaveManager.Instance != null && SaveManager.Instance.CurrentSave != null
                ? SaveManager.Instance.CurrentSave.settings.musicVolume
                : 0.7f;

            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                _musicSource.volume = Mathf.Lerp(0f, targetVolume, elapsed / duration);
                yield return null;
            }
            _musicSource.volume = targetVolume;
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
            _musicSource.volume = 0f;
            _musicSource.Stop();
        }
    }
}
