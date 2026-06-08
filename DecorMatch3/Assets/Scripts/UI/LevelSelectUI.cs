using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace DecorMatch3
{
    public class LevelSelectUI : MonoBehaviour
    {
        [SerializeField] private Transform _levelButtonContainer;
        [SerializeField] private GameObject _levelButtonPrefab;
        [SerializeField] private Button _backBtn;

        private List<GameObject> _levelButtons = new List<GameObject>();

        private void Start()
        {
            _backBtn.onClick.AddListener(OnBack);
            Initialize();
        }

        public void Initialize()
        {
            foreach (var btn in _levelButtons)
            {
                Destroy(btn);
            }
            _levelButtons.Clear();

            if (ConfigManager.Instance == null) return;

            foreach (var config in ConfigManager.Instance.Levels)
            {
                CreateLevelButton(config);
            }
        }

        private void CreateLevelButton(LevelConfigData config)
        {
            GameObject btnObj = Instantiate(_levelButtonPrefab, _levelButtonContainer);
            Text btnText = btnObj.GetComponentInChildren<Text>();
            Button btn = btnObj.GetComponent<Button>();

            int levelId = config.levelId;
            btn.onClick.AddListener(() => OnLevelClicked(levelId));

            LevelRecordData record = null;
            if (SaveManager.Instance != null && SaveManager.Instance.CurrentSave != null && SaveManager.Instance.CurrentSave.levelRecords != null)
            {
                record = SaveManager.Instance.CurrentSave.levelRecords.Find(r => r.levelId == levelId);
            }

            bool isUnlocked = levelId == 1 || (record != null);
            if (record == null && levelId > 1)
            {
                LevelRecordData prevRecord = SaveManager.Instance?.CurrentSave?.levelRecords?.Find(r => r.levelId == levelId - 1);
                isUnlocked = prevRecord != null && prevRecord.bestStars > 0;
            }

            if (btnText != null)
            {
                if (!isUnlocked)
                {
                    btnText.text = levelId + "\n<locked>";
                    btn.interactable = false;
                    btnText.color = Color.gray;
                }
                else if (record != null && record.bestStars > 0)
                {
                    btnText.text = levelId + "\n" + new string('★', record.bestStars) + new string('☆', 3 - record.bestStars);
                    btnText.color = Color.yellow;
                }
                else
                {
                    btnText.text = levelId.ToString();
                    btnText.color = Color.white;
                }
            }

            _levelButtons.Add(btnObj);
        }

        private void OnLevelClicked(int levelId)
        {
            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySFX("button_click");
            }
            GameManager.Instance.LoadLevel(levelId);
        }

        private void OnBack()
        {
            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySFX("button_click");
            }
            GameManager.Instance.ChangeState(GameState.MainMenu);
        }

        public void RefreshButtons()
        {
            Initialize();
        }
    }
}
