using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Events;

namespace LakeNavigation
{
    public class TutorialPanel : IPanel
    {
        private static readonly string[] StepTexts = new string[]
        {
            "Welcome! You are a nature photographer navigating a lake. Plan your route based on weather conditions.",
            "Watch the weather forecast! Weather changes affect your visibility and fuel consumption. Warnings appear before changes.",
            "Plan your route by clicking waypoints. Headwinds slow you down and use more fuel. Tailwinds speed you up.",
            "Take photos of wildlife when close enough. Better distance and challenging weather mean higher quality photos!",
            "Manage your supplies carefully! Running out of fuel, food, or time means mission failure. Good luck!"
        };

        private int _currentStep;
        private Text _stepText;
        private Button _prevButton;
        private Button _nextButton;
        private Text _nextButtonText;
        private Image[] _dots;
        private Color _normalBtnColor = new Color32(70, 130, 180, 255);
        private Color _hoverBtnColor = new Color32(100, 160, 210, 255);

        public override void Setup(Transform parent)
        {
            _panelObject = new GameObject("TutorialPanel");
            _panelObject.transform.SetParent(parent, false);

            RectTransform rt = _panelObject.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            Image bg = _panelObject.AddComponent<Image>();
            bg.color = new Color32(15, 20, 35, 210);

            VerticalLayoutGroup mainLayout = _panelObject.AddComponent<VerticalLayoutGroup>();
            mainLayout.childAlignment = TextAnchor.MiddleCenter;
            mainLayout.spacing = 30f;
            mainLayout.childControlWidth = true;
            mainLayout.childControlHeight = false;
            mainLayout.childForceExpandWidth = true;
            mainLayout.childForceExpandHeight = false;
            mainLayout.padding = new RectOffset(150, 150, 80, 80);

            CreateHeader();
            CreateStepContent();
            CreateNavigationButtons();
            CreateStepIndicatorDots();

            _currentStep = 0;
            UpdateStepDisplay();
        }

        private void CreateHeader()
        {
            GameObject headerObj = new GameObject("Header");
            headerObj.transform.SetParent(_panelObject.transform, false);

            HorizontalLayoutGroup headerLayout = headerObj.AddComponent<HorizontalLayoutGroup>();
            headerLayout.childAlignment = TextAnchor.MiddleCenter;
            headerLayout.childControlWidth = true;
            headerLayout.childControlHeight = false;
            headerLayout.childForceExpandWidth = true;
            headerLayout.childForceExpandHeight = false;

            GameObject titleObj = new GameObject("Title");
            titleObj.transform.SetParent(headerObj.transform, false);

            Text title = titleObj.AddComponent<Text>();
            title.text = "HOW TO PLAY";
            title.font = UIHelper.DefaultFont;
            title.fontSize = 36;
            title.color = Color.white;
            title.alignment = TextAnchor.MiddleCenter;

            LayoutElement titleLe = titleObj.AddComponent<LayoutElement>();
            titleLe.preferredHeight = 50f;

            CreateSkipButton(headerObj);
        }

        private void CreateSkipButton(GameObject header)
        {
            GameObject skipObj = new GameObject("SkipButton");
            skipObj.transform.SetParent(header.transform, false);

            Image skipImg = skipObj.AddComponent<Image>();
            skipImg.color = new Color32(180, 60, 60, 255);

            ColorBlock skipColors = new ColorBlock
            {
                normalColor = new Color32(180, 60, 60, 255),
                highlightedColor = new Color32(210, 90, 90, 255),
                pressedColor = new Color32(150, 40, 40, 255),
                selectedColor = new Color32(210, 90, 90, 255),
                disabledColor = new Color32(128, 128, 128, 128),
                colorMultiplier = 1f,
                fadeDuration = 0.1f
            };

            Button skipBtn = skipObj.AddComponent<Button>();
            skipBtn.targetGraphic = skipImg;
            skipBtn.colors = skipColors;
            skipBtn.onClick.AddListener(CompleteTutorial);

            GameObject skipTextObj = new GameObject("Text");
            skipTextObj.transform.SetParent(skipObj.transform, false);

            Text skipText = skipTextObj.AddComponent<Text>();
            skipText.text = "Skip";
            skipText.font = UIHelper.DefaultFont;
            skipText.fontSize = 22;
            skipText.color = Color.white;
            skipText.alignment = TextAnchor.MiddleCenter;

            RectTransform skipTextRt = skipTextObj.GetComponent<RectTransform>();
            skipTextRt.anchorMin = Vector2.zero;
            skipTextRt.anchorMax = Vector2.one;
            skipTextRt.offsetMin = Vector2.zero;
            skipTextRt.offsetMax = Vector2.zero;

            LayoutElement skipLe = skipObj.AddComponent<LayoutElement>();
            skipLe.preferredHeight = 40f;
            skipLe.minWidth = 80f;
            skipLe.preferredWidth = 100f;
        }

        private void CreateStepContent()
        {
            GameObject contentObj = new GameObject("StepContent");
            contentObj.transform.SetParent(_panelObject.transform, false);

            Image contentBg = contentObj.AddComponent<Image>();
            contentBg.color = new Color32(25, 35, 55, 200);

            Outline outline = contentObj.AddComponent<Outline>();
            outline.effectColor = new Color32(70, 130, 180, 100);
            outline.effectDistance = new Vector2(2, -2);

            VerticalLayoutGroup contentLayout = contentObj.AddComponent<VerticalLayoutGroup>();
            contentLayout.childAlignment = TextAnchor.MiddleCenter;
            contentLayout.spacing = 10f;
            contentLayout.childControlWidth = true;
            contentLayout.childControlHeight = false;
            contentLayout.childForceExpandWidth = true;
            contentLayout.childForceExpandHeight = false;
            contentLayout.padding = new RectOffset(40, 40, 40, 40);

            GameObject stepLabelObj = new GameObject("StepLabel");
            stepLabelObj.transform.SetParent(contentObj.transform, false);

            Text stepLabel = stepLabelObj.AddComponent<Text>();
            stepLabel.font = UIHelper.DefaultFont;
            stepLabel.fontSize = 20;
            stepLabel.color = new Color32(150, 180, 220, 255);
            stepLabel.alignment = TextAnchor.MiddleCenter;

            LayoutElement labelLe = stepLabelObj.AddComponent<LayoutElement>();
            labelLe.preferredHeight = 30f;

            GameObject textObj = new GameObject("StepText");
            textObj.transform.SetParent(contentObj.transform, false);

            _stepText = textObj.AddComponent<Text>();
            _stepText.font = UIHelper.DefaultFont;
            _stepText.fontSize = 24;
            _stepText.color = Color.white;
            _stepText.alignment = TextAnchor.MiddleCenter;

            LayoutElement textLe = textObj.AddComponent<LayoutElement>();
            textLe.preferredHeight = 120f;
            textLe.minHeight = 80f;
        }

        private void CreateNavigationButtons()
        {
            GameObject navObj = new GameObject("Navigation");
            navObj.transform.SetParent(_panelObject.transform, false);

            HorizontalLayoutGroup navLayout = navObj.AddComponent<HorizontalLayoutGroup>();
            navLayout.childAlignment = TextAnchor.MiddleCenter;
            navLayout.spacing = 40f;
            navLayout.childControlWidth = true;
            navLayout.childControlHeight = false;
            navLayout.childForceExpandWidth = true;
            navLayout.childForceExpandHeight = false;

            ColorBlock navColors = new ColorBlock
            {
                normalColor = _normalBtnColor,
                highlightedColor = _hoverBtnColor,
                pressedColor = new Color32(50, 110, 160, 255),
                selectedColor = _hoverBtnColor,
                disabledColor = new Color32(128, 128, 128, 128),
                colorMultiplier = 1f,
                fadeDuration = 0.1f
            };

            _prevButton = CreateNavButton(navObj, "Previous", navColors, () => ChangeStep(-1));
            _nextButton = CreateNavButton(navObj, "Next", navColors, () =>
            {
                if (_currentStep >= StepTexts.Length - 1)
                {
                    CompleteTutorial();
                }
                else
                {
                    ChangeStep(1);
                }
            });

            _nextButtonText = _nextButton.GetComponentInChildren<Text>();
        }

        private Button CreateNavButton(GameObject parent, string label, ColorBlock colors, UnityAction onClick)
        {
            GameObject btnObj = new GameObject("Btn_" + label);
            btnObj.transform.SetParent(parent.transform, false);

            Image btnImage = btnObj.AddComponent<Image>();
            btnImage.color = colors.normalColor;

            Button button = btnObj.AddComponent<Button>();
            button.targetGraphic = btnImage;
            button.colors = colors;
            button.onClick.AddListener(onClick);

            GameObject textObj = new GameObject("Text");
            textObj.transform.SetParent(btnObj.transform, false);

            Text btnText = textObj.AddComponent<Text>();
            btnText.text = label;
            btnText.font = UIHelper.DefaultFont;
            btnText.fontSize = 26;
            btnText.color = Color.white;
            btnText.alignment = TextAnchor.MiddleCenter;

            RectTransform textRt = textObj.GetComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = Vector2.zero;
            textRt.offsetMax = Vector2.zero;

            LayoutElement le = btnObj.AddComponent<LayoutElement>();
            le.preferredHeight = 55f;
            le.minWidth = 180f;
            le.preferredWidth = 220f;

            return button;
        }

        private void CreateStepIndicatorDots()
        {
            GameObject dotsObj = new GameObject("StepDots");
            dotsObj.transform.SetParent(_panelObject.transform, false);

            HorizontalLayoutGroup dotsLayout = dotsObj.AddComponent<HorizontalLayoutGroup>();
            dotsLayout.childAlignment = TextAnchor.MiddleCenter;
            dotsLayout.spacing = 15f;
            dotsLayout.childControlWidth = false;
            dotsLayout.childControlHeight = false;
            dotsLayout.childForceExpandWidth = false;
            dotsLayout.childForceExpandHeight = false;

            _dots = new Image[StepTexts.Length];

            for (int i = 0; i < StepTexts.Length; i++)
            {
                GameObject dotObj = new GameObject("Dot_" + i);
                dotObj.transform.SetParent(dotsObj.transform, false);

                RectTransform dotRt = dotObj.AddComponent<RectTransform>();
                dotRt.sizeDelta = new Vector2(16f, 16f);

                Image dotImage = dotObj.AddComponent<Image>();
                dotImage.color = new Color32(100, 120, 150, 255);

                _dots[i] = dotImage;
            }
        }

        private void ChangeStep(int direction)
        {
            _currentStep = Mathf.Clamp(_currentStep + direction, 0, StepTexts.Length - 1);
            UpdateStepDisplay();
        }

        private void UpdateStepDisplay()
        {
            if (_stepText != null)
            {
                _stepText.text = StepTexts[_currentStep];
            }

            Text stepLabel = _panelObject.transform.Find("StepContent/StepLabel")?.GetComponent<Text>();
            if (stepLabel != null)
            {
                stepLabel.text = $"Step {_currentStep + 1} of {StepTexts.Length}";
            }

            _prevButton.interactable = _currentStep > 0;
            _nextButtonText.text = _currentStep >= StepTexts.Length - 1 ? "Start!" : "Next";

            for (int i = 0; i < _dots.Length; i++)
            {
                if (_dots[i] != null)
                {
                    _dots[i].color = i == _currentStep
                        ? new Color32(70, 130, 180, 255)
                        : new Color32(100, 120, 150, 255);
                }
            }
        }

        private void CompleteTutorial()
        {
            PlayerPrefs.SetInt("TutorialCompleted", 1);
            PlayerPrefs.Save();
            GameManager.Instance.ChangeState(GameState.MainMenu);
        }

        public override void Show()
        {
            if (_panelObject != null)
            {
                _currentStep = 0;
                UpdateStepDisplay();
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
