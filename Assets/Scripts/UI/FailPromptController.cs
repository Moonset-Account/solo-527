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

        private void OnEnable()
        {
            if (retryButton != null)
                retryButton.onClick.AddListener(OnRetry);
            if (backButton != null)
                backButton.onClick.AddListener(OnBack);
        }

        private void OnDisable()
        {
            if (retryButton != null)
                retryButton.onClick.RemoveListener(OnRetry);
            if (backButton != null)
                backButton.onClick.RemoveListener(OnBack);
        }

        public void Show(string reason)
        {
            gameObject.SetActive(true);
            if (reasonText != null)
                reasonText.text = reason;
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
