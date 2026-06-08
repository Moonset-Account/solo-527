using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;

namespace LakeNavigation
{
    public class DebugPanel : MonoBehaviour
    {
        private GameObject _panelObject;
        private Font _font;
        private bool _visible;
        private bool _godMode;

        private float _fpsAccumulator;
        private int _fpsFrameCount;
        private float _fpsNextUpdate;
        private int _currentFps;

        private Text _fpsText;
        private Text _stateText;
        private Text _positionText;
        private Text _healthText;
        private Text _weatherText;
        private Text _windText;
        private Text _suppliesText;
        private Text _timerText;
        private Text _godModeText;

        private BoatController _boatController;
        private SupplyManager _supplyManager;
        private MissionManager _missionManager;

        private void Update()
        {
            if (PlayerPrefs.GetInt("DebugMode", 0) != 1)
            {
                if (_panelObject != null && _panelObject.activeSelf)
                    _panelObject.SetActive(false);
                return;
            }

            if (Input.GetKeyDown(KeyCode.F1))
            {
                _visible = !_visible;
                EnsurePanelCreated();
                _panelObject.SetActive(_visible);
            }

            if (!_visible) return;

            UpdateFps();
            RefreshDisplay();
        }

        private void EnsurePanelCreated()
        {
            if (_panelObject != null) return;

            _font = UIHelper.DefaultFont;
            _boatController = FindObjectOfType<BoatController>();
            _supplyManager = FindObjectOfType<SupplyManager>();
            _missionManager = FindObjectOfType<MissionManager>();

            _panelObject = MakeObj("DebugPanel", transform);
            var canvas = FindObjectOfType<Canvas>();
            if (canvas != null)
                _panelObject.transform.SetParent(canvas.transform, false);
            var panelRect = _panelObject.GetComponent<RectTransform>();
            panelRect.anchorMin = new Vector2(0, 1);
            panelRect.anchorMax = new Vector2(0, 1);
            panelRect.pivot = new Vector2(0, 1);
            panelRect.anchoredPosition = new Vector2(10, -10);
            panelRect.sizeDelta = new Vector2(340, 420);

            var bg = _panelObject.AddComponent<Image>();
            bg.color = new Color32(10, 10, 10, 200);

            var contentObj = MakeObj("Content", _panelObject.transform);
            var contentRect = contentObj.GetComponent<RectTransform>();
            contentRect.anchorMin = Vector2.zero;
            contentRect.anchorMax = Vector2.one;
            contentRect.offsetMin = new Vector2(10, 50);
            contentRect.offsetMax = new Vector2(-10, -10);

            var vLayout = contentObj.AddComponent<VerticalLayoutGroup>();
            vLayout.childAlignment = TextAnchor.UpperLeft;
            vLayout.spacing = 4f;
            vLayout.childControlWidth = true;
            vLayout.childControlHeight = false;
            vLayout.childForceExpandWidth = true;
            vLayout.childForceExpandHeight = false;

            var title = CreateLabel(contentObj.transform, "DEBUG PANEL", 14, new Color32(255, 200, 80, 255));
            var titleLe = title.gameObject.AddComponent<LayoutElement>();
            titleLe.preferredHeight = 22;
            titleLe.minHeight = 22;

            _fpsText = CreateLabel(contentObj.transform, "FPS: --", 13, Color.white);
            AddLayoutHeight(_fpsText, 18);
            _stateText = CreateLabel(contentObj.transform, "State: --", 13, Color.white);
            AddLayoutHeight(_stateText, 18);
            _positionText = CreateLabel(contentObj.transform, "Boat Pos: --", 13, Color.white);
            AddLayoutHeight(_positionText, 18);
            _healthText = CreateLabel(contentObj.transform, "Boat HP: --", 13, Color.white);
            AddLayoutHeight(_healthText, 18);
            _weatherText = CreateLabel(contentObj.transform, "Weather: --", 13, Color.white);
            AddLayoutHeight(_weatherText, 18);
            _windText = CreateLabel(contentObj.transform, "Wind: --", 13, Color.white);
            AddLayoutHeight(_windText, 18);
            _suppliesText = CreateLabel(contentObj.transform, "Supplies: --", 13, Color.white);
            AddLayoutHeight(_suppliesText, 18);
            _timerText = CreateLabel(contentObj.transform, "Time: --", 13, Color.white);
            AddLayoutHeight(_timerText, 18);
            _godModeText = CreateLabel(contentObj.transform, "God Mode: OFF", 13, new Color32(255, 100, 100, 255));
            AddLayoutHeight(_godModeText, 18);

            var separator = MakeObj("Sep", contentObj.transform);
            var sepLe = separator.AddComponent<LayoutElement>();
            sepLe.preferredHeight = 6;
            sepLe.minHeight = 6;

            CreateActionButtons();

            _panelObject.SetActive(false);
        }

        private void UpdateFps()
        {
            _fpsAccumulator += Time.unscaledDeltaTime;
            _fpsFrameCount++;

            if (_fpsAccumulator >= 0.5f)
            {
                _currentFps = Mathf.RoundToInt(_fpsFrameCount / _fpsAccumulator);
                _fpsAccumulator = 0f;
                _fpsFrameCount = 0;
            }
        }

        private void RefreshDisplay()
        {
            _fpsText.text = "FPS: " + _currentFps;

            if (GameManager.Instance != null)
                _stateText.text = "State: " + GameManager.Instance.CurrentState;
            else
                _stateText.text = "State: --";

            if (_boatController != null)
            {
                var pos = (Vector2)_boatController.transform.position;
                _positionText.text = "Boat Pos: (" + pos.x.ToString("F1") + ", " + pos.y.ToString("F1") + ")";
                _healthText.text = "Boat HP: " + _boatController.health.ToString("F0");

                if (_godMode)
                {
                    _boatController.health = 999f;
                }
            }
            else
            {
                _positionText.text = "Boat Pos: --";
                _healthText.text = "Boat HP: --";
            }

            if (WeatherSystem.Instance != null)
            {
                _weatherText.text = "Weather: " + WeatherSystem.Instance.CurrentWeather;
                var wind = WeatherSystem.Instance.CurrentWind;
                _windText.text = "Wind: " + wind.Direction + " " + wind.Speed.ToString("F1");
            }
            else
            {
                _weatherText.text = "Weather: --";
                _windText.text = "Wind: --";
            }

            if (_supplyManager != null)
            {
                float fuel = _supplyManager.GetPercentage(SupplyType.Fuel) * 100f;
                float food = _supplyManager.GetPercentage(SupplyType.Food) * 100f;
                float battery = _supplyManager.GetPercentage(SupplyType.Battery) * 100f;
                _suppliesText.text = "Supplies: F:" + fuel.ToString("F0") + "% Fo:" + food.ToString("F0") + "% B:" + battery.ToString("F0") + "%";
            }
            else
            {
                _suppliesText.text = "Supplies: --";
            }

            if (_missionManager != null)
            {
                int secs = Mathf.Max(0, Mathf.RoundToInt(_missionManager.timeRemaining));
                _timerText.text = "Time: " + (secs / 60).ToString("D2") + ":" + (secs % 60).ToString("D2");
            }
            else
            {
                _timerText.text = "Time: --";
            }

            _godModeText.text = "God Mode: " + (_godMode ? "ON" : "OFF");
            _godModeText.color = _godMode ? new Color32(100, 255, 100, 255) : new Color32(255, 100, 100, 255);
        }

        private void CreateActionButtons()
        {
            var btnContainer = MakeObj("Buttons", _panelObject.transform);
            var btnRect = btnContainer.GetComponent<RectTransform>();
            btnRect.anchorMin = new Vector2(0, 0);
            btnRect.anchorMax = new Vector2(1, 0);
            btnRect.pivot = new Vector2(0.5f, 0);
            btnRect.offsetMin = new Vector2(10, 8);
            btnRect.offsetMax = new Vector2(-10, 38);

            var hLayout = btnContainer.AddComponent<HorizontalLayoutGroup>();
            hLayout.childAlignment = TextAnchor.MiddleLeft;
            hLayout.spacing = 6f;
            hLayout.childControlWidth = true;
            hLayout.childControlHeight = false;
            hLayout.childForceExpandWidth = true;
            hLayout.childForceExpandHeight = false;

            CreateBtn(btnContainer.transform, "Refill", OnRefillSupplies);
            CreateBtn(btnContainer.transform, "+60s", OnAddTime);
            CreateBtn(btnContainer.transform, "Clear", OnForceClear);
            CreateBtn(btnContainer.transform, "Storm", OnForceStorm);
            CreateBtn(btnContainer.transform, "God", OnToggleGodMode);
        }

        private void OnRefillSupplies()
        {
            if (_supplyManager == null) return;
            foreach (SupplyType type in System.Enum.GetValues(typeof(SupplyType)))
            {
                float max = _supplyManager.GetMax(type);
                if (max > 0f)
                    _supplyManager.Replenish(type, max);
            }
        }

        private void OnAddTime()
        {
            if (_missionManager != null)
                _missionManager.timeRemaining += 60f;
        }

        private void OnForceClear()
        {
            if (WeatherSystem.Instance == null) return;
            var wind = new WindInfo { Direction = WindDirection.North, Speed = 1f, Variance = 0f };
            WeatherSystem.Instance.ForceWeather(WeatherType.Clear, wind);
        }

        private void OnForceStorm()
        {
            if (WeatherSystem.Instance == null) return;
            var wind = new WindInfo { Direction = WindDirection.NorthWest, Speed = 8f, Variance = 2f };
            WeatherSystem.Instance.ForceWeather(WeatherType.Stormy, wind);
        }

        private void OnToggleGodMode()
        {
            _godMode = !_godMode;
            if (_godMode && _boatController != null)
                _boatController.health = 999f;
        }

        private GameObject MakeObj(string name, Transform parent)
        {
            var obj = new GameObject(name);
            obj.transform.SetParent(parent, false);
            obj.AddComponent<RectTransform>();
            return obj;
        }

        private Text CreateLabel(Transform parent, string text, int fontSize, Color color)
        {
            var obj = MakeObj("Lbl", parent);
            var t = obj.AddComponent<Text>();
            t.font = _font;
            t.text = text;
            t.fontSize = fontSize;
            t.color = color;
            return t;
        }

        private void AddLayoutHeight(Text text, int height)
        {
            var le = text.gameObject.AddComponent<LayoutElement>();
            le.preferredHeight = height;
            le.minHeight = height;
        }

        private void CreateBtn(Transform parent, string label, UnityEngine.Events.UnityAction onClick)
        {
            var btnObj = MakeObj("Btn_" + label, parent);
            var le = btnObj.AddComponent<LayoutElement>();
            le.minWidth = 50;
            le.preferredWidth = 60;
            le.minHeight = 28;
            le.preferredHeight = 28;

            var img = btnObj.AddComponent<Image>();
            img.color = new Color32(60, 60, 80, 220);

            var btn = btnObj.AddComponent<Button>();
            btn.targetGraphic = img;
            btn.colors = new ColorBlock
            {
                normalColor = new Color32(60, 60, 80, 220),
                highlightedColor = new Color32(90, 90, 120, 220),
                pressedColor = new Color32(40, 40, 55, 220),
                selectedColor = new Color32(90, 90, 120, 220),
                disabledColor = new Color32(80, 80, 80, 128),
                colorMultiplier = 1f,
                fadeDuration = 0.1f
            };
            btn.onClick.AddListener(onClick);

            var txt = CreateLabel(btnObj.transform, label, 11, Color.white);
            var tr = txt.GetComponent<RectTransform>();
            tr.anchorMin = Vector2.zero;
            tr.anchorMax = Vector2.one;
            tr.offsetMin = Vector2.zero;
            tr.offsetMax = Vector2.zero;
            txt.alignment = TextAnchor.MiddleCenter;
        }
    }
}
