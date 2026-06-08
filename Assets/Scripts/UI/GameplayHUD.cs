using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using RainAlley.Core;
using RainAlley.GameFlow;
using RainAlley.InputSystem;
using RainAlley.Track;

namespace RainAlley.UI
{
    public class GameplayHUD : MonoBehaviour
    {
        public Text ScoreText;
        public Text ComboText;
        public Animator ComboAnimator;
        public Image ComboShakeImage;
        public Text JudgeText;
        public CanvasGroup JudgeCanvasGroup;
        public RectTransform JudgeRect;
        public Image UmbrellaColorPreview;
        public Image[] ColorSlotImages;
        public int CurrentColorHighlightIndex = -1;
        public GameObject DualTrackContainer;
        public Image LeftTrackIndicator;
        public Image RightTrackIndicator;
        public Color TrackActiveColor = new Color(1f, 0.9f, 0.4f);
        public Color TrackInactiveColor = new Color(0.3f, 0.3f, 0.3f);
        public Slider ProgressSlider;
        public Text BeatProgressText;
        public GameObject ComboBreakFlash;
        public AudioSource ComboBreakAudio;
        public CameraShake CameraShakeRef;
        public Text InputHintBottom;
        public Text InputHintSide;
        public GameObject MobileHintOverlay;
        public GameObject PauseOverlay;
        public Button ResumeBtn;
        public Button RestartBtn;
        public Button ExitBtn;
        public Color PerfectColor = new Color(1f, 0.92f, 0.35f);
        public Color EarlyColor = new Color(0.6f, 0.82f, 1f);
        public Color LateColor = new Color(1f, 0.75f, 0.5f);
        public Color MissColor = new Color(1f, 0.4f, 0.4f);

        private GameManager _game;
        private int _lastCombo = 0;
        private Coroutine _judgeAnim;
        private bool _initialized = false;
        private GameObject _root;

        public void Init(GameObject root)
        {
            _root = root;
            _game = GameManager.Instance;

            if (ResumeBtn != null) ResumeBtn.onClick.AddListener(() => _game.TogglePause());
            if (RestartBtn != null) RestartBtn.onClick.AddListener(() => _game.RestartLevel());
            if (ExitBtn != null) ExitBtn.onClick.AddListener(() => _game.ExitToMenu());

            SetupInputHints();

            if (_game != null)
            {
                _game.OnStateChanged += HandleStateChanged;
                _game.OnAnyJudge += HandleAnyJudge;
                _game.OnComboBroken += HandleComboBroken;
                _game.OnCountdownTick += HandleCountdown;
            }

            _initialized = true;
            gameObject.SetActive(false);
        }

        private void OnDestroy()
        {
            if (_game != null)
            {
                _game.OnStateChanged -= HandleStateChanged;
                _game.OnAnyJudge -= HandleAnyJudge;
                _game.OnComboBroken -= HandleComboBroken;
                _game.OnCountdownTick -= HandleCountdown;
            }
        }

        private void SetupInputHints()
        {
            if (_game == null || _game.Input == null) return;
            bool isMobile = _game.Input.IsMobile;
            if (MobileHintOverlay != null) MobileHintOverlay.SetActive(isMobile);
            if (InputHintBottom != null)
                InputHintBottom.text = "判定：" + _game.Input.GetHintForAction(GameInputAction.Judge);
            if (InputHintSide != null)
            {
                InputHintSide.text =
                    "下一色：" + _game.Input.GetHintForAction(GameInputAction.ColorNext) + "\n" +
                    "上一色：" + _game.Input.GetHintForAction(GameInputAction.ColorPrev) + "\n" +
                    "切轨道：" + _game.Input.GetHintForAction(GameInputAction.TrackToggle);
            }
        }

        private void Update()
        {
            if (!_initialized) return;
            if (_game == null || _game.CurrentLevel == null) return;
            if (_game.CurrentState != GameState.Playing &&
                _game.CurrentState != GameState.Replay &&
                _game.CurrentState != GameState.Paused &&
                _game.CurrentState != GameState.Countdown) return;

            UpdateScoreAndCombo();
            UpdateProgress();
            UpdateColorPreview();
            UpdateTrackIndicators();
        }

        private void UpdateScoreAndCombo()
        {
            var stats = _game.CurrentStats;
            if (ScoreText != null) ScoreText.text = stats.TotalScore.ToString("N0");
            int combo = stats.CurrentCombo;
            if (ComboText != null)
            {
                ComboText.text = combo > 0 ? $"{combo} COMBO" : "";
                ComboText.color = combo >= 30 ? PerfectColor : combo >= 10 ? Color.white : new Color(0.8f, 0.8f, 0.85f);
            }
            if (ComboAnimator != null && combo != _lastCombo && combo > _lastCombo && ComboAnimator.gameObject.activeInHierarchy)
            {
                ComboAnimator.SetTrigger("Pulse");
            }
            _lastCombo = combo;
        }

        private void UpdateProgress()
        {
            if (_game.Clock == null || _game.CurrentLevel == null) return;
            float total = _game.CurrentLevel.TotalBeats * (float)_game.Clock.MsPerBeat;
            float prog = total > 0 ? Mathf.Clamp01((float)_game.Clock.ElapsedMs / total) : 0f;
            if (ProgressSlider != null) ProgressSlider.value = prog;
            if (BeatProgressText != null)
                BeatProgressText.text = $"{_game.Clock.CurrentBeatIndex} / {_game.CurrentLevel.TotalBeats}";
        }

        private void UpdateColorPreview()
        {
            if (_game.ColorState == null) return;
            var colors = _game.ColorState.GetAvailableColors();
            if (UmbrellaColorPreview != null)
                UmbrellaColorPreview.color = UmbrellaColor.ToUnityColor(_game.ColorState.CurrentColor);

            for (int i = 0; i < ColorSlotImages.Length; i++)
            {
                if (ColorSlotImages[i] == null) continue;
                if (i < colors.Count)
                {
                    ColorSlotImages[i].gameObject.SetActive(true);
                    ColorSlotImages[i].color = UmbrellaColor.ToUnityColor(colors[i]);
                    var outline = ColorSlotImages[i].GetComponent<Outline>();
                    if (outline != null)
                        outline.enabled = colors[i] == _game.ColorState.CurrentColor;
                }
                else
                {
                    ColorSlotImages[i].gameObject.SetActive(false);
                }
            }
        }

        private void UpdateTrackIndicators()
        {
            if (_game.CurrentLevel == null) return;
            bool dual = _game.CurrentLevel.UnlockDualTrack;
            if (DualTrackContainer != null) DualTrackContainer.SetActive(dual);
            if (!dual) return;
            TrackPosition cur = _game.ColorState.CurrentTrack;
            if (LeftTrackIndicator != null)
                LeftTrackIndicator.color = cur == TrackPosition.Left ? TrackActiveColor : TrackInactiveColor;
            if (RightTrackIndicator != null)
                RightTrackIndicator.color = cur == TrackPosition.Right ? TrackActiveColor : TrackInactiveColor;
        }

        private void HandleStateChanged(GameState oldState, GameState newState)
        {
            if (!_initialized) return;
            bool show = newState == GameState.Playing ||
                        newState == GameState.Countdown ||
                        newState == GameState.Replay ||
                        newState == GameState.Paused;
            gameObject.SetActive(show);
            if (PauseOverlay != null) PauseOverlay.SetActive(newState == GameState.Paused);
            if (newState == GameState.Playing) SetupInputHints();
        }

        private void HandleAnyJudge(JudgeResult result, ObstacleData data)
        {
            ShowJudgeFeedback(result);
        }

        private void ShowJudgeFeedback(JudgeResult result)
        {
            if (JudgeText == null || JudgeCanvasGroup == null) return;
            string label = "";
            Color color = Color.white;
            bool success = result.IsSuccessful;

            switch (result.Type)
            {
                case JudgeType.Perfect:
                    label = success ? "PERFECT!" : "颜色/轨道错误";
                    color = success ? PerfectColor : MissColor;
                    break;
                case JudgeType.Early:
                    label = success ? "EARLY" : "早·错误";
                    color = success ? EarlyColor : MissColor;
                    break;
                case JudgeType.Late:
                    label = success ? "LATE" : "晚·错误";
                    color = success ? LateColor : MissColor;
                    break;
                case JudgeType.Miss:
                    label = "MISS";
                    color = MissColor;
                    break;
            }

            if (!success && !string.IsNullOrEmpty(label))
            {
                if (!result.ColorCorrect) label = "颜色错误";
                else if (!result.TrackCorrect) label = "轨道错误";
            }

            if (_judgeAnim != null) StopCoroutine(_judgeAnim);
            _judgeAnim = StartCoroutine(PlayJudgeAnim(label, color, success));
        }

        private IEnumerator PlayJudgeAnim(string text, Color color, bool success)
        {
            JudgeText.text = text;
            JudgeText.color = color;
            JudgeCanvasGroup.alpha = 1f;
            if (JudgeRect != null)
            {
                Vector2 origPos = JudgeRect.anchoredPosition;
                float t = 0;
                float dur = 0.5f;
                while (t < dur)
                {
                    t += Time.deltaTime;
                    float k = t / dur;
                    JudgeRect.anchoredPosition = origPos + new Vector2(0, 40f * Mathf.Sin(k * Mathf.PI));
                    JudgeCanvasGroup.alpha = Mathf.Lerp(1f, 0f, k);
                    yield return null;
                }
                JudgeRect.anchoredPosition = origPos;
            }
            else
            {
                yield return new WaitForSeconds(0.45f);
                JudgeCanvasGroup.alpha = 0f;
            }
            if (CameraShakeRef != null && !success) CameraShakeRef.Shake(0.2f, 0.2f);
        }

        private void HandleComboBroken(int size)
        {
            if (ComboBreakFlash != null) StartCoroutine(FlashComboBreak());
            if (ComboBreakAudio != null) ComboBreakAudio.Play();
            if (CameraShakeRef != null && size >= 5) CameraShakeRef.Shake(0.3f, 0.3f);
        }

        private IEnumerator FlashComboBreak()
        {
            ComboBreakFlash.SetActive(true);
            var img = ComboBreakFlash.GetComponent<Image>();
            Color c = img != null ? img.color : new Color(1, 0.2f, 0.25f, 0.45f);
            float t = 0;
            float dur = 0.55f;
            while (t < dur)
            {
                t += Time.deltaTime;
                if (img != null)
                {
                    c.a = Mathf.Lerp(0.5f, 0f, t / dur);
                    img.color = c;
                }
                yield return null;
            }
            ComboBreakFlash.SetActive(false);
            if (img != null) { c.a = 0.5f; img.color = c; }
        }

        private void HandleCountdown(int cur, int total, int beat)
        {
            if (JudgeText == null || JudgeCanvasGroup == null) return;
            JudgeText.text = cur <= 0 ? "开始！" : cur.ToString();
            JudgeText.color = cur <= 0 ? PerfectColor : Color.white;
            JudgeCanvasGroup.alpha = 1f;
            if (_judgeAnim != null) StopCoroutine(_judgeAnim);
        }
    }

    public class CameraShake : MonoBehaviour
    {
        public void Shake(float duration, float strength)
        {
            StartCoroutine(ShakeRoutine(duration, strength));
        }
        private IEnumerator ShakeRoutine(float duration, float strength)
        {
            Vector3 orig = transform.localPosition;
            float t = 0;
            while (t < duration)
            {
                t += Time.deltaTime;
                float k = 1f - t / duration;
                transform.localPosition = orig + Random.insideUnitSphere * strength * k;
                yield return null;
            }
            transform.localPosition = orig;
        }
    }
}
