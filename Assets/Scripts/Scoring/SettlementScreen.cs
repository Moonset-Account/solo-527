using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using System.Collections;

namespace InkMountainBridge
{
    public class SettlementScreen : MonoBehaviour
    {
        [SerializeField] private Text scoreText;
        [SerializeField] private Text timeText;
        [SerializeField] private Text materialsText;
        [SerializeField] private Text integrityText;
        [SerializeField] private Image[] ratingStars;
        [SerializeField] private Button retryButton;
        [SerializeField] private Button nextLevelButton;

        public LevelResult result;

        private Coroutine scoreAnimationCoroutine;
        private Coroutine starsAnimationCoroutine;
        private bool listenersRegistered;

        private void Awake()
        {
            EnsureUIComponents();
            RegisterListeners();
        }

        private void OnDestroy()
        {
            UnregisterListeners();
        }

        private void EnsureUIComponents()
        {
            if (scoreText == null) scoreText = CreateLabel("ScoreText", new Vector2(0, 120), 300, 40, 28);
            if (timeText == null) timeText = CreateLabel("TimeText", new Vector2(0, 70), 250, 30, 20);
            if (materialsText == null) materialsText = CreateLabel("MaterialsText", new Vector2(0, 30), 250, 30, 20);
            if (integrityText == null) integrityText = CreateLabel("IntegrityText", new Vector2(0, -10), 250, 30, 20);
            if (retryButton == null) retryButton = CreateButton("RetryButton", "重玩", new Vector2(-80, -80), 120, 40);
            if (nextLevelButton == null) nextLevelButton = CreateButton("NextLevelButton", "下一关", new Vector2(80, -80), 120, 40);

            if (ratingStars == null || ratingStars.Length == 0)
            {
                ratingStars = new Image[3];
                for (int i = 0; i < 3; i++)
                {
                    ratingStars[i] = CreateStar($"Star{i}", new Vector2(-60 + i * 60, 40));
                }
            }
        }

        private Text CreateLabel(string name, Vector2 anchoredPos, float width, float height, int fontSize)
        {
            Transform t = transform.Find(name);
            if (t != null) return t.GetComponent<Text>();

            GameObject obj = new GameObject(name);
            obj.transform.SetParent(transform, false);

            var rect = obj.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.5f);
            rect.anchorMax = new Vector2(0.5f, 0.5f);
            rect.anchoredPosition = anchoredPos;
            rect.sizeDelta = new Vector2(width, height);

            var txt = obj.AddComponent<Text>();
            txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            txt.fontSize = fontSize;
            txt.color = Color.white;
            txt.alignment = TextAnchor.MiddleCenter;
            return txt;
        }

        private Button CreateButton(string name, string label, Vector2 anchoredPos, float width, float height)
        {
            Transform t = transform.Find(name);
            if (t != null) return t.GetComponent<Button>();

            GameObject obj = new GameObject(name);
            obj.transform.SetParent(transform, false);

            var rect = obj.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.5f);
            rect.anchorMax = new Vector2(0.5f, 0.5f);
            rect.anchoredPosition = anchoredPos;
            rect.sizeDelta = new Vector2(width, height);

            obj.AddComponent<CanvasRenderer>();
            var img = obj.AddComponent<Image>();
            img.color = new Color(0.2f, 0.2f, 0.2f, 0.9f);

            var btn = obj.AddComponent<Button>();
            btn.targetGraphic = img;

            ColorBlock colors = btn.colors;
            colors.highlightedColor = new Color(0.4f, 0.4f, 0.4f, 1f);
            colors.pressedColor = new Color(0.15f, 0.15f, 0.15f, 1f);
            btn.colors = colors;

            GameObject labelObj = new GameObject("Label");
            labelObj.transform.SetParent(obj.transform, false);

            var labelRect = labelObj.AddComponent<RectTransform>();
            labelRect.anchorMin = Vector2.zero;
            labelRect.anchorMax = Vector2.one;
            labelRect.sizeDelta = Vector2.zero;

            var labelTxt = labelObj.AddComponent<Text>();
            labelTxt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            labelTxt.fontSize = 18;
            labelTxt.color = Color.white;
            labelTxt.alignment = TextAnchor.MiddleCenter;
            labelTxt.text = label;

            return btn;
        }

        private Image CreateStar(string name, Vector2 anchoredPos)
        {
            Transform t = transform.Find(name);
            if (t != null) return t.GetComponent<Image>();

            GameObject obj = new GameObject(name);
            obj.transform.SetParent(transform, false);

            var rect = obj.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.5f);
            rect.anchorMax = new Vector2(0.5f, 0.5f);
            rect.anchoredPosition = anchoredPos;
            rect.sizeDelta = new Vector2(40, 40);

            obj.AddComponent<CanvasRenderer>();
            var img = obj.AddComponent<Image>();
            img.color = Color.yellow;
            img.fillAmount = 0f;

            return img;
        }

        private void RegisterListeners()
        {
            if (listenersRegistered) return;
            listenersRegistered = true;

            if (retryButton != null) retryButton.onClick.AddListener(OnRetryClicked);
            if (nextLevelButton != null) nextLevelButton.onClick.AddListener(OnNextLevelClicked);
        }

        private void UnregisterListeners()
        {
            if (!listenersRegistered) return;
            listenersRegistered = false;

            if (retryButton != null) retryButton.onClick.RemoveListener(OnRetryClicked);
            if (nextLevelButton != null) nextLevelButton.onClick.RemoveListener(OnNextLevelClicked);
        }

        public void Show(LevelResult result)
        {
            this.result = result;
            gameObject.SetActive(true);

            if (timeText != null)
                timeText.text = result.completionTime.ToString("F1") + "s";
            if (materialsText != null)
                materialsText.text = result.materialsUsed + " / " + result.totalBudget;
            if (integrityText != null)
                integrityText.text = ((1f - result.maxStressRatio) * 100f).ToString("F0") + "%";

            if (scoreAnimationCoroutine != null) StopCoroutine(scoreAnimationCoroutine);
            scoreAnimationCoroutine = StartCoroutine(AnimateScoreRoutine(result.score));

            int starCount = GetStarCount(result.score);
            if (starsAnimationCoroutine != null) StopCoroutine(starsAnimationCoroutine);
            starsAnimationCoroutine = StartCoroutine(AnimateStarsRoutine(starCount));
        }

        public void Hide()
        {
            if (scoreAnimationCoroutine != null) StopCoroutine(scoreAnimationCoroutine);
            if (starsAnimationCoroutine != null) StopCoroutine(starsAnimationCoroutine);
            gameObject.SetActive(false);
        }

        public void OnRetryClicked()
        {
            Hide();

            var levelController = FindObjectOfType<LevelController>();
            if (levelController != null)
            {
                levelController.ResetLevel();
                levelController.StartBuildPhase();
            }
        }

        public void OnNextLevelClicked()
        {
            Hide();

            int nextId = result != null ? result.levelId + 1 : 1;
            string[] levelSceneNames = { "", "Tutorial", "Challenge", "FailTest" };

            if (nextId >= 1 && nextId < levelSceneNames.Length)
            {
                var bootstrap = FindObjectOfType<GameBootstrap>();
                if (bootstrap != null)
                {
                    bootstrap.StartLevelById(nextId);
                    return;
                }
                SceneManager.LoadScene(levelSceneNames[nextId]);
            }
            else
            {
                SceneManager.LoadScene("MainMenu");
            }
        }

        private IEnumerator AnimateScoreRoutine(int targetScore)
        {
            int current = 0;
            float duration = 1.5f;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                current = Mathf.RoundToInt(Mathf.Lerp(0, targetScore, t));
                if (scoreText != null) scoreText.text = current.ToString();
                yield return null;
            }

            if (scoreText != null) scoreText.text = targetScore.ToString();
            scoreAnimationCoroutine = null;
        }

        private IEnumerator AnimateStarsRoutine(int count)
        {
            if (ratingStars != null)
            {
                for (int i = 0; i < ratingStars.Length; i++)
                {
                    if (ratingStars[i] != null) ratingStars[i].fillAmount = 0f;
                }

                for (int i = 0; i < count && i < ratingStars.Length; i++)
                {
                    if (ratingStars[i] == null) continue;

                    float elapsed = 0f;
                    float duration = 0.3f;

                    while (elapsed < duration)
                    {
                        elapsed += Time.deltaTime;
                        ratingStars[i].fillAmount = Mathf.Clamp01(elapsed / duration);
                        yield return null;
                    }

                    ratingStars[i].fillAmount = 1f;
                    yield return new WaitForSeconds(0.15f);
                }
            }

            starsAnimationCoroutine = null;
        }

        private int GetStarCount(int score)
        {
            if (score >= 900) return 3;
            if (score >= 600) return 2;
            if (score > 0) return 1;
            return 0;
        }
    }
}
