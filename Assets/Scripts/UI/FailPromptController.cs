using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

namespace InkMountainBridge
{
    public class FailPromptController : MonoBehaviour
    {
        public Text reasonText;
        public Button retryButton;
        public Button backButton;
        public Image failCauseIcon;

        private Vector3 _originalPosition;
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
            if (reasonText == null) reasonText = FindOrCreateText("ReasonText", new Vector2(0, 40), 300, 60, 20);
            if (retryButton == null) retryButton = FindOrCreateButton("RetryButton", "重试", new Vector2(-60, -40), 120, 40);
            if (backButton == null) backButton = FindOrCreateButton("BackButton", "返回", new Vector2(60, -40), 120, 40);
        }

        private Text FindOrCreateText(string name, Vector2 anchoredPos, float width, float height, int fontSize)
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

        private Button FindOrCreateButton(string name, string label, Vector2 anchoredPos, float width, float height)
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
            img.color = new Color(0.25f, 0.25f, 0.25f, 0.9f);

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

        private void RegisterListeners()
        {
            if (listenersRegistered) return;
            listenersRegistered = true;

            if (retryButton != null) retryButton.onClick.AddListener(OnRetry);
            if (backButton != null) backButton.onClick.AddListener(OnBack);
        }

        private void UnregisterListeners()
        {
            if (!listenersRegistered) return;
            listenersRegistered = false;

            if (retryButton != null) retryButton.onClick.RemoveListener(OnRetry);
            if (backButton != null) backButton.onClick.RemoveListener(OnBack);
        }

        public void Show(string reason)
        {
            gameObject.SetActive(true);
            if (reasonText != null) reasonText.text = reason;
            _originalPosition = transform.localPosition;
            StartCoroutine(ShakeEffect());
        }

        public void Hide()
        {
            gameObject.SetActive(false);
        }

        public void OnRetry()
        {
            Hide();

            var levelController = FindObjectOfType<LevelController>();
            if (levelController != null)
            {
                levelController.ResetLevel();
                levelController.StartBuildPhase();
            }
        }

        public void OnBack()
        {
            Hide();
            SceneManager.LoadScene("MainMenu");
        }

        private System.Collections.IEnumerator ShakeEffect()
        {
            float duration = 0.4f;
            float elapsed = 0f;
            float intensity = 8f;
            while (elapsed < duration)
            {
                float x = Random.Range(-intensity, intensity) * (1f - elapsed / duration);
                float y = Random.Range(-intensity, intensity) * (1f - elapsed / duration);
                transform.localPosition = _originalPosition + new Vector3(x, y, 0);
                elapsed += Time.deltaTime;
                yield return null;
            }
            transform.localPosition = _originalPosition;
        }
    }
}
