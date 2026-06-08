using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace DecorMatch3
{
    public class ResultUI : MonoBehaviour
    {
        [SerializeField] private Text _scoreText;
        [SerializeField] private Text _starsText;
        [SerializeField] private Text _feedbackText;
        [SerializeField] private Text _materialsText;
        [SerializeField] private Button _nextLevelBtn;
        [SerializeField] private Button _retryBtn;
        [SerializeField] private Button _decorationBtn;
        [SerializeField] private Button _menuBtn;
        [SerializeField] private GameObject[] _starImages;

        private int _currentLevelId;

        private void Start()
        {
            _nextLevelBtn.onClick.AddListener(OnNextLevel);
            _retryBtn.onClick.AddListener(OnRetry);
            _decorationBtn.onClick.AddListener(OnDecoration);
            _menuBtn.onClick.AddListener(OnMenu);
        }

        public void ShowLevelResult(int levelId, int score, int stars, int materials)
        {
            _currentLevelId = levelId;

            if (_scoreText != null) _scoreText.text = score.ToString();
            if (_starsText != null) _starsText.text = stars + " / 3";
            if (_materialsText != null) _materialsText.text = "Materials: " + materials;

            PlayResultSound(stars > 0);
            StartCoroutine(PlayStarAnimation(stars));

            if (SaveManager.Instance != null)
            {
                SaveManager.Instance.UpdateLevelRecord(levelId, score, stars, stars > 0);
                SaveManager.Instance.Save();
            }
        }

        public void ShowDecorationResult(float totalScore, int stars, string feedback)
        {
            if (_scoreText != null) _scoreText.text = totalScore.ToString("F1");
            if (_starsText != null) _starsText.text = stars + " / 3";
            if (_feedbackText != null) _feedbackText.text = feedback;

            PlayResultSound(stars > 0);
            StartCoroutine(PlayStarAnimation(stars));

            if (_decorationBtn != null) _decorationBtn.gameObject.SetActive(false);
        }

        public IEnumerator PlayStarAnimation(int starCount)
        {
            if (_starImages == null) yield break;

            for (int i = 0; i < _starImages.Length; i++)
            {
                if (_starImages[i] != null)
                {
                    _starImages[i].SetActive(false);
                }
            }

            for (int i = 0; i < Mathf.Min(starCount, _starImages.Length); i++)
            {
                if (_starImages[i] != null)
                {
                    _starImages[i].SetActive(true);
                    Image img = _starImages[i].GetComponent<Image>();
                    if (img != null)
                    {
                        Color c = img.color;
                        c.a = 0f;
                        img.color = c;

                        float elapsed = 0f;
                        float duration = 0.5f;
                        while (elapsed < duration)
                        {
                            elapsed += Time.deltaTime;
                            c.a = Mathf.Clamp01(elapsed / duration);
                            img.color = c;
                            yield return null;
                        }
                    }

                    if (AudioManager.Instance != null)
                    {
                        AudioManager.Instance.PlaySFX("star_earn");
                    }

                    yield return new WaitForSeconds(0.3f);
                }
            }
        }

        private void OnNextLevel()
        {
            PlayButtonSound();
            GameManager.Instance.LoadLevel(_currentLevelId + 1);
        }

        private void OnRetry()
        {
            PlayButtonSound();
            GameManager.Instance.LoadLevel(_currentLevelId);
        }

        private void OnDecoration()
        {
            PlayButtonSound();
            GameManager.Instance.ChangeState(GameState.Decoration);
        }

        private void OnMenu()
        {
            PlayButtonSound();
            GameManager.Instance.ChangeState(GameState.MainMenu);
        }

        public void PlayResultSound(bool success)
        {
            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySFX(success ? "result_success" : "result_fail");
            }
        }

        private void PlayButtonSound()
        {
            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySFX("button_click");
            }
        }
    }
}
