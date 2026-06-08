using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DataDiff = SpaceCourier.Data.Difficulty;

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

        public int levelId;
        public event Action<int> OnClicked;

        private void Awake()
        {
            EnsureComponents();
        }

        private void EnsureComponents()
        {
            var rt = GetComponent<RectTransform>();
            if (rt == null)
            {
                rt = gameObject.AddComponent<RectTransform>();
            }
            if (rt.sizeDelta == Vector2.zero)
            {
                rt.sizeDelta = new Vector2(200, 140);
            }

            if (backgroundImage == null)
            {
                backgroundImage = GetComponent<Image>();
                if (backgroundImage == null)
                {
                    backgroundImage = gameObject.AddComponent<Image>();
                    backgroundImage.color = Color.Lerp(hardColor, Color.black, 0.8f);
                }
            }
            if (button == null)
            {
                button = GetComponent<Button>();
                if (button == null)
                {
                    button = gameObject.AddComponent<Button>();
                    button.targetGraphic = backgroundImage;
                }
            }

            var fonts = Resources.FindObjectsOfTypeAll<TMP_FontAsset>();
            TMP_FontAsset font = fonts.Length > 0 ? fonts[0] : null;

            if (levelNameText == null)
            {
                var obj = new GameObject("LevelNameText");
                obj.transform.SetParent(transform, false);
                var iRT = obj.AddComponent<RectTransform>();
                iRT.anchorMin = new Vector2(0.05f, 0.65f);
                iRT.anchorMax = new Vector2(0.95f, 0.65f);
                iRT.offsetMin = new Vector2(0, -14);
                iRT.offsetMax = new Vector2(0, 14);
                var txt = obj.AddComponent<TextMeshProUGUI>();
                txt.fontSize = 22;
                txt.color = Color.white;
                txt.alignment = TextAlignmentOptions.Center;
                txt.font = font;
                levelNameText = txt;
            }
            if (levelDescriptionText == null)
            {
                var obj = new GameObject("LevelDescText");
                obj.transform.SetParent(transform, false);
                var iRT = obj.AddComponent<RectTransform>();
                iRT.anchorMin = new Vector2(0.05f, 0.42f);
                iRT.anchorMax = new Vector2(0.95f, 0.56f);
                iRT.offsetMin = Vector2.zero;
                iRT.offsetMax = Vector2.zero;
                var txt = obj.AddComponent<TextMeshProUGUI>();
                txt.fontSize = 14;
                txt.color = new Color(0.85f, 0.88f, 0.95f);
                txt.alignment = TextAlignmentOptions.Center;
                txt.enableWordWrapping = true;
                txt.font = font;
                levelDescriptionText = txt;
            }
            if (difficultyText == null)
            {
                var obj = new GameObject("DifficultyText");
                obj.transform.SetParent(transform, false);
                var iRT = obj.AddComponent<RectTransform>();
                iRT.anchorMin = new Vector2(0.05f, 0.2f);
                iRT.anchorMax = new Vector2(0.95f, 0.2f);
                iRT.offsetMin = new Vector2(0, -10);
                iRT.offsetMax = new Vector2(0, 10);
                var txt = obj.AddComponent<TextMeshProUGUI>();
                txt.fontSize = 16;
                txt.color = hardColor;
                txt.alignment = TextAlignmentOptions.Center;
                txt.font = font;
                difficultyText = txt;
            }
            if (difficultyIcon == null)
            {
                var obj = new GameObject("DifficultyIcon");
                obj.transform.SetParent(transform, false);
                var iRT = obj.AddComponent<RectTransform>();
                iRT.anchorMin = new Vector2(0.5f, 0.85f);
                iRT.anchorMax = new Vector2(0.5f, 0.85f);
                iRT.sizeDelta = new Vector2(18, 18);
                var img = obj.AddComponent<Image>();
                img.color = Color.gray;
                difficultyIcon = img;
            }
            if (lockIcon == null)
            {
                var obj = new GameObject("LockIcon");
                obj.transform.SetParent(transform, false);
                var iRT = obj.AddComponent<RectTransform>();
                iRT.anchorMin = new Vector2(0.9f, 0.1f);
                iRT.anchorMax = new Vector2(0.9f, 0.1f);
                iRT.sizeDelta = new Vector2(16, 16);
                var img = obj.AddComponent<Image>();
                img.color = new Color(0.5f, 0.5f, 0.6f, 0.8f);
                img.enabled = false;
                lockIcon = img;
            }
        }

        public void Initialize(int id, string name, string description, DataDiff diff)
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

        private string GetDifficultyString(DataDiff diff)
        {
            switch (diff)
            {
                case DataDiff.Tutorial: return "教程";
                case DataDiff.Easy: return "简单";
                case DataDiff.Normal: return "普通";
                case DataDiff.Hard: return "困难";
                case DataDiff.Expert: return "专家";
                default: return "未知";
            }
        }

        private Color GetDifficultyColor(DataDiff diff)
        {
            switch (diff)
            {
                case DataDiff.Tutorial: return tutorialColor;
                case DataDiff.Easy: return easyColor;
                case DataDiff.Normal: return normalColor;
                case DataDiff.Hard: return hardColor;
                case DataDiff.Expert: return expertColor;
                default: return Color.gray;
            }
        }
    }
}
