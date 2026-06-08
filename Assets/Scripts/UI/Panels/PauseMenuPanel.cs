using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Events;

namespace LakeNavigation
{
    public class PauseMenuPanel : IPanel
    {
        private Font _font;
        private ColorBlock _buttonColors;

        public override void Setup(Transform parent)
        {
            _font = UIHelper.DefaultFont;

            _buttonColors = new ColorBlock
            {
                normalColor = new Color32(70, 130, 180, 255),
                highlightedColor = new Color32(100, 160, 210, 255),
                pressedColor = new Color32(50, 110, 160, 255),
                selectedColor = new Color32(100, 160, 210, 255),
                disabledColor = new Color32(128, 128, 128, 128),
                colorMultiplier = 1f,
                fadeDuration = 0.1f
            };

            _panelObject = new GameObject("PauseMenuPanel");
            _panelObject.transform.SetParent(parent, false);

            RectTransform rt = _panelObject.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            Image bg = _panelObject.AddComponent<Image>();
            bg.color = new Color32(0, 0, 0, 180);

            VerticalLayoutGroup layout = _panelObject.AddComponent<VerticalLayoutGroup>();
            layout.childAlignment = TextAnchor.MiddleCenter;
            layout.spacing = 20f;
            layout.childControlWidth = true;
            layout.childControlHeight = false;
            layout.childForceExpandWidth = true;
            layout.childForceExpandHeight = false;
            layout.padding = new RectOffset(200, 200, 100, 100);

            CreateTitle();
            AddSpacer(20f);
            CreateButton("Resume", new Color32(50, 160, 80, 255), OnResume);
            CreateButton("Settings", new Color32(140, 100, 180, 255), OnSettings);
            CreateButton("Restart Level", new Color32(180, 130, 50, 255), OnRestartLevel);
            CreateButton("Main Menu", new Color32(90, 90, 110, 255), OnMainMenu);
            AddSpacer(30f);
            CreateHintText();

            _panelObject.SetActive(false);
        }

        public override void Show()
        {
            if (_panelObject != null)
            {
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

        private void CreateTitle()
        {
            GameObject titleObj = new GameObject("Title");
            titleObj.transform.SetParent(_panelObject.transform, false);

            Text title = titleObj.AddComponent<Text>();
            title.text = "PAUSED";
            title.font = _font;
            title.fontSize = 48;
            title.color = Color.white;
            title.alignment = TextAnchor.MiddleCenter;
            title.fontStyle = FontStyle.Bold;

            LayoutElement le = titleObj.AddComponent<LayoutElement>();
            le.preferredHeight = 70f;
            le.minWidth = 300f;
        }

        private void CreateButton(string label, Color32 bgColor, UnityAction onClick)
        {
            GameObject btnObj = new GameObject("Btn_" + label.Replace(" ", ""));
            btnObj.transform.SetParent(_panelObject.transform, false);

            Image btnImage = btnObj.AddComponent<Image>();
            btnImage.color = bgColor;

            Button button = btnObj.AddComponent<Button>();
            button.targetGraphic = btnImage;
            button.colors = UIHelper.MakeColorBlock(bgColor);
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
            btnText.font = _font;
            btnText.fontSize = 28;
            btnText.color = Color.white;
            btnText.alignment = TextAnchor.MiddleCenter;

            LayoutElement le = btnObj.AddComponent<LayoutElement>();
            le.preferredHeight = 60f;
            le.minWidth = 300f;
        }

        private void CreateHintText()
        {
            GameObject hintObj = new GameObject("HintText");
            hintObj.transform.SetParent(_panelObject.transform, false);

            Text hint = hintObj.AddComponent<Text>();
            hint.text = "Press ESC to resume";
            hint.font = _font;
            hint.fontSize = 16;
            hint.color = new Color32(140, 150, 170, 255);
            hint.alignment = TextAnchor.MiddleCenter;

            LayoutElement le = hintObj.AddComponent<LayoutElement>();
            le.preferredHeight = 25f;
            le.minWidth = 200f;
        }

        private void AddSpacer(float height)
        {
            GameObject spacer = new GameObject("Spacer");
            spacer.transform.SetParent(_panelObject.transform, false);

            LayoutElement le = spacer.AddComponent<LayoutElement>();
            le.preferredHeight = height;
            le.minHeight = height;
        }

        private void OnResume()
        {
            GameManager.Instance.ResumeGame();
        }

        private void OnSettings()
        {
            GameManager.Instance.ChangeState(GameState.Settings);
        }

        private void OnRestartLevel()
        {
            var lm = FindObjectOfType<LevelManager>();
            if (lm != null)
                lm.LoadLevel(GameManager.Instance.CurrentLevelIndex);
            GameManager.Instance.RestartLevel();
        }

        private void OnMainMenu()
        {
            GameManager.Instance.ReturnToMenu();
        }
    }
}
