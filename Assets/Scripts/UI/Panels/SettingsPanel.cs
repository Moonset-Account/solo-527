using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Events;

namespace LakeNavigation
{
    public class SettingsPanel : IPanel
    {
        private Font _font;
        private GameState _previousState = GameState.MainMenu;

        private Slider _musicSlider;
        private Slider _sfxSlider;
        private Text _musicValueText;
        private Text _sfxValueText;
        private Toggle _weatherWarningsToggle;
        private Toggle _tutorialHintsToggle;
        private Toggle _debugModeToggle;
        private GameObject _confirmPanel;

        public override void Setup(Transform parent)
        {
            _font = UIHelper.DefaultFont;

            _panelObject = new GameObject("SettingsPanel");
            _panelObject.transform.SetParent(parent, false);

            RectTransform rt = _panelObject.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            Image bg = _panelObject.AddComponent<Image>();
            bg.color = new Color32(20, 28, 45, 210);

            VerticalLayoutGroup layout = _panelObject.AddComponent<VerticalLayoutGroup>();
            layout.childAlignment = TextAnchor.MiddleCenter;
            layout.spacing = 18f;
            layout.childControlWidth = true;
            layout.childControlHeight = false;
            layout.childForceExpandWidth = true;
            layout.childForceExpandHeight = false;
            layout.padding = new RectOffset(180, 180, 60, 60);

            CreateTitle();
            AddSpacer(12f);

            CreateSliderRow("Music Volume", out _musicSlider, out _musicValueText, OnMusicVolumeChanged);
            CreateSliderRow("SFX Volume", out _sfxSlider, out _sfxValueText, OnSFXVolumeChanged);

            AddSpacer(8f);

            _weatherWarningsToggle = CreateToggleRow("Show Weather Warnings", true, OnWeatherWarningsChanged);
            _tutorialHintsToggle = CreateToggleRow("Show Tutorial Hints", true, OnTutorialHintsChanged);
            _debugModeToggle = CreateToggleRow("Debug Mode", false, OnDebugModeChanged);

            AddSpacer(12f);

            CreateResetButton();
            AddSpacer(20f);
            CreateBackButton();

            CreateConfirmationPanel();

            _panelObject.SetActive(false);
        }

        public override void Show()
        {
            LoadSettings();
            SubscribeEvents();

            _panelObject.SetActive(true);
            IsVisible = true;
        }

        public override void Hide()
        {
            UnsubscribeEvents();

            _panelObject.SetActive(false);
            IsVisible = false;
        }

        private void OnDestroy()
        {
            UnsubscribeEvents();
        }

        private void SubscribeEvents()
        {
            if (GameManager.Instance != null)
                GameManager.Instance.OnStateChanged += OnGameStateChanged;
        }

        private void UnsubscribeEvents()
        {
            if (GameManager.Instance != null)
                GameManager.Instance.OnStateChanged -= OnGameStateChanged;
        }

        private void OnGameStateChanged(GameState from, GameState to)
        {
            if (to == GameState.Settings)
                _previousState = from;
        }

        private void LoadSettings()
        {
            float musicVol = UnityEngine.PlayerPrefs.GetFloat(GameConstants.PlayerPrefs.MusicVolume, 0.75f);
            float sfxVol = UnityEngine.PlayerPrefs.GetFloat(GameConstants.PlayerPrefs.SFXVolume, 0.75f);
            bool showWeather = UnityEngine.PlayerPrefs.GetInt("ShowWeatherWarnings", 1) == 1;
            bool showTutorial = UnityEngine.PlayerPrefs.GetInt("ShowTutorialHints", 1) == 1;
            bool debugMode = UnityEngine.PlayerPrefs.GetInt("DebugMode", 0) == 1;

            if (_musicSlider != null)
            {
                _musicSlider.value = musicVol;
                _musicValueText.text = Mathf.RoundToInt(musicVol * 100) + "%";
            }
            if (_sfxSlider != null)
            {
                _sfxSlider.value = sfxVol;
                _sfxValueText.text = Mathf.RoundToInt(sfxVol * 100) + "%";
            }
            if (_weatherWarningsToggle != null)
                _weatherWarningsToggle.isOn = showWeather;
            if (_tutorialHintsToggle != null)
                _tutorialHintsToggle.isOn = showTutorial;
            if (_debugModeToggle != null)
                _debugModeToggle.isOn = debugMode;
        }

        private void OnMusicVolumeChanged(float value)
        {
            UnityEngine.PlayerPrefs.SetFloat(GameConstants.PlayerPrefs.MusicVolume, value);
            UnityEngine.PlayerPrefs.Save();
            if (_musicValueText != null)
                _musicValueText.text = Mathf.RoundToInt(value * 100) + "%";
        }

        private void OnSFXVolumeChanged(float value)
        {
            UnityEngine.PlayerPrefs.SetFloat(GameConstants.PlayerPrefs.SFXVolume, value);
            UnityEngine.PlayerPrefs.Save();
            if (_sfxValueText != null)
                _sfxValueText.text = Mathf.RoundToInt(value * 100) + "%";
        }

        private void OnWeatherWarningsChanged(bool value)
        {
            UnityEngine.PlayerPrefs.SetInt("ShowWeatherWarnings", value ? 1 : 0);
            UnityEngine.PlayerPrefs.Save();
        }

        private void OnTutorialHintsChanged(bool value)
        {
            UnityEngine.PlayerPrefs.SetInt("ShowTutorialHints", value ? 1 : 0);
            UnityEngine.PlayerPrefs.Save();
        }

        private void OnDebugModeChanged(bool value)
        {
            UnityEngine.PlayerPrefs.SetInt("DebugMode", value ? 1 : 0);
            UnityEngine.PlayerPrefs.Save();
        }

        private void OnResetProgress()
        {
            _confirmPanel.SetActive(true);
        }

        private void OnConfirmReset()
        {
            UnityEngine.PlayerPrefs.DeleteAll();
            UnityEngine.PlayerPrefs.Save();
            _confirmPanel.SetActive(false);
            LoadSettings();
        }

        private void OnCancelReset()
        {
            _confirmPanel.SetActive(false);
        }

        private void OnBack()
        {
            GameManager.Instance.ChangeState(_previousState);
        }

        private void CreateTitle()
        {
            GameObject titleObj = new GameObject("Title");
            titleObj.transform.SetParent(_panelObject.transform, false);

            Text title = titleObj.AddComponent<Text>();
            title.text = "SETTINGS";
            title.font = _font;
            title.fontSize = 40;
            title.color = Color.white;
            title.alignment = TextAnchor.MiddleCenter;
            title.fontStyle = FontStyle.Bold;

            LayoutElement le = titleObj.AddComponent<LayoutElement>();
            le.preferredHeight = 60f;
            le.minWidth = 300f;
        }

        private void CreateSliderRow(string label, out Slider slider, out Text valueText, UnityAction<float> onValueChanged)
        {
            GameObject rowObj = new GameObject("SliderRow_" + label.Replace(" ", ""));
            rowObj.transform.SetParent(_panelObject.transform, false);

            HorizontalLayoutGroup rowLayout = rowObj.AddComponent<HorizontalLayoutGroup>();
            rowLayout.childAlignment = TextAnchor.MiddleLeft;
            rowLayout.spacing = 15f;
            rowLayout.childControlWidth = true;
            rowLayout.childControlHeight = false;
            rowLayout.childForceExpandWidth = true;
            rowLayout.childForceExpandHeight = false;

            LayoutElement rowLe = rowObj.AddComponent<LayoutElement>();
            rowLe.preferredHeight = 40f;

            GameObject labelObj = new GameObject("Label");
            labelObj.transform.SetParent(rowObj.transform, false);

            Text labelText = labelObj.AddComponent<Text>();
            labelText.font = _font;
            labelText.text = label;
            labelText.fontSize = 20;
            labelText.color = new Color32(200, 215, 235, 255);
            labelText.alignment = TextAnchor.MiddleLeft;

            LayoutElement labelLe = labelObj.AddComponent<LayoutElement>();
            labelLe.minWidth = 200f;
            labelLe.preferredWidth = 220f;
            labelLe.flexibleWidth = 0;

            GameObject sliderObj = new GameObject("Slider");
            sliderObj.transform.SetParent(rowObj.transform, false);

            RectTransform sliderRt = sliderObj.AddComponent<RectTransform>();
            LayoutElement sliderLe = sliderObj.AddComponent<LayoutElement>();
            sliderLe.minWidth = 150f;
            sliderLe.preferredWidth = 200f;
            sliderLe.flexibleWidth = 1;

            Image bgImg = sliderObj.AddComponent<Image>();
            bgImg.color = new Color32(40, 45, 60, 255);

            GameObject fillAreaObj = new GameObject("Fill Area");
            fillAreaObj.transform.SetParent(sliderObj.transform, false);
            RectTransform fillAreaRt = fillAreaObj.AddComponent<RectTransform>();
            fillAreaRt.anchorMin = Vector2.zero;
            fillAreaRt.anchorMax = Vector2.one;
            fillAreaRt.offsetMin = new Vector2(3, 3);
            fillAreaRt.offsetMax = new Vector2(-3, -3);

            GameObject fillObj = new GameObject("Fill");
            fillObj.transform.SetParent(fillAreaObj.transform, false);
            Image fillImg = fillObj.AddComponent<Image>();
            fillImg.color = new Color32(70, 130, 180, 255);
            RectTransform fillRt = fillObj.GetComponent<RectTransform>();
            fillRt.anchorMin = Vector2.zero;
            fillRt.anchorMax = new Vector2(0.75f, 1f);
            fillRt.offsetMin = Vector2.zero;
            fillRt.offsetMax = Vector2.zero;

            GameObject handleAreaObj = new GameObject("Handle Slide Area");
            handleAreaObj.transform.SetParent(sliderObj.transform, false);
            RectTransform handleAreaRt = handleAreaObj.AddComponent<RectTransform>();
            handleAreaRt.anchorMin = Vector2.zero;
            handleAreaRt.anchorMax = Vector2.one;
            handleAreaRt.offsetMin = new Vector2(8, 0);
            handleAreaRt.offsetMax = new Vector2(-8, 0);

            GameObject handleObj = new GameObject("Handle");
            handleObj.transform.SetParent(handleAreaObj.transform, false);
            Image handleImg = handleObj.AddComponent<Image>();
            handleImg.color = Color.white;
            RectTransform handleRt = handleObj.GetComponent<RectTransform>();
            handleRt.sizeDelta = new Vector2(20, 24);
            handleRt.anchorMin = new Vector2(0.75f, 0.5f);
            handleRt.anchorMax = new Vector2(0.75f, 0.5f);

            slider = sliderObj.AddComponent<Slider>();
            slider.fillRect = fillRt;
            slider.handleRect = handleRt;
            slider.targetGraphic = handleImg;
            slider.direction = Slider.Direction.LeftToRight;
            slider.minValue = 0f;
            slider.maxValue = 1f;
            slider.value = 0.75f;
            slider.onValueChanged.AddListener(onValueChanged);

            GameObject valObj = new GameObject("ValueText");
            valObj.transform.SetParent(rowObj.transform, false);

            valueText = valObj.AddComponent<Text>();
            valueText.font = _font;
            valueText.text = "75%";
            valueText.fontSize = 18;
            valueText.color = new Color32(180, 200, 230, 255);
            valueText.alignment = TextAnchor.MiddleCenter;

            LayoutElement valLe = valObj.AddComponent<LayoutElement>();
            valLe.minWidth = 50f;
            valLe.preferredWidth = 60f;
            valLe.flexibleWidth = 0;
        }

        private Toggle CreateToggleRow(string label, bool defaultValue, UnityAction<bool> onValueChanged)
        {
            GameObject rowObj = new GameObject("ToggleRow_" + label.Replace(" ", ""));
            rowObj.transform.SetParent(_panelObject.transform, false);

            HorizontalLayoutGroup rowLayout = rowObj.AddComponent<HorizontalLayoutGroup>();
            rowLayout.childAlignment = TextAnchor.MiddleLeft;
            rowLayout.spacing = 12f;
            rowLayout.childControlWidth = true;
            rowLayout.childControlHeight = false;
            rowLayout.childForceExpandWidth = true;
            rowLayout.childForceExpandHeight = false;

            LayoutElement rowLe = rowObj.AddComponent<LayoutElement>();
            rowLe.preferredHeight = 40f;

            GameObject bgObj = new GameObject("Background");
            bgObj.transform.SetParent(rowObj.transform, false);

            RectTransform bgRt = bgObj.AddComponent<RectTransform>();
            bgRt.sizeDelta = new Vector2(30, 30);
            LayoutElement bgLe = bgObj.AddComponent<LayoutElement>();
            bgLe.minWidth = 30f;
            bgLe.preferredWidth = 30f;
            bgLe.flexibleWidth = 0;

            Image bgImg = bgObj.AddComponent<Image>();
            bgImg.color = new Color32(40, 45, 60, 255);

            GameObject checkObj = new GameObject("Checkmark");
            checkObj.transform.SetParent(bgObj.transform, false);
            RectTransform checkRt = checkObj.AddComponent<RectTransform>();
            checkRt.anchorMin = Vector2.zero;
            checkRt.anchorMax = Vector2.one;
            checkRt.offsetMin = new Vector2(4, 4);
            checkRt.offsetMax = new Vector2(-4, -4);
            Image checkImg = checkObj.AddComponent<Image>();
            checkImg.color = new Color32(70, 200, 70, 255);

            Toggle toggle = rowObj.AddComponent<Toggle>();
            toggle.targetGraphic = bgImg;
            toggle.graphic = checkImg;
            toggle.isOn = defaultValue;
            toggle.onValueChanged.AddListener(onValueChanged);

            GameObject labelObj = new GameObject("Label");
            labelObj.transform.SetParent(rowObj.transform, false);

            Text labelText = labelObj.AddComponent<Text>();
            labelText.font = _font;
            labelText.text = label;
            labelText.fontSize = 20;
            labelText.color = new Color32(200, 215, 235, 255);
            labelText.alignment = TextAnchor.MiddleLeft;

            return toggle;
        }

        private void CreateResetButton()
        {
            GameObject btnObj = new GameObject("Btn_ResetProgress");
            btnObj.transform.SetParent(_panelObject.transform, false);

            Image btnImage = btnObj.AddComponent<Image>();
            btnImage.color = new Color32(160, 60, 60, 255);

            Button button = btnObj.AddComponent<Button>();
            button.targetGraphic = btnImage;
            button.colors = new ColorBlock
            {
                normalColor = new Color32(160, 60, 60, 255),
                highlightedColor = new Color32(190, 90, 90, 255),
                pressedColor = new Color32(130, 40, 40, 255),
                selectedColor = new Color32(190, 90, 90, 255),
                disabledColor = new Color32(80, 80, 80, 128),
                colorMultiplier = 1f,
                fadeDuration = 0.1f
            };
            button.onClick.AddListener(OnResetProgress);

            GameObject textObj = new GameObject("Text");
            textObj.transform.SetParent(btnObj.transform, false);

            Text btnText = textObj.AddComponent<Text>();
            btnText.text = "Reset Progress";
            btnText.font = _font;
            btnText.fontSize = 22;
            btnText.color = Color.white;
            btnText.alignment = TextAnchor.MiddleCenter;

            RectTransform textRt = textObj.GetComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = Vector2.zero;
            textRt.offsetMax = Vector2.zero;

            LayoutElement le = btnObj.AddComponent<LayoutElement>();
            le.preferredHeight = 50f;
            le.minWidth = 250f;
        }

        private void CreateBackButton()
        {
            GameObject btnObj = new GameObject("Btn_Back");
            btnObj.transform.SetParent(_panelObject.transform, false);

            Image btnImage = btnObj.AddComponent<Image>();
            btnImage.color = new Color32(70, 130, 180, 255);

            Button button = btnObj.AddComponent<Button>();
            button.targetGraphic = btnImage;
            button.colors = new ColorBlock
            {
                normalColor = new Color32(70, 130, 180, 255),
                highlightedColor = new Color32(100, 160, 210, 255),
                pressedColor = new Color32(50, 110, 160, 255),
                selectedColor = new Color32(100, 160, 210, 255),
                disabledColor = new Color32(80, 80, 80, 128),
                colorMultiplier = 1f,
                fadeDuration = 0.1f
            };
            button.onClick.AddListener(OnBack);

            GameObject textObj = new GameObject("Text");
            textObj.transform.SetParent(btnObj.transform, false);

            Text btnText = textObj.AddComponent<Text>();
            btnText.text = "Back";
            btnText.font = _font;
            btnText.fontSize = 24;
            btnText.color = Color.white;
            btnText.alignment = TextAnchor.MiddleCenter;

            RectTransform textRt = textObj.GetComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = Vector2.zero;
            textRt.offsetMax = Vector2.zero;

            LayoutElement le = btnObj.AddComponent<LayoutElement>();
            le.preferredHeight = 55f;
            le.minWidth = 200f;
        }

        private void CreateConfirmationPanel()
        {
            _confirmPanel = new GameObject("ConfirmationPanel");
            _confirmPanel.transform.SetParent(_panelObject.transform, false);

            RectTransform cpRt = _confirmPanel.AddComponent<RectTransform>();
            cpRt.anchorMin = Vector2.zero;
            cpRt.anchorMax = Vector2.one;
            cpRt.offsetMin = Vector2.zero;
            cpRt.offsetMax = Vector2.zero;

            Image cpBg = _confirmPanel.AddComponent<Image>();
            cpBg.color = new Color32(0, 0, 0, 200);

            VerticalLayoutGroup cpLayout = _confirmPanel.AddComponent<VerticalLayoutGroup>();
            cpLayout.childAlignment = TextAnchor.MiddleCenter;
            cpLayout.spacing = 20f;
            cpLayout.childControlWidth = true;
            cpLayout.childControlHeight = false;
            cpLayout.childForceExpandWidth = true;
            cpLayout.childForceExpandHeight = false;
            cpLayout.padding = new RectOffset(200, 200, 0, 0);

            GameObject boxObj = new GameObject("ConfirmBox");
            boxObj.transform.SetParent(_confirmPanel.transform, false);

            VerticalLayoutGroup boxLayout = boxObj.AddComponent<VerticalLayoutGroup>();
            boxLayout.childAlignment = TextAnchor.MiddleCenter;
            boxLayout.spacing = 15f;
            boxLayout.childControlWidth = true;
            boxLayout.childControlHeight = false;
            boxLayout.childForceExpandWidth = true;
            boxLayout.childForceExpandHeight = false;
            boxLayout.padding = new RectOffset(30, 30, 25, 25);

            Image boxBg = boxObj.AddComponent<Image>();
            boxBg.color = new Color32(40, 25, 25, 240);

            Outline boxOutline = boxObj.AddComponent<Outline>();
            boxOutline.effectColor = new Color32(180, 60, 60, 150);
            boxOutline.effectDistance = new Vector2(2, -2);

            GameObject questionObj = new GameObject("QuestionText");
            questionObj.transform.SetParent(boxObj.transform, false);
            Text questionText = questionObj.AddComponent<Text>();
            questionText.font = _font;
            questionText.text = "Are you sure?";
            questionText.fontSize = 28;
            questionText.color = new Color32(255, 200, 180, 255);
            questionText.alignment = TextAnchor.MiddleCenter;
            questionText.fontStyle = FontStyle.Bold;
            LayoutElement qLe = questionObj.AddComponent<LayoutElement>();
            qLe.preferredHeight = 40f;

            GameObject warnObj = new GameObject("WarnText");
            warnObj.transform.SetParent(boxObj.transform, false);
            Text warnText = warnObj.AddComponent<Text>();
            warnText.font = _font;
            warnText.text = "All progress will be lost.";
            warnText.fontSize = 18;
            warnText.color = new Color32(200, 180, 180, 255);
            warnText.alignment = TextAnchor.MiddleCenter;
            LayoutElement wLe = warnObj.AddComponent<LayoutElement>();
            wLe.preferredHeight = 28f;

            GameObject btnRow = new GameObject("ConfirmButtons");
            btnRow.transform.SetParent(boxObj.transform, false);
            HorizontalLayoutGroup btnLayout = btnRow.AddComponent<HorizontalLayoutGroup>();
            btnLayout.childAlignment = TextAnchor.MiddleCenter;
            btnLayout.spacing = 20f;
            btnLayout.childControlWidth = true;
            btnLayout.childControlHeight = false;
            btnLayout.childForceExpandWidth = true;
            btnLayout.childForceExpandHeight = false;
            LayoutElement brLe = btnRow.AddComponent<LayoutElement>();
            brLe.preferredHeight = 50f;

            CreateConfirmButton(btnRow.transform, "Yes", new Color32(180, 50, 50, 255), OnConfirmReset);
            CreateConfirmButton(btnRow.transform, "No", new Color32(70, 130, 180, 255), OnCancelReset);

            _confirmPanel.SetActive(false);
        }

        private void CreateConfirmButton(Transform parent, string label, Color32 bgColor, UnityAction onClick)
        {
            GameObject btnObj = new GameObject("Btn_" + label);
            btnObj.transform.SetParent(parent, false);

            Image btnImage = btnObj.AddComponent<Image>();
            btnImage.color = bgColor;

            Button button = btnObj.AddComponent<Button>();
            button.targetGraphic = btnImage;
            button.colors = UIHelper.MakeColorBlock(bgColor);
            button.onClick.AddListener(onClick);

            GameObject textObj = new GameObject("Text");
            textObj.transform.SetParent(btnObj.transform, false);

            Text btnText = textObj.AddComponent<Text>();
            btnText.text = label;
            btnText.font = _font;
            btnText.fontSize = 22;
            btnText.color = Color.white;
            btnText.alignment = TextAnchor.MiddleCenter;

            RectTransform textRt = textObj.GetComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = Vector2.zero;
            textRt.offsetMax = Vector2.zero;

            LayoutElement le = btnObj.AddComponent<LayoutElement>();
            le.preferredHeight = 45f;
            le.minWidth = 120f;
        }

        private void AddSpacer(float height)
        {
            GameObject spacer = new GameObject("Spacer");
            spacer.transform.SetParent(_panelObject.transform, false);

            LayoutElement le = spacer.AddComponent<LayoutElement>();
            le.preferredHeight = height;
            le.minHeight = height;
        }
    }
}
