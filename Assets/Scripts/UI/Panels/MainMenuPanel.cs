using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Events;
using System.Collections.Generic;

namespace LakeNavigation
{
    public class MainMenuPanel : IPanel
    {
        private Color _normalColor = new Color32(70, 130, 180, 255);
        private Color _hoverColor = new Color32(100, 160, 210, 255);
        private ColorBlock _buttonColors;
        private VerticalLayoutGroup _mainLayout;
        private GameObject _levelSelectContainer;
        private List<Button> _levelButtons = new List<Button>();

        public override void Setup(Transform parent)
        {
            _buttonColors = new ColorBlock
            {
                normalColor = _normalColor,
                highlightedColor = _hoverColor,
                pressedColor = new Color32(50, 110, 160, 255),
                selectedColor = _hoverColor,
                disabledColor = new Color32(128, 128, 128, 128),
                colorMultiplier = 1f,
                fadeDuration = 0.1f
            };

            _panelObject = new GameObject("MainMenuPanel");
            _panelObject.transform.SetParent(parent, false);

            RectTransform rt = _panelObject.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            Image bg = _panelObject.AddComponent<Image>();
            bg.color = new Color32(30, 40, 60, 255);

            _mainLayout = _panelObject.AddComponent<VerticalLayoutGroup>();
            _mainLayout.childAlignment = TextAnchor.MiddleCenter;
            _mainLayout.spacing = 20f;
            _mainLayout.childControlWidth = true;
            _mainLayout.childControlHeight = false;
            _mainLayout.childForceExpandWidth = true;
            _mainLayout.childForceExpandHeight = false;
            _mainLayout.padding = new RectOffset(200, 200, 60, 60);

            ContentSizeFitter fitter = _panelObject.AddComponent<ContentSizeFitter>();
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            CreateTitle();
            CreateSubtitle();
            AddSpacer(30f);
            CreateButton("Play", new Color32(50, 150, 80, 255), ShowLevelSelect);
            CreateButton("Tutorial", _normalColor, () => GameManager.Instance.ChangeState(GameState.Tutorial));
            CreateButton("Encyclopedia", new Color32(140, 100, 180, 255), () => GameManager.Instance.ChangeState(GameState.Encyclopedia));
            CreateButton("Settings", new Color32(90, 90, 130, 255), () => GameManager.Instance.ChangeState(GameState.Settings));
            CreateButton("Quit", new Color32(160, 60, 60, 255), () => Application.Quit());

            _levelSelectContainer = new GameObject("LevelSelect");
            _levelSelectContainer.transform.SetParent(_panelObject.transform, false);
            _levelSelectContainer.SetActive(false);
        }

        private void ShowLevelSelect()
        {
            var levelManager = FindObjectOfType<LevelManager>();
            if (levelManager == null) return;

            for (int i = _levelSelectContainer.transform.childCount - 1; i >= 0; i--)
                Destroy(_levelSelectContainer.transform.GetChild(i).gameObject);
            _levelButtons.Clear();

            _levelSelectContainer.SetActive(true);

            var layout = _levelSelectContainer.AddComponent<VerticalLayoutGroup>();
            if (_levelSelectContainer.GetComponent<VerticalLayoutGroup>() != null &&
                _levelSelectContainer.GetComponent<VerticalLayoutGroup>() != layout)
            {
                Destroy(_levelSelectContainer.GetComponent<VerticalLayoutGroup>());
            }
            layout = _levelSelectContainer.GetComponent<VerticalLayoutGroup>();
            if (layout == null) layout = _levelSelectContainer.AddComponent<VerticalLayoutGroup>();
            layout.childAlignment = TextAnchor.MiddleCenter;
            layout.spacing = 10f;
            layout.childControlWidth = true;
            layout.childControlHeight = false;
            layout.childForceExpandWidth = true;
            layout.childForceExpandHeight = false;
            layout.padding = new RectOffset(40, 40, 10, 10);

            var headerObj = new GameObject("Header");
            headerObj.transform.SetParent(_levelSelectContainer.transform, false);
            var headerText = headerObj.AddComponent<Text>();
            headerText.text = "SELECT LEVEL";
            headerText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            headerText.fontSize = 28;
            headerText.color = new Color32(200, 215, 235, 255);
            headerText.alignment = TextAnchor.MiddleCenter;
            var headerLe = headerObj.AddComponent<LayoutElement>();
            headerLe.preferredHeight = 40f;

            for (int i = 0; i < levelManager.levels.Count; i++)
            {
                int capturedIndex = i;
                var level = levelManager.levels[i];
                bool unlocked = levelManager.IsLevelUnlocked(i);
                int stars = levelManager.GetLevelStars(i);

                var btnObj = new GameObject("LevelBtn_" + i);
                btnObj.transform.SetParent(_levelSelectContainer.transform, false);

                var btnImage = btnObj.AddComponent<Image>();
                Color32 btnColor = unlocked ? new Color32(50, 110, 160, 255) : new Color32(80, 80, 80, 200);
                btnImage.color = btnColor;

                var button = btnObj.AddComponent<Button>();
                button.targetGraphic = btnImage;
                button.interactable = unlocked;
                button.colors = new ColorBlock
                {
                    normalColor = btnColor,
                    highlightedColor = new Color32(Mathf.Min(btnColor.r + 30, 255), Mathf.Min(btnColor.g + 30, 255), Mathf.Min(btnColor.b + 30, 255), btnColor.a),
                    pressedColor = new Color32(Mathf.Max(btnColor.r - 20, 0), Mathf.Max(btnColor.g - 20, 0), Mathf.Max(btnColor.b - 20, 0), btnColor.a),
                    selectedColor = btnColor,
                    disabledColor = new Color32(80, 80, 80, 128),
                    colorMultiplier = 1f,
                    fadeDuration = 0.1f
                };

                if (unlocked)
                    button.onClick.AddListener(() => StartLevel(capturedIndex));

                var hLayout = new GameObject("Content");
                hLayout.transform.SetParent(btnObj.transform, false);
                var hLayoutGroup = hLayout.AddComponent<HorizontalLayoutGroup>();
                hLayoutGroup.childAlignment = TextAnchor.MiddleLeft;
                hLayoutGroup.spacing = 10f;
                hLayoutGroup.childControlWidth = true;
                hLayoutGroup.childControlHeight = false;
                hLayoutGroup.childForceExpandWidth = true;
                hLayoutGroup.childForceExpandHeight = false;
                hLayoutGroup.padding = new RectOffset(15, 10, 5, 5);

                var nameObj = new GameObject("Name");
                nameObj.transform.SetParent(hLayout.transform, false);
                var nameText = nameObj.AddComponent<Text>();
                nameText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                nameText.text = unlocked ? level.LevelName : "???";
                nameText.fontSize = 20;
                nameText.color = unlocked ? Color.white : new Color32(140, 140, 140, 255);
                nameText.alignment = TextAnchor.MiddleLeft;
                var nameLe = nameObj.AddComponent<LayoutElement>();
                nameLe.preferredWidth = 200f;
                nameLe.flexibleWidth = 1;

                var starObj = new GameObject("Stars");
                starObj.transform.SetParent(hLayout.transform, false);
                var starText = starObj.AddComponent<Text>();
                starText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                starText.text = unlocked ? new string('\u2605', stars) + new string('\u2606', 3 - stars) : "";
                starText.fontSize = 18;
                starText.color = new Color32(255, 215, 0, 255);
                starText.alignment = TextAnchor.MiddleRight;
                var starLe = starObj.AddComponent<LayoutElement>();
                starLe.preferredWidth = 80f;
                starLe.flexibleWidth = 0;

                var btnLe = btnObj.AddComponent<LayoutElement>();
                btnLe.preferredHeight = 45f;
                btnLe.minWidth = 350f;
            }

            CreateButton("Back", new Color32(160, 60, 60, 255), HideLevelSelect, _levelSelectContainer.transform);
        }

        private void HideLevelSelect()
        {
            _levelSelectContainer.SetActive(false);
        }

        private void StartLevel(int levelIndex)
        {
            GameManager.Instance.StartLevel(levelIndex);
        }

        private void CreateTitle()
        {
            GameObject titleObj = new GameObject("Title");
            titleObj.transform.SetParent(_panelObject.transform, false);

            Text title = titleObj.AddComponent<Text>();
            title.text = "LAKE NAVIGATOR";
            title.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            title.fontSize = 48;
            title.color = Color.white;
            title.alignment = TextAnchor.MiddleCenter;

            LayoutElement le = titleObj.AddComponent<LayoutElement>();
            le.preferredHeight = 70f;
            le.minWidth = 400f;
        }

        private void CreateSubtitle()
        {
            GameObject subObj = new GameObject("Subtitle");
            subObj.transform.SetParent(_panelObject.transform, false);

            Text sub = subObj.AddComponent<Text>();
            sub.text = "A Weather Strategy Game";
            sub.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            sub.fontSize = 24;
            sub.color = new Color32(200, 210, 230, 255);
            sub.alignment = TextAnchor.MiddleCenter;

            LayoutElement le = subObj.AddComponent<LayoutElement>();
            le.preferredHeight = 40f;
            le.minWidth = 300f;
        }

        private void AddSpacer(float height)
        {
            GameObject spacer = new GameObject("Spacer");
            spacer.transform.SetParent(_panelObject.transform, false);

            LayoutElement le = spacer.AddComponent<LayoutElement>();
            le.preferredHeight = height;
            le.minHeight = height;
        }

        private void CreateButton(string label, Color32 bgColor, UnityAction onClick, Transform parent = null)
        {
            if (parent == null) parent = _panelObject.transform;

            GameObject btnObj = new GameObject("Btn_" + label.Replace(" ", ""));
            btnObj.transform.SetParent(parent, false);

            Image btnImage = btnObj.AddComponent<Image>();
            btnImage.color = bgColor;

            Button button = btnObj.AddComponent<Button>();
            button.targetGraphic = btnImage;
            button.colors = new ColorBlock
            {
                normalColor = bgColor,
                highlightedColor = new Color32(Mathf.Min(bgColor.r + 30, 255), Mathf.Min(bgColor.g + 30, 255), Mathf.Min(bgColor.b + 30, 255), bgColor.a),
                pressedColor = new Color32(Mathf.Max(bgColor.r - 20, 0), Mathf.Max(bgColor.g - 20, 0), Mathf.Max(bgColor.b - 20, 0), bgColor.a),
                selectedColor = bgColor,
                disabledColor = new Color32(128, 128, 128, 128),
                colorMultiplier = 1f,
                fadeDuration = 0.1f
            };
            button.onClick.AddListener(onClick);

            GameObject textObj = new GameObject("Text");
            textObj.transform.SetParent(btnObj.transform, false);

            RectTransform textRt = textObj.GetComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = Vector2.zero;
            textRt.offsetMax = Vector2.zero;

            Text btnText = textObj.AddComponent<Text>();
            btnText.text = label;
            btnText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            btnText.fontSize = 28;
            btnText.color = Color.white;
            btnText.alignment = TextAnchor.MiddleCenter;

            LayoutElement le = btnObj.AddComponent<LayoutElement>();
            le.preferredHeight = 60f;
            le.minWidth = 300f;
        }

        public override void Show()
        {
            if (_panelObject != null)
            {
                _levelSelectContainer.SetActive(false);
                _panelObject.SetActive(true);
                IsVisible = true;
            }
        }

        public override void Hide()
        {
            if (_panelObject != null)
            {
                _panelObject.SetActive(false);
                IsVisible = false;
            }
        }
    }
}
