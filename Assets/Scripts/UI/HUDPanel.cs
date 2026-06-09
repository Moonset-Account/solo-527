using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Audio;
using LakeSailing.Gameplay;

namespace LakeSailing.UI
{
    public class HUDPanel : UIPanelBase
    {
        [Header("顶部状态栏")]
        [SerializeField] private Text scoreText;
        [SerializeField] private Text timeRemainingText;
        [SerializeField] private Text taskProgressText;
        [SerializeField] private Button pauseButton;

        [Header("天气面板")]
        [SerializeField] private Image weatherIcon;
        [SerializeField] private Text weatherNameText;
        [SerializeField] private Text windDirectionText;
        [SerializeField] private Image windArrow;
        [SerializeField] private Slider windStrengthSlider;
        [SerializeField] private Text visibilityText;
        [SerializeField] private Image visibilityWarningImage;
        [SerializeField] private GameObject weatherWarningBanner;
        [SerializeField] private Text weatherWarningText;
        [SerializeField] private Text weatherWarningTimerText;

        [Header("补给状态")]
        [SerializeField] private Slider fuelSlider;
        [SerializeField] private Text fuelText;
        [SerializeField] private Slider foodSlider;
        [SerializeField] private Text foodText;
        [SerializeField] private Slider batterySlider;
        [SerializeField] private Text batteryText;
        [SerializeField] private Slider healthSlider;
        [SerializeField] private Text healthText;
        [SerializeField] private Image lowFuelWarning;

        [Header("操作面板")]
        [SerializeField] private Button shootPhotoButton;
        [SerializeField] private Button routePlanButton;
        [SerializeField] private Button anchorButton;
        [SerializeField] private Button setSailButton;
        [SerializeField] private Text shootReadyText;

        [Header("任务面板")]
        [SerializeField] private Transform taskListContainer;
        [SerializeField] private GameObject taskItemPrefab;
        [SerializeField] private List<TaskItemUI> taskItems = new List<TaskItemUI>();

        [Header("天气预报")]
        [SerializeField] private Transform forecastContainer;
        [SerializeField] private GameObject forecastItemPrefab;

        private BoatController cachedBoat;

        private void Awake()
        {
            panelType = UIType.HUD;
            UIManager.Instance?.RegisterPanel(panelType, this);
            SubscribeToEvents();
        }

        private void OnDestroy()
        {
            UnsubscribeFromEvents();
        }

        private void SubscribeToEvents()
        {
            EventBus.Subscribe<GameStateChangedEvent>(OnGameStateChanged);
            EventBus.Subscribe<WeatherChangedEvent>(OnWeatherChanged);
            EventBus.Subscribe<WindChangedEvent>(OnWindChanged);
            EventBus.Subscribe<VisibilityChangedEvent>(OnVisibilityChanged);
            EventBus.Subscribe<WeatherWarningEvent>(OnWeatherWarning);
            EventBus.Subscribe<BoatLowFuelEvent>(OnBoatLowFuel);
        }

        private void UnsubscribeFromEvents()
        {
            EventBus.Unsubscribe<GameStateChangedEvent>(OnGameStateChanged);
            EventBus.Unsubscribe<WeatherChangedEvent>(OnWeatherChanged);
            EventBus.Unsubscribe<WindChangedEvent>(OnWindChanged);
            EventBus.Unsubscribe<VisibilityChangedEvent>(OnVisibilityChanged);
            EventBus.Unsubscribe<WeatherWarningEvent>(OnWeatherWarning);
            EventBus.Unsubscribe<BoatLowFuelEvent>(OnBoatLowFuel);
        }

        private void Start()
        {
            InitializeButtons();
        }

        private void InitializeButtons()
        {
            if (pauseButton) pauseButton.onClick.AddListener(OnPauseClicked);
            if (shootPhotoButton) shootPhotoButton.onClick.AddListener(OnShootPhotoClicked);
            if (routePlanButton) routePlanButton.onClick.AddListener(OnRoutePlanClicked);
            if (anchorButton) anchorButton.onClick.AddListener(OnAnchorClicked);
            if (setSailButton) setSailButton.onClick.AddListener(OnSetSailClicked);
        }

        public void SetBoatReference(BoatController boat)
        {
            cachedBoat = boat;
            if (cachedBoat != null)
            {
                cachedBoat.OnFuelChanged += UpdateFuelDisplay;
                cachedBoat.OnFoodChanged += UpdateFoodDisplay;
                cachedBoat.OnBatteryChanged += UpdateBatteryDisplay;
                cachedBoat.OnHealthChanged += UpdateHealthDisplay;
            }
        }

        private void Update()
        {
            if (GameManager.Instance == null || GameManager.Instance.CurrentState != GameState.Playing) return;
            UpdateTimeDisplay();
            UpdateScoreDisplay();
            UpdateTaskProgress();
            UpdateWeatherWarningTimer();
        }

        private void UpdateTimeDisplay()
        {
            if (timeRemainingText == null) return;
            float time = TaskSystem.Instance?.TimeRemaining ?? 0;
            int minutes = Mathf.FloorToInt(time / 60f);
            int seconds = Mathf.FloorToInt(time % 60f);
            timeRemainingText.text = $"{minutes:00}:{seconds:00}";
            timeRemainingText.color = time < 60f ? Color.red : Color.white;
        }

        private void UpdateScoreDisplay()
        {
            if (scoreText != null)
            {
                scoreText.text = $"分数: {TaskSystem.Instance?.TotalScore ?? 0}";
            }
        }

        private void UpdateTaskProgress()
        {
            if (taskProgressText != null)
            {
                int completed = TaskSystem.Instance?.GetCompletedTaskCount() ?? 0;
                int total = TaskSystem.Instance?.GetTotalTaskCount() ?? 0;
                taskProgressText.text = $"任务: {completed}/{total}";
            }
        }

        private void UpdateWeatherWarningTimer()
        {
            if (weatherWarningBanner == null || weatherWarningTimerText == null) return;
            bool isWarning = WeatherSystem.Instance?.IsWarningActive ?? false;
            weatherWarningBanner.SetActive(isWarning);

            if (isWarning)
            {
                float time = WeatherSystem.Instance?.GetTimeUntilNextWeather() ?? 0;
                weatherWarningTimerText.text = $"{time:F0}秒";
            }
        }

        public void InitializeTasks()
        {
            if (taskListContainer == null || taskItemPrefab == null) return;
            foreach (Transform child in taskListContainer)
            {
                Destroy(child.gameObject);
            }
            taskItems.Clear();

            var tasks = TaskSystem.Instance?.ActiveTasks;
            if (tasks == null) return;

            foreach (var task in tasks)
            {
                var go = Instantiate(taskItemPrefab, taskListContainer);
                var itemUI = go.GetComponent<TaskItemUI>();
                if (itemUI != null)
                {
                    var taskData = TaskSystem.Instance.GetTaskData(task.taskId);
                    itemUI.Initialize(task, taskData);
                    taskItems.Add(itemUI);
                }
            }
        }

        public void InitializeForecast()
        {
            if (forecastContainer == null || forecastItemPrefab == null) return;
            foreach (Transform child in forecastContainer)
            {
                Destroy(child.gameObject);
            }

            var forecast = WeatherSystem.Instance?.Forecast;
            if (forecast == null) return;

            for (int i = 0; i < Mathf.Min(6, forecast.Length); i++)
            {
                var go = Instantiate(forecastItemPrefab, forecastContainer);
                var item = go.GetComponent<ForecastItemUI>();
                if (item != null)
                {
                    item.Initialize(forecast[i], i);
                }
            }
        }

        private void UpdateFuelDisplay(float current, float max)
        {
            if (fuelSlider != null) fuelSlider.value = max > 0 ? current / max : 0;
            if (fuelText != null) fuelText.text = $"燃料: {current:F0}/{max:F0}";
            if (lowFuelWarning != null) lowFuelWarning.enabled = current / max < 0.2f;
        }

        private void UpdateFoodDisplay(float current, float max)
        {
            if (foodSlider != null) foodSlider.value = max > 0 ? current / max : 0;
            if (foodText != null) foodText.text = $"食物: {current:F0}/{max:F0}";
        }

        private void UpdateBatteryDisplay(float current, float max)
        {
            if (batterySlider != null) batterySlider.value = max > 0 ? current / max : 0;
            if (batteryText != null) batteryText.text = $"电量: {current:F0}/{max:F0}";
            if (shootReadyText != null)
            {
                bool canShoot = cachedBoat != null && cachedBoat.CanShootPhoto();
                shootReadyText.text = canShoot ? "准备拍摄" : "电量不足";
                if (shootPhotoButton != null) shootPhotoButton.interactable = canShoot;
            }
        }

        private void UpdateHealthDisplay(float current, float max)
        {
            if (healthSlider != null) healthSlider.value = max > 0 ? current / max : 0;
            if (healthText != null) healthText.text = $"船体: {current:F0}/{max:F0}";
        }

        private void OnGameStateChanged(GameStateChangedEvent e)
        {
            if (e.NewState == GameState.Playing)
            {
                Open();
            }
            else
            {
                Close();
            }
        }

        private void OnWeatherChanged(WeatherChangedEvent e)
        {
            if (weatherNameText != null)
            {
                weatherNameText.text = WeatherSystem.Instance.GetWeatherName(e.NewWeather);
            }
            AudioManager.Instance?.PlaySfx(SfxType.WeatherChange);
        }

        private void OnWindChanged(WindChangedEvent e)
        {
            if (windDirectionText != null)
            {
                windDirectionText.text = WeatherSystem.Instance.GetWindDirectionName(e.Direction);
            }
            if (windStrengthSlider != null)
            {
                windStrengthSlider.value = e.Strength;
            }
            if (windArrow != null)
            {
                windArrow.rectTransform.rotation = Quaternion.Euler(0, 0, -(float)e.Direction);
            }
        }

        private void OnVisibilityChanged(VisibilityChangedEvent e)
        {
            if (visibilityText != null)
            {
                visibilityText.text = $"能见度: {e.Visibility.GetName()}";
            }
            if (visibilityWarningImage != null)
            {
                visibilityWarningImage.enabled = e.Visibility <= VisibilityLevel.Poor;
            }
        }

        private void OnWeatherWarning(WeatherWarningEvent e)
        {
            if (weatherWarningText != null)
            {
                weatherWarningText.text = $"即将来袭: {WeatherSystem.Instance.GetWeatherName(e.UpcomingWeather)}";
            }
            AudioManager.Instance?.PlaySfx(SfxType.Warning);
        }

        private void OnBoatLowFuel(BoatLowFuelEvent e)
        {
            AudioManager.Instance?.PlaySfx(SfxType.LowFuel);
        }

        private void OnPauseClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            GameManager.Instance?.TogglePause();
            UIManager.Instance?.OpenPanel(UIType.PauseMenu);
        }

        private void OnShootPhotoClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            TryShootPhoto();
        }

        private void OnRoutePlanClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            UIManager.Instance?.OpenPanel(UIType.RoutePlanner);
        }

        private void OnAnchorClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            cachedBoat?.Anchor();
        }

        private void OnSetSailClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            cachedBoat?.SetSail();
        }

        private void TryShootPhoto()
        {
            if (cachedBoat == null || TaskSystem.Instance == null) return;

            var boatPos = cachedBoat.GetPosition2D();
            PhotoTaskData nearestTask = null;
            float nearestDist = float.MaxValue;

            var tasks = TaskSystem.Instance.ActiveTasks;
            foreach (var task in tasks)
            {
                if (task.status != TaskStatus.Available) continue;
                var taskData = TaskSystem.Instance.GetTaskData(task.taskId);
                if (taskData == null) continue;
                float dist = Vector2.Distance(boatPos, taskData.targetPosition);
                if (dist < taskData.detectionRadius && dist < nearestDist)
                {
                    nearestTask = taskData;
                    nearestDist = dist;
                }
            }

            if (nearestTask != null)
            {
                cachedBoat.ShootPhoto();
                var result = TaskSystem.Instance.TakePhoto(nearestTask, boatPos, cachedBoat.CurrentHeading);
                cachedBoat.FinishShooting();

                if (result.success)
                {
                    AudioManager.Instance?.PlaySfx(SfxType.PhotoShutter);
                    UIManager.Instance?.ShowNotification(result.message, 2f);
                }
                else
                {
                    AudioManager.Instance?.PlaySfx(SfxType.PhotoShutter, 0.5f);
                    UIManager.Instance?.ShowNotification(result.message, 2f);
                }
            }
            else
            {
                UIManager.Instance?.ShowNotification("附近没有可拍摄的目标", 1.5f);
            }
        }
    }
}
