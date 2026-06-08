using UnityEngine;
using UnityEngine.UI;

namespace DecorMatch3
{
    public class MainMenuUI : MonoBehaviour
    {
        [SerializeField] private Button _newGameBtn;
        [SerializeField] private Button _continueBtn;
        [SerializeField] private Button _settingsBtn;
        [SerializeField] private Button _quitBtn;
        [SerializeField] private GameObject _continuePanel;

        private void Start()
        {
            _newGameBtn.onClick.AddListener(OnNewGame);
            _continueBtn.onClick.AddListener(OnContinue);
            _settingsBtn.onClick.AddListener(OnSettings);
            _quitBtn.onClick.AddListener(OnQuit);

            if (_continuePanel != null)
            {
                _continuePanel.SetActive(SaveManager.Instance != null && SaveManager.Instance.HasSave());
            }
        }

        private void OnNewGame()
        {
            PlayButtonSound();
            if (SaveManager.Instance != null)
            {
                SaveManager.Instance.DeleteSave();
            }
            GameManager.Instance.StartNewGame();
        }

        private void OnContinue()
        {
            PlayButtonSound();
            GameManager.Instance.ChangeState(GameState.LevelSelect);
        }

        private void OnSettings()
        {
            PlayButtonSound();
            GameManager.Instance.ChangeState(GameState.Settings);
        }

        private void OnQuit()
        {
            PlayButtonSound();
            GameManager.Instance.QuitGame();
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
