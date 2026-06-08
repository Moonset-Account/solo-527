using UnityEngine;

namespace LightShadowPlatformer.Core
{
    public class AudioManager : MonoBehaviour
    {
        public enum SfxType
        {
            Jump,
            Land,
            DoubleJump,
            Walk,
            PlayerDeath,
            Checkpoint,
            LightSwitch,
            Switch,
            DoorOpen,
            DoorClose,
            PlateDown,
            PlateUp,
            Collect,
            KeyCollect,
            LevelComplete,
            MenuClick,
            MenuHover,
            Pause,
            Unpause,
            Tutorial,
            UIConfirm,
            UICancel,
            GameComplete,
            FallDamage,
            HazardDeath,
            PlatformAppear,
            PlatformDisappear
        }

        public enum MusicType
        {
            MainMenu,
            Level01,
            Level02,
            Level03,
            Victory,
            GameOver
        }

        public static AudioManager Instance { get; private set; }

        [Header("Audio Sources")]
        public AudioSource musicSource;
        public AudioSource sfxSource;
        public AudioSource uiSource;

        [Header("Music Clips")]
        public AudioClip mainMenuMusic;
        public AudioClip level01Music;
        public AudioClip level02Music;
        public AudioClip level03Music;
        public AudioClip victoryMusic;
        public AudioClip gameOverMusic;

        [Header("SFX Clips")]
        public AudioClip jumpSfx;
        public AudioClip landSfx;
        public AudioClip doubleJumpSfx;
        public AudioClip walkSfx;
        public AudioClip playerDeathSfx;
        public AudioClip checkpointSfx;
        public AudioClip lightSwitchSfx;
        public AudioClip switchSfx;
        public AudioClip doorOpenSfx;
        public AudioClip doorCloseSfx;
        public AudioClip plateDownSfx;
        public AudioClip plateUpSfx;
        public AudioClip collectSfx;
        public AudioClip keyCollectSfx;
        public AudioClip levelCompleteSfx;
        public AudioClip menuClickSfx;
        public AudioClip menuHoverSfx;
        public AudioClip pauseSfx;
        public AudioClip unpauseSfx;
        public AudioClip tutorialSfx;
        public AudioClip uiConfirmSfx;
        public AudioClip uiCancelSfx;
        public AudioClip gameCompleteSfx;
        public AudioClip fallDamageSfx;
        public AudioClip hazardDeathSfx;
        public AudioClip platformAppearSfx;
        public AudioClip platformDisappearSfx;

        [Header("Settings")]
        public float musicFadeDuration = 1f;

        private MusicType _currentMusic = MusicType.MainMenu;
        private Coroutine _fadeCoroutine;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            if (musicSource == null)
            {
                musicSource = gameObject.AddComponent<AudioSource>();
                musicSource.loop = true;
                musicSource.playOnAwake = false;
            }
            if (sfxSource == null)
            {
                sfxSource = gameObject.AddComponent<AudioSource>();
                sfxSource.loop = false;
                sfxSource.playOnAwake = false;
            }
            if (uiSource == null)
            {
                uiSource = gameObject.AddComponent<AudioSource>();
                uiSource.loop = false;
                uiSource.playOnAwake = false;
            }
        }

        private void Start()
        {
            UpdateVolumes();
            if (LightShadowPlatformer.Core.SettingsManager.Instance != null)
            {
                LightShadowPlatformer.Core.SettingsManager.Instance.OnSettingsChanged += OnSettingsChanged;
            }
            EventManager.Instance.OnGameStateChanged += OnGameStateChanged;
            EventManager.Instance.OnLevelLoaded += OnLevelLoaded;
        }

        private void OnDestroy()
        {
            if (LightShadowPlatformer.Core.SettingsManager.Instance != null)
            {
                LightShadowPlatformer.Core.SettingsManager.Instance.OnSettingsChanged -= OnSettingsChanged;
            }
            if (EventManager.Instance != null)
            {
                EventManager.Instance.OnGameStateChanged -= OnGameStateChanged;
                EventManager.Instance.OnLevelLoaded -= OnLevelLoaded;
            }
        }

        private void OnSettingsChanged(SettingsData settings)
        {
            UpdateVolumes();
        }

        private void OnGameStateChanged(GameManager.GameState oldState, GameManager.GameState newState)
        {
            switch (newState)
            {
                case GameManager.GameState.MainMenu:
                    PlayMusic(MusicType.MainMenu);
                    break;
                case GameManager.GameState.Victory:
                    PlayMusic(MusicType.Victory);
                    break;
                case GameManager.GameState.GameOver:
                    PlayMusic(MusicType.GameOver);
                    break;
                case GameManager.GameState.Paused:
                    if (musicSource != null) musicSource.pitch = 0.7f;
                    break;
                case GameManager.GameState.Playing:
                    if (musicSource != null) musicSource.pitch = 1f;
                    break;
            }
        }

        private void OnLevelLoaded(int levelIndex)
        {
            MusicType type = levelIndex switch
            {
                0 => MusicType.Level01,
                1 => MusicType.Level02,
                2 => MusicType.Level03,
                _ => MusicType.Level01
            };
            PlayMusic(type);
        }

        private void UpdateVolumes()
        {
            if (SettingsManager.Instance == null) return;
            var s = SettingsManager.Instance.CurrentSettings;

            if (musicSource != null)
                musicSource.volume = s.masterVolume * s.musicVolume;
            if (sfxSource != null)
                sfxSource.volume = s.masterVolume * s.sfxVolume;
            if (uiSource != null)
                uiSource.volume = s.masterVolume * s.uiVolume;
        }

        public void PlayMusic(MusicType type, bool fade = true)
        {
            _currentMusic = type;
            AudioClip clip = GetMusicClip(type);

            if (clip == null) return;
            if (musicSource == null) return;
            if (musicSource.clip == clip && musicSource.isPlaying) return;

            if (fade && musicSource.isPlaying)
            {
                if (_fadeCoroutine != null) StopCoroutine(_fadeCoroutine);
                _fadeCoroutine = StartCoroutine(FadeToMusic(clip));
            }
            else
            {
                musicSource.clip = clip;
                musicSource.Play();
            }
        }

        private System.Collections.IEnumerator FadeToMusic(AudioClip newClip)
        {
            float vol = SettingsManager.Instance != null ?
                SettingsManager.Instance.CurrentSettings.masterVolume * SettingsManager.Instance.CurrentSettings.musicVolume : 1f;
            float elapsed = 0f;

            while (elapsed < musicFadeDuration * 0.5f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / (musicFadeDuration * 0.5f);
                musicSource.volume = Mathf.Lerp(vol, 0f, t);
                yield return null;
            }

            musicSource.Stop();
            musicSource.clip = newClip;
            musicSource.Play();

            elapsed = 0f;
            while (elapsed < musicFadeDuration * 0.5f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / (musicFadeDuration * 0.5f);
                musicSource.volume = Mathf.Lerp(0f, vol, t);
                yield return null;
            }
        }

        public AudioClip GetMusicClip(MusicType type)
        {
            return type switch
            {
                MusicType.MainMenu => mainMenuMusic,
                MusicType.Level01 => level01Music,
                MusicType.Level02 => level02Music,
                MusicType.Level03 => level03Music,
                MusicType.Victory => victoryMusic,
                MusicType.GameOver => gameOverMusic,
                _ => null
            };
        }

        public void PlaySfx(SfxType type, float volumeMultiplier = 1f, float pitchMultiplier = 1f)
        {
            AudioClip clip = GetSfxClip(type);
            if (clip == null || sfxSource == null) return;

            float vol = volumeMultiplier;
            if (SettingsManager.Instance != null)
            {
                vol *= SettingsManager.Instance.CurrentSettings.masterVolume *
                       SettingsManager.Instance.CurrentSettings.sfxVolume;
            }

            sfxSource.pitch = pitchMultiplier;
            sfxSource.PlayOneShot(clip, vol);
        }

        public void PlayUISfx(SfxType type, float volumeMultiplier = 1f)
        {
            AudioClip clip = GetSfxClip(type);
            if (clip == null || uiSource == null) return;

            float vol = volumeMultiplier;
            if (SettingsManager.Instance != null)
            {
                vol *= SettingsManager.Instance.CurrentSettings.masterVolume *
                       SettingsManager.Instance.CurrentSettings.uiVolume;
            }
            uiSource.PlayOneShot(clip, vol);
        }

        public AudioClip GetSfxClip(SfxType type)
        {
            return type switch
            {
                SfxType.Jump => jumpSfx,
                SfxType.Land => landSfx,
                SfxType.DoubleJump => doubleJumpSfx,
                SfxType.Walk => walkSfx,
                SfxType.PlayerDeath => playerDeathSfx,
                SfxType.Checkpoint => checkpointSfx,
                SfxType.LightSwitch => lightSwitchSfx,
                SfxType.Switch => switchSfx,
                SfxType.DoorOpen => doorOpenSfx,
                SfxType.DoorClose => doorCloseSfx,
                SfxType.PlateDown => plateDownSfx,
                SfxType.PlateUp => plateUpSfx,
                SfxType.Collect => collectSfx,
                SfxType.KeyCollect => keyCollectSfx,
                SfxType.LevelComplete => levelCompleteSfx,
                SfxType.MenuClick => menuClickSfx,
                SfxType.MenuHover => menuHoverSfx,
                SfxType.Pause => pauseSfx,
                SfxType.Unpause => unpauseSfx,
                SfxType.Tutorial => tutorialSfx,
                SfxType.UIConfirm => uiConfirmSfx,
                SfxType.UICancel => uiCancelSfx,
                SfxType.GameComplete => gameCompleteSfx,
                SfxType.FallDamage => fallDamageSfx,
                SfxType.HazardDeath => hazardDeathSfx,
                SfxType.PlatformAppear => platformAppearSfx,
                SfxType.PlatformDisappear => platformDisappearSfx,
                _ => null
            };
        }

        public void StopMusic()
        {
            if (musicSource != null) musicSource.Stop();
        }

        public void PauseAll()
        {
            if (musicSource != null) musicSource.Pause();
            if (sfxSource != null) sfxSource.Pause();
            if (uiSource != null) uiSource.Pause();
        }

        public void ResumeAll()
        {
            if (musicSource != null) musicSource.UnPause();
            if (sfxSource != null) sfxSource.UnPause();
            if (uiSource != null) uiSource.UnPause();
        }
    }
}
