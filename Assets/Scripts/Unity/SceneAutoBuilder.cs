using System;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.EventSystems;

namespace BalloonPost.Unity
{
    using BalloonPost.Core;
    using BalloonPost.Save;
    using BalloonPost.Tutorial;
    using BalloonPost.UI;

    public class SceneAutoBuilder : MonoBehaviour
    {
        [Header("启动配置")]
        public bool StartTutorial = true;
        public int TutorialLevel = 1;
        public float HexSize = 1.2f;
        public float CameraHeight = 12f;
        public float CameraDistance = 10f;

        [Header("运行时对象")]
        public Camera MainCamera;
        public Light SunLight;
        public HexGridRenderer GridRenderer;
        public GameManager Game;
        public TutorialManager Tutorial;
        public GameBootstrap Bootstrap;

        private Dictionary<AxialCoord, GameObject> _hexObjects;
        private Vector2 _leftScroll = Vector2.zero;
        private Vector2 _rightScroll = Vector2.zero;
        private string _statusText = "";
        private string _tutorialText = "";
        private string _scoreText = "";
        private string _contractText = "";
        private string _forecastText = "";
        private string _logText = "";
        private readonly Queue<string> _logQueue = new Queue<string>();
        private SettlementReport _lastReport;
        private bool _showSettlement = false;
        private int _currentTutorialLevel = 1;

        private static SceneAutoBuilder _instance;
        public static SceneAutoBuilder Instance => _instance;

        private void Awake()
        {
            _instance = this;
            BuildScene();
        }

        private void Start()
        {
            InitializeGame();
        }

        private void BuildScene()
        {
            if (Camera.main == null)
            {
                MainCamera = new GameObject("Main Camera").AddComponent<Camera>();
                MainCamera.tag = "MainCamera";
                MainCamera.clearFlags = CameraClearFlags.SolidColor;
                MainCamera.backgroundColor = new Color(0.45f, 0.7f, 0.95f);
                MainCamera.fieldOfView = 50f;
                MainCamera.nearClipPlane = 0.1f;
                MainCamera.farClipPlane = 1000f;
            }
            else
            {
                MainCamera = Camera.main;
            }
            MainCamera.transform.position = new Vector3(0, CameraHeight, -CameraDistance);
            MainCamera.transform.rotation = Quaternion.Euler(40, 0, 0);
            MainCamera.gameObject.AddComponent<AudioListener>();

            if (FindObjectOfType<Light>() == null)
            {
                SunLight = new GameObject("Directional Light").AddComponent<Light>();
                SunLight.type = LightType.Directional;
                SunLight.color = new Color(1f, 0.95f, 0.85f);
                SunLight.intensity = 1.2f;
                SunLight.transform.rotation = Quaternion.Euler(50, -30, 0);
                RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
                RenderSettings.ambientSkyColor = new Color(0.6f, 0.8f, 1f);
                RenderSettings.ambientEquatorColor = new Color(0.9f, 0.95f, 1f);
                RenderSettings.ambientGroundColor = new Color(0.7f, 0.65f, 0.5f);
            }

            if (FindObjectOfType<EventSystem>() == null)
            {
                var es = new GameObject("EventSystem");
                es.AddComponent<EventSystem>();
                es.AddComponent<StandaloneInputModule>();
            }

            var bootstrapGO = new GameObject("GameBootstrap");
            Bootstrap = bootstrapGO.AddComponent<GameBootstrap>();

            var gridGO = new GameObject("HexGrid");
            GridRenderer = gridGO.AddComponent<HexGridRenderer>();
            GridRenderer.HexSize = HexSize;
            GridRenderer.OriginOffset = Vector3.zero;
            GridRenderer.GridParent = gridGO.transform;
        }

        private void InitializeGame()
        {
            if (StartTutorial)
            {
                StartTutorialLevel(TutorialLevel);
            }
            else
            {
                Bootstrap.GameSeed = 42;
                Bootstrap.MaxTurns = 30;
                Bootstrap.InitializeGame();
                BindGame();
            }
            LogMessage("🎈 热气球邮差已启动！点击相邻格子规划航线～");
            RefreshAllPanels();
        }

        public void StartTutorialLevel(int level)
        {
            _currentTutorialLevel = level;
            _showSettlement = false;
            _lastReport = null;
            Bootstrap.StartTutorial = true;
            Bootstrap.TutorialLevel = level;
            Bootstrap.InitializeGame();
            Bootstrap.StartTutorialLevel(level);
            BindGame();

            if (Tutorial != null)
            {
                Tutorial.CurrentStepIndex = level - 1;
                Tutorial.StartCurrentStep();
            }
            LogMessage($"📚 开始教程第 {level} 关");
        }

        private void BindGame()
        {
            Game = Bootstrap.Game;
            Tutorial = Bootstrap.Tutorial;
            if (Game == null) return;

            Game.OnLogMessage += msg => LogMessage(msg);
            Game.OnPhaseChanged += OnPhaseChanged;
            Game.OnSettlementComplete += OnSettled;

            if (Tutorial != null)
            {
                Tutorial.OnTutorialMessage += msg => AppendTutorial(msg);
            }

            if (GridRenderer != null)
            {
                GridRenderer.Initialize(Game);
                GridRenderer.OnCellClicked -= OnCellClicked;
                GridRenderer.OnCellClicked += OnCellClicked;
                GridRenderer.UpdatePlayerPosition(Game.Player.Position);
                GridRenderer.UpdateRouteVisual(Game.Planner.CurrentPlan);
                HighlightValidNextSteps();
            }
        }

        private void OnCellClicked(AxialCoord coord)
        {
            if (_showSettlement) return;
            if (Game.Phase != GamePhase.Planning && Game.Phase != GamePhase.Tutorial)
            {
                LogMessage("⚠ 现在不在规划阶段，无法添加航线");
                return;
            }

            bool added = Game.Planner.TryAddStep(coord);
            if (added)
            {
                GridRenderer.UpdateRouteVisual(Game.Planner.CurrentPlan);
                RefreshAllPanels();
            }
            HighlightValidNextSteps();
        }

        private void OnPhaseChanged(GamePhase phase)
        {
            LogMessage($"阶段切换：{phase}");
            if (phase == GamePhase.Planning || phase == GamePhase.Tutorial)
            {
                GridRenderer?.UpdatePlayerPosition(Game.Player.Position);
                GridRenderer?.UpdateRouteVisual(Game.Planner.CurrentPlan);
                HighlightValidNextSteps();
            }
            else if (phase == GamePhase.Executing)
            {
                GridRenderer?.ClearHighlights();
            }
            RefreshAllPanels();
        }

        private void OnSettled(SettlementReport report)
        {
            _lastReport = report;
            _showSettlement = true;

            if (Tutorial != null && Game.Phase != GamePhase.Tutorial)
            {
                bool ok = Tutorial.CheckStepCompletion(report);
                AppendTutorial($"\n📊 结算检查：{(ok ? "✅ 通过" : "❌ 未通过")}");
                if (ok)
                {
                    bool hasNext = Tutorial.AdvanceToNextStep();
                    if (hasNext)
                    {
                        AppendTutorial($"➡ 即将进入：{Tutorial.CurrentStep?.Title}");
                    }
                    else
                    {
                        AppendTutorial("🎉 所有教程关卡完成！");
                    }
                }
            }

            var view = SettlementPresenter.BuildView(report, Game);
            var sb = new StringBuilder();
            sb.AppendLine($"=== {view.TitleText} ===");
            sb.AppendLine(view.SummaryGrade + "  " + new string('★', view.Stars) + new string('☆', 5 - view.Stars));
            sb.AppendLine(view.ScoreText);
            sb.AppendLine();
            sb.AppendLine(view.EarningsBreakdown);
            sb.AppendLine(view.HighlightsText);
            sb.AppendLine(view.DeliveredList);
            sb.AppendLine(view.ComplaintsList);
            sb.AppendLine(view.UndeliveredList);
            _statusText = sb.ToString();
        }

        private void HighlightValidNextSteps()
        {
            GridRenderer?.ClearHighlights();
            if (Game == null) return;
            var valid = Game.Planner.GetValidNextSteps();
            GridRenderer?.HighlightCells(valid, new Color(0.2f, 1f, 0.3f, 0.4f));

            if (Game.ContractManager != null)
            {
                foreach (var c in Game.ContractManager.ActiveContracts)
                {
                    if (GridRenderer.CellViews.TryGetValue(c.FromCoord, out var fromView))
                    {
                        fromView.Highlight(new Color(0.3f, 0.6f, 1f, 0.35f));
                    }
                    if (GridRenderer.CellViews.TryGetValue(c.ToCoord, out var toView))
                    {
                        toView.Highlight(new Color(1f, 0.4f, 0.4f, 0.35f));
                    }
                }
            }
        }

        private void RefreshAllPanels()
        {
            RefreshStatusBar();
            RefreshForecast();
            RefreshContracts();
            RefreshScore();
            RefreshTutorial();
        }

        private void RefreshStatusBar()
        {
            if (Game == null) return;
            var sb = new StringBuilder();
            sb.AppendLine($"回合 {Game.TurnsElapsed} / {Game.MaxTurns}    阶段: {Game.Phase}");
            sb.AppendLine($"位置 {Game.Player.Position}    燃料 {Game.Player.Fuel}/{Game.Player.MaxFuel}");
            sb.AppendLine($"金币 {Game.Player.Money}    声望 {Game.Player.Reputation}");
            _statusText = sb.ToString();
        }

        private void RefreshForecast()
        {
            if (Game?.WindManager == null) return;
            var wm = Game.WindManager;
            var sb = new StringBuilder();
            sb.AppendLine("=== 🌤 风向预报 (提前2步) ===");
            for (int i = 0; i < wm.LookAheadTurns; i++)
            {
                var w = wm.Forecast[i];
                if (w == null) continue;
                string label = i == 0 ? "[本回合]" : i == 1 ? "[下一步]" : $"[{i}步后]";
                string arrow = "";
                switch (w.Direction)
                {
                    case WindDirection.East: arrow = "→ → →"; break;
                    case WindDirection.Northeast: arrow = "↗ ↗ ↗"; break;
                    case WindDirection.Northwest: arrow = "↖ ↖ ↖"; break;
                    case WindDirection.West: arrow = "← ← ←"; break;
                    case WindDirection.Southwest: arrow = "↙ ↙ ↙"; break;
                    case WindDirection.Southeast: arrow = "↘ ↘ ↘"; break;
                }
                string strength = new string('█', (int)w.Strength + 1);
                sb.AppendLine($"{label,-8} T{w.TurnIndex}  {arrow} {WindManager.GetWindStrengthLabel(w.Strength),-5} {strength}");
            }
            _forecastText = sb.ToString();
        }

        private void RefreshContracts()
        {
            if (Game?.ContractManager == null) return;
            var sb = new StringBuilder();
            sb.AppendLine("=== 📋 合同队列 ===");
            var active = Game.ContractManager.GetSortedActive();
            if (active.Count == 0) sb.AppendLine("（暂无进行中合同）");
            foreach (var c in active)
            {
                string stars = new string('★', c.PriorityWeight) + new string('☆', 3 - c.PriorityWeight);
                string tag = c.Type switch
                {
                    ContractType.TimeSensitive => "⏰ 限时",
                    ContractType.Fragile => "🧸 易碎",
                    _ => "✉ 普通"
                };
                string turns = c.TurnsRemaining == int.MaxValue ? "∞" : c.TurnsRemaining.ToString();
                string status = c.Status switch
                {
                    ContractStatus.Accepted => "待取件",
                    ContractStatus.InTransit => "运输中",
                    _ => c.Status.ToString()
                };
                sb.AppendLine($"【{tag}】{stars}");
                sb.AppendLine($"  {c.FromTown} → {c.ToTown}");
                sb.AppendLine($"  奖励{c.BaseReward}金 | 剩余{turns}回合 | {status}");
                if (c.Type == ContractType.Fragile)
                    sb.AppendLine($"  损坏度: {c.CurrentDamage}/{c.FragilityLevel * 2}");
            }
            _contractText = sb.ToString();
        }

        private void RefreshScore()
        {
            if (Game?.Planner == null) return;
            var plan = Game.Planner.CurrentPlan;
            var score = Game.Planner.GetCurrentScore();
            var sb = new StringBuilder();
            sb.AppendLine("=== ⭐ 路线评分 ===");
            sb.AppendLine($"步数: {plan.Steps.Count} | 燃料: {plan.TotalFuelCost}/{Game.Player.MaxFuel}");
            if (plan.Steps.Count > 0)
                sb.AppendLine($"终点: {plan.CurrentEndPosition}  (距邮局 {plan.CurrentEndPosition.DistanceTo(AxialCoord.Zero)}格)");
            sb.AppendLine();
            sb.AppendLine($"总分：{score.TotalScore}");
            sb.AppendLine($"  路径效率: {score.DistanceEfficiencyScore,+5}");
            sb.AppendLine($"  优先级分: {score.PriorityScore,+5}");
            sb.AppendLine($"  燃油效率: {score.FuelEfficiencyScore,+5}");
            if (score.OnTimeScore != 0) sb.AppendLine($"  准时奖励: {score.OnTimeScore,+5}");
            if (score.FragilityScore != 0) sb.AppendLine($"  完好奖励: {score.FragilityScore,+5}");
            if (score.ComboBonus > 0) sb.AppendLine($"  顺风连击: {score.ComboBonus,+5}");
            if (score.Penalties != 0) sb.AppendLine($"  惩罚扣分: {score.Penalties,+5}");

            if (plan.Steps.Count == 0)
            {
                sb.AppendLine("\n（点击地图上相邻的绿色格子来规划路线）");
            }
            else if (!string.IsNullOrEmpty(score.PriorityExplanation))
            {
                sb.AppendLine();
                sb.AppendLine("📖 优先级说明:");
                string[] lines = score.PriorityExplanation.Split('\n');
                foreach (var l in lines) sb.AppendLine("  " + l);
            }
            _scoreText = sb.ToString();
        }

        private void RefreshTutorial()
        {
            if (Tutorial?.CurrentStep == null) return;
            var sb = new StringBuilder();
            sb.AppendLine($"=== 📚 {Tutorial.GetProgressText()} ===");
            sb.AppendLine(Tutorial.CurrentStep.Title);
            sb.AppendLine();
            string[] lines = Tutorial.CurrentStep.Description.Split('\n');
            foreach (var l in lines) sb.AppendLine(l);
            if (!string.IsNullOrEmpty(Tutorial.CurrentStep.Hint))
            {
                sb.AppendLine();
                sb.AppendLine($"💡 {Tutorial.CurrentStep.Hint}");
            }
            _tutorialText = sb.ToString();
        }

        private void AppendTutorial(string msg)
        {
            _tutorialText += "\n" + msg;
        }

        public void LogMessage(string msg)
        {
            _logQueue.Enqueue($"[{DateTime.Now:HH:mm:ss}] {msg}");
            while (_logQueue.Count > 30) _logQueue.Dequeue();
            var sb = new StringBuilder();
            foreach (var s in _logQueue) sb.AppendLine(s);
            _logText = sb.ToString();
        }

        #region IMGUI

        private void OnGUI()
        {
            DrawStatusBar();
            DrawForecastPanel();
            DrawContractsPanel();
            DrawScorePanel();
            DrawTutorialPanel();
            DrawActionButtons();
            DrawLogPanel();

            if (_showSettlement)
            {
                DrawSettlementOverlay();
            }
        }

        private void DrawStatusBar()
        {
            GUI.Box(new Rect(10, 10, 450, 80), "");
            GUILayout.BeginArea(new Rect(20, 15, 440, 75));
            GUIStyle style = new GUIStyle(GUI.skin.label);
            style.fontSize = 14;
            style.fontStyle = FontStyle.Bold;
            style.richText = true;
            GUILayout.Label(_statusText, style);
            GUILayout.EndArea();
        }

        private void DrawForecastPanel()
        {
            GUI.Box(new Rect(470, 10, 420, 100), "🌤 风向预报");
            GUILayout.BeginArea(new Rect(480, 30, 400, 75));
            GUILayout.Label(_forecastText);
            GUILayout.EndArea();
        }

        private void DrawContractsPanel()
        {
            GUI.Box(new Rect(Screen.width - 360, 10, 350, 280), "📋 合同队列");
            _rightScroll = GUILayout.BeginScrollView(
                new Rect(Screen.width - 350, 30, 330, 250),
                _rightScroll, false, true, GUILayout.Width(330), GUILayout.Height(250));
            GUILayout.Label(_contractText);
            GUILayout.EndScrollView();
        }

        private void DrawScorePanel()
        {
            GUI.Box(new Rect(Screen.width - 360, 300, 350, 330), "⭐ 路线评分");
            GUILayout.BeginArea(new Rect(Screen.width - 350, 320, 330, 300));
            _rightScroll = GUILayout.BeginScrollView(new Vector2(0, _rightScroll.y), false, true);
            GUILayout.Label(_scoreText);
            GUILayout.EndScrollView();
            GUILayout.EndArea();
        }

        private void DrawTutorialPanel()
        {
            if (Tutorial?.CurrentStep == null) return;
            GUI.Box(new Rect(10, 100, 450, 300), "📚 教程");
            _leftScroll = GUILayout.BeginScrollView(
                new Rect(20, 120, 430, 270),
                _leftScroll, false, true, GUILayout.Width(430), GUILayout.Height(270));
            GUIStyle style = new GUIStyle(GUI.skin.label);
            style.wordWrap = true;
            GUILayout.Label(_tutorialText, style);
            GUILayout.EndScrollView();
        }

        private void DrawActionButtons()
        {
            float y = Screen.height - 130;
            GUI.Box(new Rect(10, y, 650, 120), "🎮 操作");

            GUILayout.BeginArea(new Rect(20, y + 10, 630, 100));
            GUILayout.BeginHorizontal();

            GUI.backgroundColor = new Color(0.4f, 0.9f, 0.5f);
            if (GUILayout.Button("▶ 执行航线", GUILayout.Height(45), GUILayout.Width(150)))
            {
                if (Game?.ExecutePlan() ?? false)
                {
                    GridRenderer?.UpdatePlayerPosition(Game.Player.Position);
                    GridRenderer?.UpdateRouteVisual(Game.Planner.CurrentPlan);
                    HighlightValidNextSteps();
                    RefreshAllPanels();
                }
            }
            GUI.backgroundColor = Color.white;

            GUI.backgroundColor = new Color(1f, 0.8f, 0.3f);
            if (GUILayout.Button("↩ 撤销一步", GUILayout.Height(45), GUILayout.Width(120)))
            {
                if (Game?.Planner?.Undo() ?? false)
                {
                    GridRenderer?.UpdateRouteVisual(Game.Planner.CurrentPlan);
                    HighlightValidNextSteps();
                    RefreshAllPanels();
                }
            }
            GUI.backgroundColor = Color.white;

            GUI.backgroundColor = new Color(0.9f, 0.6f, 0.5f);
            if (GUILayout.Button("🗑 清空航线", GUILayout.Height(45), GUILayout.Width(120)))
            {
                Game?.Planner?.ClearPlan();
                GridRenderer?.UpdateRouteVisual(Game?.Planner?.CurrentPlan);
                HighlightValidNextSteps();
                RefreshAllPanels();
            }
            GUI.backgroundColor = Color.white;

            if (GUILayout.Button("⛽ 补给燃料", GUILayout.Height(45), GUILayout.Width(110)))
            {
                Game?.TryRefuelAtPostOffice();
                RefreshAllPanels();
            }

            if (GUILayout.Button("💾 保存", GUILayout.Height(45), GUILayout.Width(80)))
            {
                SaveSystem.SaveGame(Game, $"手动存档_T{Game.TurnsElapsed}");
                LogMessage("💾 已保存游戏");
            }

            GUILayout.EndHorizontal();
            GUILayout.Space(8);
            GUILayout.BeginHorizontal();

            GUI.backgroundColor = new Color(0.7f, 0.85f, 1f);
            if (GUILayout.Button("📗 教程1 准时投递", GUILayout.Height(35))) StartTutorialLevel(1);
            if (GUILayout.Button("📙 教程2 风向反转", GUILayout.Height(35))) StartTutorialLevel(2);
            if (GUILayout.Button("📕 教程3 限时合同", GUILayout.Height(35))) StartTutorialLevel(3);
            GUI.backgroundColor = Color.white;

            if (GUILayout.Button("🎮 正式关卡", GUILayout.Height(35)))
            {
                StartTutorial = false;
                TutorialLevel = 0;
                Bootstrap.StartTutorial = false;
                Bootstrap.InitializeGame();
                BindGame();
                LogMessage("🎮 进入正式关卡！");
            }

            GUILayout.EndHorizontal();
            GUILayout.EndArea();
        }

        private void DrawLogPanel()
        {
            float logH = 110;
            GUI.Box(new Rect(670, Screen.height - 130, Screen.width - 680 - 370, 120), "📝 日志");
            var scroll = GUILayout.BeginScrollView(
                new Rect(680, Screen.height - 115, Screen.width - 700 - 370, logH),
                Vector2.zero, false, true,
                GUILayout.Width(Screen.width - 700 - 370), GUILayout.Height(logH));
            GUILayout.Label(_logText);
            GUILayout.EndScrollView();
        }

        private void DrawSettlementOverlay()
        {
            GUI.backgroundColor = new Color(0, 0, 0, 0.6f);
            GUI.Box(new Rect(0, 0, Screen.width, Screen.height), "");
            GUI.backgroundColor = Color.white;

            float w = Mathf.Min(700, Screen.width - 100);
            float h = Mathf.Min(620, Screen.height - 80);
            float x = (Screen.width - w) / 2;
            float y = (Screen.height - h) / 2;

            GUI.Box(new Rect(x, y, w, h), "");

            GUILayout.BeginArea(new Rect(x + 20, y + 10, w - 40, h - 60));
            var report = _lastReport;
            if (report != null)
            {
                var view = SettlementPresenter.BuildView(report, Game);
                GUILayout.Label($"🎈 {view.TitleText}", new GUIStyle(GUI.skin.label) { fontSize = 22, fontStyle = FontStyle.Bold, alignment = TextAnchor.MiddleCenter });
                GUILayout.Label($"评级：{view.SummaryGrade}  " + new string('★', view.Stars) + new string('☆', 5 - view.Stars),
                    new GUIStyle(GUI.skin.label) { fontSize = 16, alignment = TextAnchor.MiddleCenter });
                GUILayout.Space(5);
                GUILayout.Label(view.ScoreText, new GUIStyle(GUI.skin.label) { fontSize = 14, alignment = TextAnchor.MiddleCenter });
                GUILayout.Space(10);

                Vector2 sv = Vector2.zero;
                sv = GUILayout.BeginScrollView(sv, false, true);
                GUILayout.Label(view.EarningsBreakdown);
                GUILayout.Space(5);
                if (!string.IsNullOrEmpty(view.HighlightsText))
                    GUILayout.Label(view.HighlightsText);
                GUILayout.Space(5);
                GUILayout.Label(view.DeliveredList);
                GUILayout.Space(5);
                GUILayout.Label(view.ComplaintsList);
                GUILayout.Space(5);
                GUILayout.Label(view.UndeliveredList);
                GUILayout.EndScrollView();
            }
            GUILayout.EndArea();

            float bw = 200, bh = 40;
            if (GUI.Button(new Rect(x + w / 2 - bw - 10, y + h - 55, bw, bh), "🔄 重玩本关"))
            {
                _showSettlement = false;
                _lastReport = null;
                StartTutorialLevel(_currentTutorialLevel);
            }
            if (GUI.Button(new Rect(x + w / 2 + 10, y + h - 55, bw, bh), "➡ 继续 / 下一关"))
            {
                if (Tutorial != null && _lastReport != null)
                {
                    bool passed = Tutorial.CheckStepCompletion(_lastReport);
                    if (passed && Tutorial.CurrentStepIndex < 2)
                    {
                        _showSettlement = false;
                        _lastReport = null;
                        int next = Tutorial.CurrentStepIndex + 2;
                        if (next <= 3) StartTutorialLevel(next);
                        else { _showSettlement = false; }
                    }
                    else
                    {
                        _showSettlement = false;
                        _lastReport = null;
                    }
                }
                else
                {
                    _showSettlement = false;
                    _lastReport = null;
                }
            }
        }

        #endregion

        private void Update()
        {
            HandleCameraInput();
        }

        private void HandleCameraInput()
        {
            if (MainCamera == null) return;
            float panSpeed = 20f * Time.deltaTime;
            float zoomSpeed = 5f * Time.deltaTime;

            Vector3 pos = MainCamera.transform.position;
            if (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow)) pos += Vector3.forward * panSpeed;
            if (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow)) pos -= Vector3.forward * panSpeed;
            if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) pos -= Vector3.right * panSpeed;
            if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) pos += Vector3.right * panSpeed;

            if (Input.GetKey(KeyCode.Q)) pos.y += zoomSpeed;
            if (Input.GetKey(KeyCode.E)) pos.y -= zoomSpeed;
            float scroll = Input.GetAxis("Mouse ScrollWheel");
            pos.y -= scroll * zoomSpeed * 10;
            pos.y = Mathf.Clamp(pos.y, 3f, 35f);

            MainCamera.transform.position = pos;
        }
    }
}
