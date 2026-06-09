using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Audio;
using LakeSailing.Gameplay;
using LakeSailing.Data;

namespace LakeSailing.UI
{
    public class HUDPanel : UIPanelBase
    {
        private Text scoreText, timeText, taskText;
        private Text weatherNameText, windDirText, visText;
        private Text fuelText, foodText, battText, healthText;
        private Image windArrowImg, fuelWarnImg, weatherWarnBanner;
        private Text weatherWarnText, weatherWarnTimer;
        private Slider fuelSlider, foodSlider, battSlider, healthSlider, windSlider;
        private Button pauseBtn, shootBtn, routeBtn, anchorBtn, sailBtn;
        private Text shootReadyText;
        private Transform taskContainer, forecastContainer;
        private GameObject taskItemPrefab, forecastItemPrefab;
        private readonly List<GameObject> taskItems = new List<GameObject>();
        private BoatController cachedBoat;
        private bool uiBuilt;

        private void Awake()
        {
            panelType = UIType.HUD;
            UIManager.Instance?.RegisterPanel(panelType, this);
        }

        private void Start() { BuildUI(); Subscribe(); }
        private void OnDestroy() { Unsubscribe(); }

        private void Subscribe()
        {
            EventBus.Subscribe<GameStateChangedEvent>(OnGameStateChanged);
            EventBus.Subscribe<WeatherChangedEvent>(OnWeatherChanged);
            EventBus.Subscribe<WindChangedEvent>(OnWindChanged);
            EventBus.Subscribe<VisibilityChangedEvent>(OnVisibilityChanged);
            EventBus.Subscribe<WeatherWarningEvent>(OnWeatherWarning);
            EventBus.Subscribe<BoatLowFuelEvent>(OnBoatLowFuel);
        }
        private void Unsubscribe()
        {
            EventBus.Unsubscribe<GameStateChangedEvent>(OnGameStateChanged);
            EventBus.Unsubscribe<WeatherChangedEvent>(OnWeatherChanged);
            EventBus.Unsubscribe<WindChangedEvent>(OnWindChanged);
            EventBus.Unsubscribe<VisibilityChangedEvent>(OnVisibilityChanged);
            EventBus.Unsubscribe<WeatherWarningEvent>(OnWeatherWarning);
            EventBus.Unsubscribe<BoatLowFuelEvent>(OnBoatLowFuel);
            if (cachedBoat != null)
            {
                cachedBoat.OnFuelChanged -= UpdateFuel;
                cachedBoat.OnFoodChanged -= UpdateFood;
                cachedBoat.OnBatteryChanged -= UpdateBatt;
                cachedBoat.OnHealthChanged -= UpdateHealth;
            }
        }

        private void BuildUI()
        {
            if (uiBuilt || panelContent == null) return;
            uiBuilt = true;
            RuntimeUIBuilder.EnsureEventSystem();
            var root = panelContent.transform;

            var topBar = new GameObject("TopBar").AddComponent<RectTransform>();
            topBar.SetParent(root, false);
            RuntimeUIBuilder.StretchFull(topBar);
            topBar.anchorMin = new Vector2(0, 1); topBar.anchorMax = new Vector2(1, 1);
            topBar.pivot = new Vector2(0.5f, 1); topBar.sizeDelta = new Vector2(0, 120);
            topBar.offsetMin = new Vector2(0, -120); topBar.offsetMax = new Vector2(0, 0);

            var topLeft = RuntimeUIBuilder.CreateVerticalGroup(topBar, "TopLeft", 4, 10, 10, 20, 20, TextAnchor.UpperLeft);
            scoreText = RuntimeUIBuilder.CreateLabel(topLeft.transform, "分数: 0", 26, TextAnchor.MiddleLeft, 400, 36);
            scoreText.color = new Color(1f, 0.95f, 0.4f);
            timeText = RuntimeUIBuilder.CreateLabel(topLeft.transform, "时间: 10:00", 26, TextAnchor.MiddleLeft, 400, 36);
            taskText = RuntimeUIBuilder.CreateLabel(topLeft.transform, "任务: 0/0", 24, TextAnchor.MiddleLeft, 400, 32);

            var topRight = new GameObject("TopRight").AddComponent<RectTransform>();
            topRight.SetParent(topBar, false);
            topRight.anchorMin = new Vector2(1, 1); topRight.anchorMax = new Vector2(1, 1);
            topRight.pivot = new Vector2(1, 1); topRight.anchoredPosition = new Vector2(-20, -15);
            topRight.sizeDelta = new Vector2(100, 60);
            pauseBtn = RuntimeUIBuilder.CreateButton(topRight, "暂停", new Vector2(90, 50), OnPause, 22, new Color(0.85f, 0.25f, 0.25f));

            weatherWarnBanner = new GameObject("WeatherBanner").AddComponent<Image>();
            weatherWarnBanner.transform.SetParent(root, false);
            var wr = weatherWarnBanner.rectTransform;
            RuntimeUIBuilder.SetAnchoredPosition(wr, 0, 420);
            wr.sizeDelta = new Vector2(700, 60);
            weatherWarnBanner.color = new Color(0.9f, 0.2f, 0.2f, 0.85f);
            weatherWarnBanner.enabled = false;
            weatherWarnText = RuntimeUIBuilder.CreateLabel(weatherWarnBanner.transform, "", 24, TextAnchor.MiddleCenter, 600, 30);
            weatherWarnText.rectTransform.anchoredPosition = new Vector2(-80, 0);
            weatherWarnTimer = RuntimeUIBuilder.CreateLabel(weatherWarnBanner.transform, "", 28, TextAnchor.MiddleRight, 140, 34);
            weatherWarnTimer.color = Color.yellow;
            weatherWarnTimer.rectTransform.anchoredPosition = new Vector2(280, 0);
            weatherWarnTimer.fontStyle = FontStyle.Bold;

            var weatherPanel = new GameObject("WeatherPanel").AddComponent<Image>();
            weatherPanel.transform.SetParent(root, false);
            var wpr = weatherPanel.rectTransform;
            wpr.anchorMin = new Vector2(0, 1); wpr.anchorMax = new Vector2(0, 1);
            wpr.pivot = new Vector2(0, 1); wpr.anchoredPosition = new Vector2(20, -140);
            wpr.sizeDelta = new Vector2(320, 180);
            weatherPanel.color = new Color(0, 0, 0, 0.6f);

            RuntimeUIBuilder.CreateLabel(weatherPanel.transform, "🌤  天气信息", 22, TextAnchor.UpperLeft, 280, 30).rectTransform.anchoredPosition = new Vector2(0, 65);
            weatherNameText = RuntimeUIBuilder.CreateLabel(weatherPanel.transform, "晴朗", 20, TextAnchor.MiddleLeft, 280, 28);
            weatherNameText.rectTransform.anchoredPosition = new Vector2(0, 30); weatherNameText.color = Color.cyan;
            windDirText = RuntimeUIBuilder.CreateLabel(weatherPanel.transform, "风向: 东风", 18, TextAnchor.MiddleLeft, 280, 24);
            windDirText.rectTransform.anchoredPosition = new Vector2(0, 0);
            visText = RuntimeUIBuilder.CreateLabel(weatherPanel.transform, "能见度: 极佳", 18, TextAnchor.MiddleLeft, 280, 24);
            visText.rectTransform.anchoredPosition = new Vector2(0, -30);

            var windIcon = new GameObject("WindArrow").AddComponent<Image>();
            windIcon.transform.SetParent(weatherPanel.transform, false);
            windArrowImg = windIcon;
            RuntimeUIBuilder.SetAnchoredPosition(windIcon.rectTransform, 110, 15);
            windIcon.rectTransform.sizeDelta = new Vector2(36, 36);
            windIcon.color = new Color(0.5f, 0.8f, 1f);
            windIcon.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));

            var windSliderGo = new GameObject("WindSlider").AddComponent<RectTransform>();
            windSliderGo.SetParent(weatherPanel.transform, false);
            RuntimeUIBuilder.SetAnchoredPosition(windSliderGo, -60, -60);
            windSlider = RuntimeUIBuilder.CreateSlider(weatherPanel.transform, "风力", 160, 0, 1, 0.3f);
            windSlider.GetComponent<RectTransform>().anchoredPosition = new Vector2(-60, -60);

            var supplyPanel = new GameObject("SupplyPanel").AddComponent<Image>();
            supplyPanel.transform.SetParent(root, false);
            var spr = supplyPanel.rectTransform;
            spr.anchorMin = new Vector2(0, 0); spr.anchorMax = new Vector2(0, 0);
            spr.pivot = new Vector2(0, 0); spr.anchoredPosition = new Vector2(20, 20);
            spr.sizeDelta = new Vector2(340, 200);
            supplyPanel.color = new Color(0, 0, 0, 0.6f);

            RuntimeUIBuilder.CreateLabel(supplyPanel.transform, "⚓ 补给状态", 22, TextAnchor.UpperLeft, 300, 30).rectTransform.anchoredPosition = new Vector2(0, 75);
            fuelText = RuntimeUIBuilder.CreateLabel(supplyPanel.transform, "燃料: 100/100", 18, TextAnchor.MiddleLeft, 300, 24);
            fuelText.rectTransform.anchoredPosition = new Vector2(0, 40);
            fuelSlider = RuntimeUIBuilder.CreateSlider(supplyPanel.transform, "Fuel", 280, 0, 1, 1);
            fuelSlider.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, 15);
            fuelWarnImg = new GameObject("FuelWarn").AddComponent<Image>();
            fuelWarnImg.transform.SetParent(supplyPanel.transform, false);
            RuntimeUIBuilder.SetAnchoredPosition(fuelWarnImg.rectTransform, 120, 27);
            fuelWarnImg.rectTransform.sizeDelta = new Vector2(160, 20);
            fuelWarnImg.color = new Color(1, 0, 0, 0.35f); fuelWarnImg.enabled = false;

            foodText = RuntimeUIBuilder.CreateLabel(supplyPanel.transform, "食物: 50/50", 18, TextAnchor.MiddleLeft, 300, 24);
            foodText.rectTransform.anchoredPosition = new Vector2(0, -15);
            foodSlider = RuntimeUIBuilder.CreateSlider(supplyPanel.transform, "Food", 280, 0, 1, 1);
            foodSlider.fillRect.GetComponent<Image>().color = new Color(0.9f, 0.6f, 0.2f);
            foodSlider.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, -40);

            battText = RuntimeUIBuilder.CreateLabel(supplyPanel.transform, "电量: 100/100", 18, TextAnchor.MiddleLeft, 300, 24);
            battText.rectTransform.anchoredPosition = new Vector2(0, -70);
            battSlider = RuntimeUIBuilder.CreateSlider(supplyPanel.transform, "Batt", 280, 0, 1, 1);
            battSlider.fillRect.GetComponent<Image>().color = new Color(0.4f, 0.9f, 0.95f);
            battSlider.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, -95);

            healthText = RuntimeUIBuilder.CreateLabel(supplyPanel.transform, "船体: 100/100", 18, TextAnchor.MiddleLeft, 300, 24);
            healthText.rectTransform.anchoredPosition = new Vector2(0, -125);
            healthSlider = RuntimeUIBuilder.CreateSlider(supplyPanel.transform, "Health", 280, 0, 1, 1);
            healthSlider.fillRect.GetComponent<Image>().color = new Color(0.4f, 0.95f, 0.4f);
            healthSlider.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, -150);

            var actionPanel = new GameObject("ActionPanel").AddComponent<Image>();
            actionPanel.transform.SetParent(root, false);
            var apr = actionPanel.rectTransform;
            apr.anchorMin = new Vector2(1, 0); apr.anchorMax = new Vector2(1, 0);
            apr.pivot = new Vector2(1, 0); apr.anchoredPosition = new Vector2(-20, 20);
            apr.sizeDelta = new Vector2(260, 260);
            actionPanel.color = new Color(0, 0, 0, 0.6f);

            RuntimeUIBuilder.CreateLabel(actionPanel.transform, "🎯 操作面板", 22, TextAnchor.UpperCenter, 220, 30).rectTransform.anchoredPosition = new Vector2(0, 100);
            shootBtn = RuntimeUIBuilder.CreateButton(actionPanel, "📸 拍摄 (空格)", new Vector2(220, 50), OnShootPhoto, 20, new Color(0.15f, 0.7f, 0.4f));
            shootBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, 60);
            shootReadyText = RuntimeUIBuilder.CreateLabel(actionPanel.transform, "准备拍摄", 16, TextAnchor.MiddleCenter, 200, 20);
            shootReadyText.rectTransform.anchoredPosition = new Vector2(0, 25); shootReadyText.color = Color.green;

            routeBtn = RuntimeUIBuilder.CreateButton(actionPanel, "🗺 路线规划 (R)", new Vector2(220, 44), OnRoutePlan, 18, new Color(0.2f, 0.5f, 0.9f));
            routeBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, -15);
            anchorBtn = RuntimeUIBuilder.CreateButton(actionPanel, "⚓ 抛锚 (Q)", new Vector2(105, 40), OnAnchor, 16, new Color(0.7f, 0.5f, 0.15f));
            anchorBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(-57, -65);
            sailBtn = RuntimeUIBuilder.CreateButton(actionPanel, "⛵ 起锚 (Ctrl+W)", new Vector2(105, 40), OnSail, 16, new Color(0.15f, 0.6f, 0.7f));
            sailBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(57, -65);

            var taskPanel = new GameObject("TaskPanel").AddComponent<Image>();
            taskPanel.transform.SetParent(root, false);
            var tpr = taskPanel.rectTransform;
            tpr.anchorMin = new Vector2(1, 1); tpr.anchorMax = new Vector2(1, 1);
            tpr.pivot = new Vector2(1, 1); tpr.anchoredPosition = new Vector2(-20, -140);
            tpr.sizeDelta = new Vector2(360, 380);
            taskPanel.color = new Color(0, 0, 0, 0.6f);
            RuntimeUIBuilder.CreateLabel(taskPanel.transform, "📋 拍摄任务", 22, TextAnchor.UpperCenter, 320, 30).rectTransform.anchoredPosition = new Vector2(0, 165);
            taskContainer = new GameObject("TaskList").AddComponent<RectTransform>();
            taskContainer.SetParent(taskPanel.transform, false);
            RuntimeUIBuilder.StretchFull(taskContainer.GetComponent<RectTransform>(), 15f);
            taskContainer.GetComponent<RectTransform>().offsetMin = new Vector2(15, 25);
            taskContainer.GetComponent<RectTransform>().offsetMax = new Vector2(-15, -40);

            var forecastPanel = new GameObject("ForecastPanel").AddComponent<Image>();
            forecastPanel.transform.SetParent(root, false);
            var fpr = forecastPanel.rectTransform;
            fpr.anchorMin = new Vector2(0.5f, 0); fpr.anchorMax = new Vector2(0.5f, 0);
            fpr.pivot = new Vector2(0.5f, 0); fpr.anchoredPosition = new Vector2(0, 240);
            fpr.sizeDelta = new Vector2(900, 80);
            forecastPanel.color = new Color(0, 0, 0, 0.55f);
            RuntimeUIBuilder.CreateLabel(forecastPanel.transform, "天气预报（提前预警）", 18, TextAnchor.MiddleLeft, 250, 24).rectTransform.anchoredPosition = new Vector2(-300, 0);
            forecastContainer = new GameObject("ForecastList").AddComponent<RectTransform>();
            forecastContainer.SetParent(forecastPanel.transform, false);
            RuntimeUIBuilder.SetAnchoredPosition(forecastContainer.GetComponent<RectTransform>(), 80, 0);
            forecastContainer.GetComponent<RectTransform>().sizeDelta = new Vector2(720, 60);

            gameObject.SetActive(false);
        }

        public void SetBoatReference(BoatController boat)
        {
            if (cachedBoat != null)
            {
                cachedBoat.OnFuelChanged -= UpdateFuel;
                cachedBoat.OnFoodChanged -= UpdateFood;
                cachedBoat.OnBatteryChanged -= UpdateBatt;
                cachedBoat.OnHealthChanged -= UpdateHealth;
            }
            cachedBoat = boat;
            if (cachedBoat != null)
            {
                cachedBoat.OnFuelChanged += UpdateFuel;
                cachedBoat.OnFoodChanged += UpdateFood;
                cachedBoat.OnBatteryChanged += UpdateBatt;
                cachedBoat.OnHealthChanged += UpdateHealth;
                UpdateFuel(boat.CurrentFuel, boat.MaxFuel);
                UpdateFood(boat.CurrentFood, boat.MaxFood);
                UpdateBatt(boat.CurrentBattery, boat.MaxBattery);
                UpdateHealth(boat.CurrentHealth, boat.MaxHealth);
            }
        }

        private void Update()
        {
            if (GameManager.Instance?.CurrentState != GameState.Playing) return;
            var ts = TaskSystem.Instance;
            if (scoreText != null && ts != null) { scoreText.text = $"分数: {ts.TotalScore}"; }
            if (timeText != null && ts != null)
            {
                float t = ts.TimeRemaining;
                int m = Mathf.FloorToInt(t / 60f), s = Mathf.FloorToInt(t % 60f);
                timeText.text = $"时间: {m:00}:{s:00}";
                timeText.color = t < 60 ? Color.red : Color.white;
            }
            if (taskText != null && ts != null) { taskText.text = $"任务: {ts.GetCompletedTaskCount()}/{ts.GetTotalTaskCount()}"; }
            if (weatherWarnBanner != null && weatherWarnBanner.enabled)
            {
                float t = WeatherSystem.Instance?.GetTimeUntilNextWeather() ?? 0f;
                if (weatherWarnTimer != null) weatherWarnTimer.text = $"{t:F0}秒";
            }
        }

        public void InitializeTasks()
        {
            if (taskContainer == null || TaskSystem.Instance == null) return;
            taskItems.Clear();
            int i = 0;
            foreach (Transform ch in taskContainer) Destroy(ch.gameObject);
            foreach (var task in TaskSystem.Instance.ActiveTasks)
            {
                var go = new GameObject($"TaskItem_{i}").AddComponent<RectTransform>();
                go.SetParent(taskContainer, false);
                go.sizeDelta = new Vector2(320, 58);
                go.anchoredPosition = new Vector2(0, 170 - i * 62);
                var bg = go.gameObject.AddComponent<Image>();
                bg.color = new Color(0.15f, 0.18f, 0.22f, 0.95f);
                var taskData = TaskSystem.Instance.GetTaskData(task.taskId);
                Color rCol = GetRarity(taskData?.targetRarity ?? 1);
                var mark = new GameObject("Rarity").AddComponent<Image>();
                mark.transform.SetParent(go, false);
                mark.rectTransform.anchorMin = new Vector2(0, 0); mark.rectTransform.anchorMax = new Vector2(0, 1);
                mark.rectTransform.sizeDelta = new Vector2(6, 0); mark.rectTransform.offsetMin = Vector2.zero; mark.rectTransform.offsetMax = new Vector2(6, 0);
                mark.color = rCol;
                var nameLbl = RuntimeUIBuilder.CreateLabel(go.transform, taskData?.targetName ?? "目标", 18,
                    TextAnchor.MiddleLeft, 240, 24);
                nameLbl.rectTransform.anchoredPosition = new Vector2(30, 10);
                var descLbl = RuntimeUIBuilder.CreateLabel(go.transform, taskData?.description ?? "", 13,
                    TextAnchor.MiddleLeft, 240, 18);
                descLbl.rectTransform.anchoredPosition = new Vector2(30, -10);
                descLbl.color = new Color(0.8f, 0.8f, 0.8f);
                var st = RuntimeUIBuilder.CreateLabel(go.transform, StatusStr(task.status, task.attemptsRemaining), 14,
                    TextAnchor.MiddleRight, 80, 20);
                st.rectTransform.anchoredPosition = new Vector2(-10, 10);
                st.color = task.status == TaskStatus.Completed ? Color.green :
                           task.status == TaskStatus.Failed ? Color.red : new Color(1f, 0.9f, 0.3f);
                i++;
            }
        }

        public void InitializeForecast()
        {
            if (forecastContainer == null || WeatherSystem.Instance?.Forecast == null) return;
            foreach (Transform ch in forecastContainer) Destroy(ch.gameObject);
            var fc = WeatherSystem.Instance.Forecast;
            for (int i = 0; i < Mathf.Min(6, fc.Length); i++)
            {
                var slot = new GameObject($"Slot_{i}").AddComponent<Image>();
                slot.transform.SetParent(forecastContainer, false);
                var srt = slot.rectTransform;
                srt.anchorMin = new Vector2(0, 0.5f); srt.anchorMax = new Vector2(0, 0.5f);
                srt.pivot = new Vector2(0, 0.5f);
                srt.sizeDelta = new Vector2(110, 60);
                srt.anchoredPosition = new Vector2(i * 120, 0);
                slot.color = i == 0 ? new Color(0.2f, 0.4f, 0.7f, 0.9f) : new Color(0.15f, 0.18f, 0.25f, 0.9f);
                var idx = RuntimeUIBuilder.CreateLabel(slot.transform, i == 0 ? "现在" : $"T+{i}", 12, TextAnchor.UpperCenter, 100, 16);
                idx.rectTransform.anchoredPosition = new Vector2(0, 18);
                idx.color = i == 0 ? Color.yellow : new Color(0.75f, 0.8f, 0.9f);
                var wn = RuntimeUIBuilder.CreateLabel(slot.transform, WeatherSystem.Instance.GetWeatherName(fc[i].weather), 13,
                    TextAnchor.MiddleCenter, 100, 18);
                wn.rectTransform.anchoredPosition = Vector2.zero;
                var wd = RuntimeUIBuilder.CreateLabel(slot.transform, WeatherSystem.Instance.GetWindDirectionName(fc[i].windDirection) + $" ({Mathf.RoundToInt(fc[i].windStrength * 100)}%)", 10,
                    TextAnchor.LowerCenter, 100, 14);
                wd.rectTransform.anchoredPosition = new Vector2(0, -18);
                wd.color = new Color(0.75f, 0.9f, 1f);
            }
        }

        private string StatusStr(TaskStatus s, int att) => s switch
        {
            TaskStatus.Available => $"可拍 {att}/3",
            TaskStatus.InProgress => "拍摄中",
            TaskStatus.Completed => "✓ 已完成",
            TaskStatus.Failed => "✗ 失败",
            _ => "-"
        };
        private static Color GetRarity(int r) => r switch
        {
            1 => new Color(0.75f, 0.75f, 0.75f),
            2 => new Color(0.3f, 0.85f, 0.45f),
            3 => new Color(0.3f, 0.6f, 1f),
            4 => new Color(0.85f, 0.35f, 0.95f),
            _ => new Color(1f, 0.78f, 0.15f)
        };

        private void UpdateFuel(float c, float m)
        {
            if (fuelSlider != null) fuelSlider.value = m > 0 ? c / m : 0;
            if (fuelText != null) fuelText.text = $"燃料: {c:F0}/{m:F0}";
            if (fuelWarnImg != null) fuelWarnImg.enabled = c / m < 0.2f;
        }
        private void UpdateFood(float c, float m) { if (foodSlider != null) foodSlider.value = m > 0 ? c / m : 0; if (foodText != null) foodText.text = $"食物: {c:F0}/{m:F0}"; }
        private void UpdateBatt(float c, float m)
        {
            if (battSlider != null) battSlider.value = m > 0 ? c / m : 0;
            if (battText != null) battText.text = $"电量: {c:F0}/{m:F0}";
            bool can = cachedBoat != null && cachedBoat.CanShootPhoto();
            if (shootReadyText != null) { shootReadyText.text = can ? "准备拍摄" : "电量不足"; shootReadyText.color = can ? Color.green : Color.red; }
            if (shootBtn != null) shootBtn.interactable = can;
        }
        private void UpdateHealth(float c, float m) { if (healthSlider != null) healthSlider.value = m > 0 ? c / m : 0; if (healthText != null) healthText.text = $"船体: {c:F0}/{m:F0}"; }

        private void OnGameStateChanged(GameStateChangedEvent e)
        {
            if (e.NewState == GameState.Playing) { gameObject.SetActive(true); Open(); }
            else if (e.OldState == GameState.Playing) { Close(); gameObject.SetActive(false); }
        }

        private void OnWeatherChanged(WeatherChangedEvent e)
        {
            if (weatherNameText != null) weatherNameText.text = WeatherSystem.Instance.GetWeatherName(e.NewWeather);
            AudioManager.Instance?.PlaySfx(SfxType.WeatherChange);
        }

        private void OnWindChanged(WindChangedEvent e)
        {
            if (windDirText != null) windDirText.text = $"风向: {WeatherSystem.Instance.GetWindDirectionName(e.Direction)} 强度{Mathf.RoundToInt(e.Strength * 100)}%";
            if (windSlider != null) windSlider.value = e.Strength;
            if (windArrowImg != null) windArrowImg.rectTransform.rotation = Quaternion.Euler(0, 0, -(float)e.Direction);
        }

        private void OnVisibilityChanged(VisibilityChangedEvent e)
        {
            if (visText != null) { visText.text = $"能见度: {e.Visibility.GetName()}"; visText.color = e.Visibility <= VisibilityLevel.Poor ? Color.red : Color.white; }
        }

        private void OnWeatherWarning(WeatherWarningEvent e)
        {
            if (weatherWarnBanner != null) weatherWarnBanner.enabled = true;
            if (weatherWarnText != null) weatherWarnText.text = $"⚠ 即将变化: {WeatherSystem.Instance.GetWeatherName(e.UpcomingWeather)}";
            AudioManager.Instance?.PlaySfx(SfxType.Warning);
        }

        private void OnBoatLowFuel(BoatLowFuelEvent e) { AudioManager.Instance?.PlaySfx(SfxType.LowFuel); }

        private void OnPause()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            GameManager.Instance?.TogglePause();
            UIManager.Instance?.OpenPanel(UIType.PauseMenu);
        }

        private void OnShootPhoto()
        {
            if (cachedBoat == null || TaskSystem.Instance == null) return;
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            var boatPos = cachedBoat.GetPosition2D();
            PhotoTaskData near = null; float nd = float.MaxValue;
            foreach (var t in TaskSystem.Instance.ActiveTasks)
            {
                if (t.status != TaskStatus.Available) continue;
                var td = TaskSystem.Instance.GetTaskData(t.taskId); if (td == null) continue;
                float d = Vector2.Distance(boatPos, td.targetPosition);
                if (d < td.detectionRadius && d < nd) { near = td; nd = d; }
            }
            if (near != null)
            {
                cachedBoat.ShootPhoto();
                var r = TaskSystem.Instance.TakePhoto(near, boatPos, cachedBoat.CurrentHeading);
                cachedBoat.FinishShooting();
                AudioManager.Instance?.PlaySfx(SfxType.PhotoShutter);
                UIManager.Instance?.ShowNotification(r.message, 2.2f);
                InitializeTasks();
            }
            else UIManager.Instance?.ShowNotification("附近没有可拍摄的目标，接近彩色圆点", 1.8f);
        }

        private void OnRoutePlan()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            UIManager.Instance?.OpenPanel(UIType.RoutePlanner);
        }
        private void OnAnchor() { AudioManager.Instance?.PlaySfx(SfxType.ButtonClick); cachedBoat?.Anchor(); UIManager.Instance?.ShowNotification("已抛锚", 1.2f); }
        private void OnSail() { AudioManager.Instance?.PlaySfx(SfxType.ButtonClick); cachedBoat?.SetSail(); UIManager.Instance?.ShowNotification("起锚出发", 1.2f); }
    }
}
