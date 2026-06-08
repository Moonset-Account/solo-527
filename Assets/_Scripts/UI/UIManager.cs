using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace LightShadowPlatformer.UI
{
    public class UIManager : MonoBehaviour
    {
        public static UIManager Instance { get; private set; }

        [Header("Root Canvases")]
        public Canvas mainMenuCanvas;
        public Canvas hudCanvas;
        public Canvas pauseCanvas;
        public Canvas settingsCanvas;
        public Canvas gameOverCanvas;
        public Canvas victoryCanvas;
        public Canvas tutorialCanvas;
        public Canvas loadingCanvas;

        [Header("Fade Settings")]
        public Image fadeOverlay;
        public float fadeDuration = 0.5f;
        public AnimationCurve fadeCurve = AnimationCurve.EaseInOut(0, 0, 1, 1);

        [Header("HUD References")]
        public HUDController hudController;

        [Header("Menu References")]
        public MainMenuController mainMenuController;
        public PauseMenuController pauseMenuController;
        public SettingsMenuController settingsMenuController;
        public GameOverController gameOverController;
        public VictoryController victoryController;
        public TutorialPanelController tutorialPanelController;

        private Coroutine _fadeCoroutine;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            if (LightShadowPlatformer.Core.EventManager.Instance != null)
            {
                LightShadowPlatformer.Core.EventManager.Instance.OnGameStateChanged += OnGameStateChanged;
                LightShadowPlatformer.Core.EventManager.Instance.OnLevelLoaded += OnLevelLoaded;
                LightShadowPlatformer.Core.EventManager.Instance.OnTutorialTriggered += OnTutorialTriggered;
                LightShadowPlatformer.Core.EventManager.Instance.OnPlayerDeath += OnPlayerDeath;
            }

            HideAllCanvases();
            ShowMainMenu(true);
        }

        private void OnDestroy()
        {
            if (LightShadowPlatformer.Core.EventManager.Instance != null)
            {
                LightShadowPlatformer.Core.EventManager.Instance.OnGameStateChanged -= OnGameStateChanged;
                LightShadowPlatformer.Core.EventManager.Instance.OnLevelLoaded -= OnLevelLoaded;
                LightShadowPlatformer.Core.EventManager.Instance.OnTutorialTriggered -= OnTutorialTriggered;
                LightShadowPlatformer.Core.EventManager.Instance.OnPlayerDeath -= OnPlayerDeath;
            }
        }

        private void OnGameStateChanged(LightShadowPlatformer.Core.GameManager.GameState oldState,
            LightShadowPlatformer.Core.GameManager.GameState newState)
        {
            switch (newState)
            {
                case LightShadowPlatformer.Core.GameManager.GameState.MainMenu:
                    ShowMainMenu();
                    break;
                case LightShadowPlatformer.Core.GameManager.GameState.Playing:
                    ShowHUD();
                    break;
                case LightShadowPlatformer.Core.GameManager.GameState.Paused:
                    ShowPauseMenu();
                    LightShadowPlatformer.Core.AudioManager.Instance?.PlayUISfx(
                        LightShadowPlatformer.Core.AudioManager.SfxType.Pause);
                    break;
                case LightShadowPlatformer.Core.GameManager.GameState.GameOver:
                    ShowGameOver();
                    break;
                case LightShadowPlatformer.Core.GameManager.GameState.Victory:
                    ShowVictory();
                    break;
            }
        }

        private void OnLevelLoaded(int levelIndex)
        {
            StartCoroutine(LevelLoadSequence(levelIndex));
        }

        private IEnumerator LevelLoadSequence(int levelIndex)
        {
            ShowLoading(true);
            yield return FadeIn();

            ShowHUD();
            if (hudController != null)
                hudController.UpdateLevelDisplay(levelIndex + 1);

            yield return FadeOut();
            ShowLoading(false);
        }

        private void OnTutorialTriggered(string tutorialId, string message)
        {
            ShowTutorial(message);
        }

        private void OnPlayerDeath()
        {
            if (hudController != null)
                hudController.ShowDeathFeedback();
        }

        public void HideAllCanvases()
        {
            SetCanvasActive(mainMenuCanvas, false);
            SetCanvasActive(hudCanvas, false);
            SetCanvasActive(pauseCanvas, false);
            SetCanvasActive(settingsCanvas, false);
            SetCanvasActive(gameOverCanvas, false);
            SetCanvasActive(victoryCanvas, false);
            SetCanvasActive(tutorialCanvas, false);
            SetCanvasActive(loadingCanvas, false);
        }

        public void ShowMainMenu(bool immediate = false)
        {
            HideAllCanvases();
            SetCanvasActive(mainMenuCanvas, true);
            if (!immediate) StartCoroutine(FadeOut());
        }

        public void ShowHUD()
        {
            HideAllCanvases();
            SetCanvasActive(hudCanvas, true);
            if (hudController != null) hudController.Refresh();
        }

        public void ShowPauseMenu()
        {
            SetCanvasActive(pauseCanvas, true);
            if (pauseMenuController != null) pauseMenuController.OnOpen();
        }

        public void HidePauseMenu()
        {
            SetCanvasActive(pauseCanvas, false);
            LightShadowPlatformer.Core.AudioManager.Instance?.PlayUISfx(
                LightShadowPlatformer.Core.AudioManager.SfxType.Unpause);
        }

        public void ShowSettingsMenu()
        {
            SetCanvasActive(settingsCanvas, true);
            if (settingsMenuController != null) settingsMenuController.RefreshUI();
        }

        public void HideSettingsMenu()
        {
            SetCanvasActive(settingsCanvas, false);
            if (pauseCanvas != null && pauseCanvas.enabled)
            {
                SetCanvasActive(pauseCanvas, true);
            }
            else
            {
                SetCanvasActive(mainMenuCanvas, true);
            }
        }

        public void ShowGameOver()
        {
            HideAllCanvases();
            SetCanvasActive(gameOverCanvas, true);
            if (gameOverController != null) gameOverController.OnOpen();
        }

        public void ShowVictory()
        {
            HideAllCanvases();
            SetCanvasActive(victoryCanvas, true);
            if (victoryController != null) victoryController.OnOpen();
        }

        public void ShowTutorial(string message)
        {
            if (tutorialPanelController != null)
            {
                SetCanvasActive(tutorialCanvas, true);
                tutorialPanelController.ShowTutorial(message);
            }
        }

        public void HideTutorial()
        {
            if (tutorialPanelController != null)
            {
                tutorialPanelController.Hide();
                SetCanvasActive(tutorialCanvas, false);
            }
        }

        public void ShowLoading(bool show)
        {
            SetCanvasActive(loadingCanvas, show);
        }

        public IEnumerator FadeIn()
        {
            if (_fadeCoroutine != null) StopCoroutine(_fadeCoroutine);
            _fadeCoroutine = StartCoroutine(FadeRoutine(0f, 1f));
            yield return _fadeCoroutine;
        }

        public IEnumerator FadeOut()
        {
            if (_fadeCoroutine != null) StopCoroutine(_fadeCoroutine);
            _fadeCoroutine = StartCoroutine(FadeRoutine(1f, 0f));
            yield return _fadeCoroutine;
        }

        private IEnumerator FadeRoutine(float from, float to)
        {
            if (fadeOverlay == null) yield break;

            fadeOverlay.gameObject.SetActive(true);
            float elapsed = 0f;
            Color c = fadeOverlay.color;
            c.a = from;
            fadeOverlay.color = c;

            while (elapsed < fadeDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = fadeCurve.Evaluate(Mathf.Clamp01(elapsed / fadeDuration));
                c.a = Mathf.Lerp(from, to, t);
                fadeOverlay.color = c;
                yield return null;
            }

            c.a = to;
            fadeOverlay.color = c;
            if (to <= 0.001f) fadeOverlay.gameObject.SetActive(false);
        }

        private void SetCanvasActive(Canvas canvas, bool active)
        {
            if (canvas != null)
            {
                canvas.gameObject.SetActive(active);
            }
        }

        public void PlayButtonHover()
        {
            LightShadowPlatformer.Core.AudioManager.Instance?.PlayUISfx(
                LightShadowPlatformer.Core.AudioManager.SfxType.MenuHover);
        }

        public void PlayButtonClick()
        {
            LightShadowPlatformer.Core.AudioManager.Instance?.PlayUISfx(
                LightShadowPlatformer.Core.AudioManager.SfxType.MenuClick);
        }

        public void PlayUIConfirm()
        {
            LightShadowPlatformer.Core.AudioManager.Instance?.PlayUISfx(
                LightShadowPlatformer.Core.AudioManager.SfxType.UIConfirm);
        }

        public void PlayUICancel()
        {
            LightShadowPlatformer.Core.AudioManager.Instance?.PlayUISfx(
                LightShadowPlatformer.Core.AudioManager.SfxType.UICancel);
        }
    }
}
