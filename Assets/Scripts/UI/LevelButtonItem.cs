using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace SpaceCourier.UI
{
    public class LevelButtonItem : MonoBehaviour
    {
        [Header("References")]
        public Button button;
        public Image backgroundImage;
        public TextMeshProUGUI levelNameText;
        public TextMeshProUGUI levelDescriptionText;
        public TextMeshProUGUI difficultyText;
        public Image difficultyIcon;
        public Image lockIcon;

        [Header("Colors")]
        public Color easyColor = new Color(0.3f, 0.9f, 0.5f);
        public Color normalColor = new Color(0.5f, 0.8f, 1f);
        public Color hardColor = new Color(1f, 0.7f, 0.2f);
        public Color expertColor = new Color(1f, 0.3f, 0.3f);
        public Color tutorialColor = new Color(0.8f, 0.7f, 1f);

        private int levelId;
        public event Action<int> OnClicked;

        public void Initialize(int id, string name, string description, Difficulty diff)
        {
            levelId = id;

            if (levelNameText != null) levelNameText.text = name;
            if (levelDescriptionText != null) levelDescriptionText.text = description;
            if (difficultyText != null) difficultyText.text = GetDifficultyString(diff);
            if (difficultyIcon != null) difficultyIcon.color = GetDifficultyColor(diff);
            if (backgroundImage != null) backgroundImage.color = Color.Lerp(GetDifficultyColor(diff), Color.black, 0.75f);

            if (lockIcon != null) lockIcon.enabled = false;

            if (button != null)
            {
                button.onClick.RemoveAllListeners();
                button.onClick.AddListener(() => OnClicked?.Invoke(levelId));
            }
        }

        private string GetDifficultyString(Difficulty diff)
        {
            switch (diff)
            {
                case Difficulty.Tutorial: return "教程";
                case Difficulty.Easy: return "简单";
                case Difficulty.Normal: return "普通";
                case Difficulty.Hard: return "困难";
                case Difficulty.Expert: return "专家";
                default: return "未知";
            }
        }

        private Color GetDifficultyColor(Difficulty diff)
        {
            switch (diff)
            {
                case Difficulty.Tutorial: return tutorialColor;
                case Difficulty.Easy: return easyColor;
                case Difficulty.Normal: return normalColor;
                case Difficulty.Hard: return hardColor;
                case Difficulty.Expert: return expertColor;
                default: return Color.gray;
            }
        }
    }
}
