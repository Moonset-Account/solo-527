using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Events;
using System;
using System.Collections;
using System.Collections.Generic;

namespace LakeNavigation
{
    public class HUDPanel : IPanel
    {
        private SupplyManager _supplyManager;
        private MissionManager _missionManager;
        private BoatController _boatController;
        private Font _font;
        private Sprite _circleSprite;

        private Image _fuelBarFill;
        private Image _foodBarFill;
        private Image _batteryBarFill;
        private Text _fuelPctText;
        private Text _foodPctText;
        private Text _batteryPctText;

        private Text _weatherText;
        private Text _windText;
        private RectTransform _windArrowRect;

        private GameObject _warningPanel;
        private CanvasGroup _warningCanvasGroup;
        private Text _warningText;
        private Text _warningCountdownText;
        private Coroutine _warningCoroutine;

        private Transform _checklistContainer;
        private readonly Dictionary<string, Text> _checklistTexts = new Dictionary<string, Text>();

        private Text _timerText;
        private RectTransform _compassNeedle;

        public override void Setup(Transform parent)
        {
            _font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            _circleSprite = CreateCircleSprite(64);

            _panelObject = new GameObject("HUDPanel");
            _panelObject.transform.SetParent(parent, false);

            var rect = _panelObject.AddComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;

            CreateSupplyBars();
            CreateWeatherPanel();
            CreateWarningPanel();
            CreateTimerDisplay();
            CreateCompass();
            CreateMissionChecklist();
            CreatePhotoButton();
            CreatePauseButton();

            _panelObject.SetActive(false);
        }

        public override void Show()
        {
            _supplyManager = FindObjectOfType<SupplyManager>();
            _missionManager = FindObjectOfType<MissionManager>();
            _boatController = FindObjectOfType<BoatController>();

            IsVisible = true;
            _panelObject.SetActive(true);
            SubscribeEvents();
            UpdateDisplay();
        }

        public override void Hide()
        {
            IsVisible = false;
            _panelObject.SetActive(false);
            UnsubscribeEvents();
        }

        private void OnDestroy()
        {
            UnsubscribeEvents();
        }

        private void SubscribeEvents()
        {
            if (_supplyManager != null)
                _supplyManager.OnSupplyChanged += OnSupplyChanged;
            if (WeatherSystem.Instance != null)
            {
                WeatherSystem.Instance.OnWeatherChanged += OnWeatherChanged;
                WeatherSystem.Instance.OnWeatherWarning += OnWeatherWarning;
            }
            if (_missionManager != null)
            {
                _missionManager.OnPhotoTaken += OnPhotoTaken;
                _missionManager.OnTimeChanged += OnTimeChanged;
            }
            if (_boatController != null)
                _boatController.OnBoatMoved += OnBoatMoved;
        }

        private void UnsubscribeEvents()
        {
            if (_supplyManager != null)
                _supplyManager.OnSupplyChanged -= OnSupplyChanged;
            if (WeatherSystem.Instance != null)
            {
                WeatherSystem.Instance.OnWeatherChanged -= OnWeatherChanged;
                WeatherSystem.Instance.OnWeatherWarning -= OnWeatherWarning;
            }
            if (_missionManager != null)
            {
                _missionManager.OnPhotoTaken -= OnPhotoTaken;
                _missionManager.OnTimeChanged -= OnTimeChanged;
            }
            if (_boatController != null)
                _boatController.OnBoatMoved -= OnBoatMoved;
        }

        public void UpdateDisplay()
        {
            if (_supplyManager != null)
            {
                UpdateSupplyBar(SupplyType.Fuel, _supplyManager.GetPercentage(SupplyType.Fuel));
                UpdateSupplyBar(SupplyType.Food, _supplyManager.GetPercentage(SupplyType.Food));
                UpdateSupplyBar(SupplyType.Battery, _supplyManager.GetPercentage(SupplyType.Battery));
            }
            UpdateWeatherDisplay();
            RebuildChecklist();
            if (_missionManager != null)
                UpdateTimer(_missionManager.timeRemaining);
            UpdateCompass();
        }

        private void OnSupplyChanged(SupplyType type, float current, float max)
        {
            float pct = max > 0f ? current / max : 0f;
            UpdateSupplyBar(type, pct);
        }

        private void OnWeatherChanged(WeatherType previous, WeatherType current)
        {
            UpdateWeatherDisplay();
        }

        private void OnWeatherWarning(WeatherForecast forecast)
        {
            ShowWarning(forecast.WarningMessage, forecast.TimeUntilChange);
        }

        private void OnPhotoTaken(PhotoTarget target, PhotoQuality quality)
        {
            if (_checklistTexts.TryGetValue(target.Id, out var text))
            {
                text.text = "✓ " + target.DisplayName;
                text.color = new Color(0.4f, 1f, 0.4f);
            }
        }

        private void OnTimeChanged(float remaining)
        {
            UpdateTimer(remaining);
        }

        private void OnBoatMoved(Vector2 position)
        {
            UpdateCompass();
        }

        private void UpdateSupplyBar(SupplyType type, float pct)
        {
            pct = Mathf.Clamp01(pct);
            Image fill = null;
            Text pctText = null;

            switch (type)
            {
                case SupplyType.Fuel: fill = _fuelBarFill; pctText = _fuelPctText; break;
                case SupplyType.Food: fill = _foodBarFill; pctText = _foodPctText; break;
                case SupplyType.Battery: fill = _batteryBarFill; pctText = _batteryPctText; break;
            }

            if (fill != null) fill.fillAmount = pct;
            if (pctText != null) pctText.text = Mathf.RoundToInt(pct * 100) + "%";
        }

        private void UpdateWeatherDisplay()
        {
            if (WeatherSystem.Instance == null) return;
            _weatherText.text = FormatWeatherType(WeatherSystem.Instance.CurrentWeather);
            var wind = WeatherSystem.Instance.CurrentWind;
            _windText.text = "Wind: " + WindDirToLabel(wind.Direction) + " " + wind.Speed.ToString("F1");
            float angle = WindDirToAngle(wind.Direction);
            _windArrowRect.localEulerAngles = new Vector3(0, 0, -angle);
        }

        private void UpdateTimer(float remaining)
        {
            int totalSeconds = Mathf.Max(0, Mathf.RoundToInt(remaining));
            _timerText.text = string.Format("{0:D2}:{1:D2}", totalSeconds / 60, totalSeconds % 60);
            _timerText.color = remaining < 30f ? new Color(1f, 0.25f, 0.2f) : Color.white;
        }

        private void UpdateCompass()
        {
            if (WeatherSystem.Instance == null) return;
            float angle = WindDirToAngle(WeatherSystem.Instance.CurrentWind.Direction);
            _compassNeedle.localEulerAngles = new Vector3(0, 0, -angle);
        }

        private void ShowWarning(string message, float countdown)
        {
            if (_warningCoroutine != null)
                StopCoroutine(_warningCoroutine);

            _warningText.text = message;
            _warningCountdownText.text = countdown.ToString("F0") + "s";
            _warningCanvasGroup.alpha = 1f;
            _warningPanel.SetActive(true);
            _warningCoroutine = StartCoroutine(FadeWarningCoroutine());
        }

        private IEnumerator FadeWarningCoroutine()
        {
            yield return new WaitForSeconds(5f);
            float duration = 0.5f;
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                _warningCanvasGroup.alpha = 1f - (elapsed / duration);
                yield return null;
            }
            _warningPanel.SetActive(false);
            _warningCanvasGroup.alpha = 1f;
            _warningCoroutine = null;
        }

        private void RebuildChecklist()
        {
            if (_missionManager == null) return;
            _checklistTexts.Clear();
            for (int i = _checklistContainer.childCount - 1; i >= 0; i--)
                Destroy(_checklistContainer.GetChild(i).gameObject);

            foreach (var target in _missionManager.photoTargets)
            {
                var entry = CreateText(_checklistContainer, (target.IsCompleted ? "✓ " : "○ ") + target.DisplayName,
                    16, target.IsCompleted ? new Color(0.4f, 1f, 0.4f) : Color.white);
                _checklistTexts[target.Id] = entry;
            }
        }

        private void OnTakePhotoClicked()
        {
            if (_missionManager == null || _boatController == null) return;
            _missionManager.TryTakePhoto((Vector2)_boatController.transform.position);
        }

        private void CreateSupplyBars()
        {
            var container = MakeObj("SupplyBars", _panelObject.transform);
            var cr = container.GetComponent<RectTransform>();
            SetAnchors(cr, new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, 1));
            cr.anchoredPosition = new Vector2(20, -20);
            cr.sizeDelta = new Vector2(280, 130);

            var bg = container.AddComponent<Image>();
            bg.color = new Color32(10, 15, 25, 180);

            CreateSingleBar(container.transform, "Fuel", new Color(1f, 0.6f, 0f), 0f, out _fuelBarFill, out _fuelPctText);
            CreateSingleBar(container.transform, "Food", new Color(0.3f, 0.8f, 0.2f), -40f, out _foodBarFill, out _foodPctText);
            CreateSingleBar(container.transform, "Battery", new Color(0.3f, 0.5f, 1f), -80f, out _batteryBarFill, out _batteryPctText);
        }

        private void CreateSingleBar(Transform parent, string label, Color color, float yOffset, out Image fill, out Text pctText)
        {
            var lbl = CreateText(parent, label, 13, Color.white);
            var lblRt = lbl.GetComponent<RectTransform>();
            SetAnchors(lblRt, new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, 1));
            lblRt.anchoredPosition = new Vector2(10, yOffset + 6);
            lblRt.sizeDelta = new Vector2(70, 22);
            lbl.alignment = TextAnchor.MiddleLeft;

            var barBg = MakeObj("BarBg", parent);
            var bgRt = barBg.GetComponent<RectTransform>();
            SetAnchors(bgRt, new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, 1));
            bgRt.anchoredPosition = new Vector2(85, yOffset + 6);
            bgRt.sizeDelta = new Vector2(140, 16);
            var bgImg = barBg.AddComponent<Image>();
            bgImg.color = new Color32(30, 30, 30, 220);

            var fillObj = MakeObj("Fill", barBg.transform);
            var fillRt = fillObj.GetComponent<RectTransform>();
            fillRt.anchorMin = Vector2.zero;
            fillRt.anchorMax = Vector2.one;
            fillRt.offsetMin = Vector2.zero;
            fillRt.offsetMax = Vector2.zero;
            fill = fillObj.AddComponent<Image>();
            fill.color = color;
            fill.type = Image.Type.Filled;
            fill.fillMethod = Image.FillMethod.Horizontal;

            pctText = CreateText(parent, "100%", 12, Color.white);
            var pctRt = pctText.GetComponent<RectTransform>();
            SetAnchors(pctRt, new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, 1));
            pctRt.anchoredPosition = new Vector2(230, yOffset + 6);
            pctRt.sizeDelta = new Vector2(50, 22);
            pctText.alignment = TextAnchor.MiddleLeft;
        }

        private void CreateWeatherPanel()
        {
            var container = MakeObj("WeatherPanel", _panelObject.transform);
            var cr = container.GetComponent<RectTransform>();
            SetAnchors(cr, new Vector2(1, 1), new Vector2(1, 1), new Vector2(1, 1));
            cr.anchoredPosition = new Vector2(-20, -85);
            cr.sizeDelta = new Vector2(260, 150);

            var bg = container.AddComponent<Image>();
            bg.color = new Color32(10, 15, 25, 180);

            _weatherText = CreateText(container.transform, "Clear", 18, new Color32(180, 210, 240, 255));
            var wtRt = _weatherText.GetComponent<RectTransform>();
            SetAnchors(wtRt, new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, 1));
            wtRt.anchoredPosition = new Vector2(15, -15);
            wtRt.sizeDelta = new Vector2(140, 28);
            _weatherText.alignment = TextAnchor.MiddleLeft;

            _windText = CreateText(container.transform, "Wind: N 0.0", 14, new Color32(170, 195, 220, 255));
            var wdRt = _windText.GetComponent<RectTransform>();
            SetAnchors(wdRt, new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, 1));
            wdRt.anchoredPosition = new Vector2(15, -45);
            wdRt.sizeDelta = new Vector2(180, 22);
            _windText.alignment = TextAnchor.MiddleLeft;

            var arrowObj = MakeObj("WindArrow", container.transform);
            var arrowRt = arrowObj.GetComponent<RectTransform>();
            SetAnchors(arrowRt, new Vector2(1, 1), new Vector2(1, 1), new Vector2(0.5f, 0f));
            arrowRt.anchoredPosition = new Vector2(-50, -40);
            arrowRt.sizeDelta = new Vector2(6, 35);
            var arrowImg = arrowObj.AddComponent<Image>();
            arrowImg.color = new Color32(140, 190, 230, 255);
            _windArrowRect = arrowRt;
        }

        private void CreateWarningPanel()
        {
            _warningPanel = MakeObj("WarningPanel", _panelObject.transform);
            var wr = _warningPanel.GetComponent<RectTransform>();
            SetAnchors(wr, new Vector2(1, 1), new Vector2(1, 1), new Vector2(0.5f, 1));
            wr.anchoredPosition = new Vector2(-20, -250);
            wr.sizeDelta = new Vector2(260, 80);

            var bg = _warningPanel.AddComponent<Image>();
            bg.color = new Color32(40, 35, 10, 210);

            var outline = _warningPanel.AddComponent<Outline>();
            outline.effectColor = new Color32(255, 200, 0, 255);
            outline.effectDistance = new Vector2(2, -2);

            _warningCanvasGroup = _warningPanel.AddComponent<CanvasGroup>();

            _warningText = CreateText(_warningPanel.transform, "", 14, new Color32(255, 220, 80, 255));
            var wtRt = _warningText.GetComponent<RectTransform>();
            SetAnchors(wtRt, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, 1));
            wtRt.anchoredPosition = new Vector2(10, -10);
            wtRt.sizeDelta = new Vector2(-20, 30);
            _warningText.alignment = TextAnchor.MiddleLeft;

            _warningCountdownText = CreateText(_warningPanel.transform, "", 22, new Color32(255, 180, 0, 255));
            var ctRt = _warningCountdownText.GetComponent<RectTransform>();
            SetAnchors(ctRt, new Vector2(0, 0), new Vector2(1, 1), new Vector2(0.5f, 0.5f));
            ctRt.offsetMin = new Vector2(10, 5);
            ctRt.offsetMax = new Vector2(-10, -30);
            _warningCountdownText.alignment = TextAnchor.MiddleLeft;

            _warningPanel.SetActive(false);
        }

        private void CreateTimerDisplay()
        {
            var container = MakeObj("Timer", _panelObject.transform);
            var cr = container.GetComponent<RectTransform>();
            SetAnchors(cr, new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0.5f, 1));
            cr.anchoredPosition = new Vector2(0, -20);
            cr.sizeDelta = new Vector2(200, 50);

            var bg = container.AddComponent<Image>();
            bg.color = new Color32(10, 15, 25, 160);

            _timerText = CreateText(container.transform, "00:00", 32, Color.white);
            var trRt = _timerText.GetComponent<RectTransform>();
            trRt.anchorMin = Vector2.zero;
            trRt.anchorMax = Vector2.one;
            trRt.offsetMin = Vector2.zero;
            trRt.offsetMax = Vector2.zero;
            _timerText.alignment = TextAnchor.MiddleCenter;
        }

        private void CreateCompass()
        {
            var container = MakeObj("Compass", _panelObject.transform);
            var cr = container.GetComponent<RectTransform>();
            SetAnchors(cr, new Vector2(0, 0), new Vector2(0, 0), new Vector2(0, 0));
            cr.anchoredPosition = new Vector2(25, 25);
            cr.sizeDelta = new Vector2(120, 120);

            var bgObj = MakeObj("Bg", container.transform);
            var bgRt = bgObj.GetComponent<RectTransform>();
            bgRt.anchorMin = Vector2.zero;
            bgRt.anchorMax = Vector2.one;
            bgRt.offsetMin = Vector2.zero;
            bgRt.offsetMax = Vector2.zero;
            var bgImg = bgObj.AddComponent<Image>();
            bgImg.sprite = _circleSprite;
            bgImg.color = new Color32(15, 20, 35, 200);

            var labels = new[] { ("N", new Vector2(60, 105)), ("S", new Vector2(60, 10)),
                                 ("E", new Vector2(107, 57)), ("W", new Vector2(10, 57)) };
            foreach (var (lbl, pos) in labels)
            {
                var t = CreateText(container.transform, lbl, 11, new Color32(160, 180, 210, 255));
                var rt = t.GetComponent<RectTransform>();
                SetAnchors(rt, new Vector2(0, 0), new Vector2(0, 0), new Vector2(0.5f, 0.5f));
                rt.anchoredPosition = pos;
                rt.sizeDelta = new Vector2(20, 18);
                t.alignment = TextAnchor.MiddleCenter;
            }

            var needle = MakeObj("Needle", container.transform);
            var nRt = needle.GetComponent<RectTransform>();
            SetAnchors(nRt, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0f));
            nRt.anchoredPosition = new Vector2(0, 5);
            nRt.sizeDelta = new Vector2(4, 45);
            var nImg = needle.AddComponent<Image>();
            nImg.color = new Color32(220, 80, 60, 255);
            _compassNeedle = nRt;
        }

        private void CreateMissionChecklist()
        {
            var container = MakeObj("Checklist", _panelObject.transform);
            var cr = container.GetComponent<RectTransform>();
            SetAnchors(cr, new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(1, 0.5f));
            cr.anchoredPosition = new Vector2(-20, 20);
            cr.sizeDelta = new Vector2(240, 380);

            var bg = container.AddComponent<Image>();
            bg.color = new Color32(10, 15, 25, 180);

            var title = CreateText(container.transform, "MISSIONS", 16, new Color32(200, 215, 235, 255));
            var ttRt = title.GetComponent<RectTransform>();
            SetAnchors(ttRt, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0.5f, 1));
            ttRt.anchoredPosition = new Vector2(0, -10);
            ttRt.sizeDelta = new Vector2(-20, 28);
            title.alignment = TextAnchor.MiddleCenter;

            var scrollObj = MakeObj("Content", container.transform);
            var sr = scrollObj.GetComponent<RectTransform>();
            sr.anchorMin = new Vector2(0, 0);
            sr.anchorMax = new Vector2(1, 1);
            sr.offsetMin = new Vector2(10, 10);
            sr.offsetMax = new Vector2(-10, -40);
            _checklistContainer = scrollObj.transform;

            var vLayout = scrollObj.AddComponent<VerticalLayoutGroup>();
            vLayout.childAlignment = TextAnchor.UpperLeft;
            vLayout.spacing = 6f;
            vLayout.childControlWidth = true;
            vLayout.childControlHeight = false;
            vLayout.childForceExpandWidth = true;
            vLayout.childForceExpandHeight = false;
        }

        private void CreatePhotoButton()
        {
            var btnObj = MakeObj("PhotoBtn", _panelObject.transform);
            var br = btnObj.GetComponent<RectTransform>();
            SetAnchors(br, new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0.5f, 0));
            br.anchoredPosition = new Vector2(0, 30);
            br.sizeDelta = new Vector2(220, 60);

            var img = btnObj.AddComponent<Image>();
            img.color = new Color32(50, 120, 80, 230);

            var outline = btnObj.AddComponent<Outline>();
            outline.effectColor = new Color32(80, 180, 120, 180);
            outline.effectDistance = new Vector2(2, -2);

            var btn = btnObj.AddComponent<Button>();
            btn.targetGraphic = img;
            btn.colors = new ColorBlock
            {
                normalColor = new Color32(50, 120, 80, 230),
                highlightedColor = new Color32(70, 150, 100, 230),
                pressedColor = new Color32(35, 90, 60, 230),
                selectedColor = new Color32(70, 150, 100, 230),
                disabledColor = new Color32(80, 80, 80, 128),
                colorMultiplier = 1f,
                fadeDuration = 0.1f
            };
            btn.onClick.AddListener(OnTakePhotoClicked);

            var txt = CreateText(btnObj.transform, "\U0001F4F7 Take Photo", 22, Color.white);
            var tr = txt.GetComponent<RectTransform>();
            tr.anchorMin = Vector2.zero;
            tr.anchorMax = Vector2.one;
            tr.offsetMin = Vector2.zero;
            tr.offsetMax = Vector2.zero;
            txt.alignment = TextAnchor.MiddleCenter;
        }

        private void CreatePauseButton()
        {
            var btnObj = MakeObj("PauseBtn", _panelObject.transform);
            var br = btnObj.GetComponent<RectTransform>();
            SetAnchors(br, new Vector2(1, 1), new Vector2(1, 1), new Vector2(1, 1));
            br.anchoredPosition = new Vector2(-20, -15);
            br.sizeDelta = new Vector2(55, 55);

            var img = btnObj.AddComponent<Image>();
            img.color = new Color32(60, 65, 80, 200);

            var btn = btnObj.AddComponent<Button>();
            btn.targetGraphic = img;
            btn.colors = new ColorBlock
            {
                normalColor = new Color32(60, 65, 80, 200),
                highlightedColor = new Color32(90, 95, 115, 200),
                pressedColor = new Color32(40, 45, 55, 200),
                selectedColor = new Color32(90, 95, 115, 200),
                disabledColor = new Color32(80, 80, 80, 128),
                colorMultiplier = 1f,
                fadeDuration = 0.1f
            };
            btn.onClick.AddListener(() => GameManager.Instance.PauseGame());

            var txt = CreateText(btnObj.transform, "\u23F8", 28, Color.white);
            var tr = txt.GetComponent<RectTransform>();
            tr.anchorMin = Vector2.zero;
            tr.anchorMax = Vector2.one;
            tr.offsetMin = Vector2.zero;
            tr.offsetMax = Vector2.zero;
            txt.alignment = TextAnchor.MiddleCenter;
        }

        private GameObject MakeObj(string name, Transform parent)
        {
            var obj = new GameObject(name);
            obj.transform.SetParent(parent, false);
            return obj;
        }

        private Text CreateText(Transform parent, string text, int fontSize, Color color)
        {
            var obj = MakeObj("Txt", parent);
            var t = obj.AddComponent<Text>();
            t.font = _font;
            t.text = text;
            t.fontSize = fontSize;
            t.color = color;
            return t;
        }

        private void SetAnchors(RectTransform rt, Vector2 anchorMin, Vector2 anchorMax, Vector2 pivot)
        {
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.pivot = pivot;
        }

        private Sprite CreateCircleSprite(int res)
        {
            var tex = new Texture2D(res, res);
            float c = res / 2f;
            float r = res / 2f - 1;
            for (int y = 0; y < res; y++)
            {
                for (int x = 0; x < res; x++)
                {
                    float d = Vector2.Distance(new Vector2(x, y), new Vector2(c, c));
                    tex.SetPixel(x, y, d <= r ? Color.white : Color.clear);
                }
            }
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, res, res), new Vector2(0.5f, 0.5f));
        }

        private string FormatWeatherType(WeatherType w)
        {
            return w switch
            {
                WeatherType.Clear => "☀ Clear",
                WeatherType.Cloudy => "☁ Cloudy",
                WeatherType.Foggy => "🌫 Foggy",
                WeatherType.Rainy => "🌧 Rainy",
                WeatherType.Stormy => "⛈ Stormy",
                _ => w.ToString()
            };
        }

        private string WindDirToLabel(WindDirection d)
        {
            return d switch
            {
                WindDirection.North => "N", WindDirection.NorthEast => "NE",
                WindDirection.East => "E", WindDirection.SouthEast => "SE",
                WindDirection.South => "S", WindDirection.SouthWest => "SW",
                WindDirection.West => "W", WindDirection.NorthWest => "NW",
                _ => "---"
            };
        }

        private float WindDirToAngle(WindDirection d)
        {
            return d switch
            {
                WindDirection.North => 0f, WindDirection.NorthEast => 45f,
                WindDirection.East => 90f, WindDirection.SouthEast => 135f,
                WindDirection.South => 180f, WindDirection.SouthWest => 225f,
                WindDirection.West => 270f, WindDirection.NorthWest => 315f,
                _ => 0f
            };
        }
    }
}
