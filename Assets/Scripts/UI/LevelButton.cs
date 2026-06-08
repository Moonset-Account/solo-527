using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowPlatformer.Level;
using ShadowPlatformer.Save;
using System;

namespace ShadowPlatformer.UI
{
    public class LevelButton : MonoBehaviour
    {
        public TMP_Text levelNameText;
        public TMP_Text bestTimeText;
        public Image completionIcon;
        public Image lockIcon;
        public Button button;

        private LevelData _data;
        private Action<LevelData> _onSelected;

        public void Setup(LevelData data, bool unlocked, Action<LevelData> onSelected)
        {
            _data = data;
            _onSelected = onSelected;

            if (levelNameText != null) levelNameText.text = data.levelName;

            if (bestTimeText != null)
                bestTimeText.text = data.bestTime > 0 ? FormatTime(data.bestTime) : "--:--";

            if (completionIcon != null) completionIcon.gameObject.SetActive(data.isCompleted);
            if (lockIcon != null) lockIcon.gameObject.SetActive(!unlocked);
            if (button != null)
            {
                button.interactable = unlocked;
                button.onClick.AddListener(OnClick);
            }
        }

        private void OnClick()
        {
            _onSelected?.Invoke(_data);
        }

        private string FormatTime(float seconds)
        {
            int m = (int)(seconds / 60f);
            int s = (int)(seconds % 60f);
            return $"{m:00}:{s:00}";
        }
    }
}
