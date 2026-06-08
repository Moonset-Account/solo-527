using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using PuppetTheater.Data;
using PuppetTheater.Core;
using PuppetTheater.Audio;
using PuppetTheater.Input;
using PuppetTheater.Light;
using PuppetTheater.Stage;
using PuppetTheater.Story;
using PuppetTheater.UI;
using PuppetTheater.Leaderboard;

namespace PuppetTheater.Core
{
    public class DemoSceneBootstrap : MonoBehaviour
    {
        private GameSession _session;
        private BeatManager _beatManager;
        private LightStateSystem _lightStateSystem;
        private StageMechanism _stageMechanism;
        private StoryNodeSystem _storyNodeSystem;
        private InputManager _inputManager;
        private AudioManager _audioManager;
        private AnimationFeedback _animationFeedback;
        private ResultScreen _resultScreen;
        private CalibrationPage _calibrationPage;
        private LeaderboardSystem _leaderboardSystem;

        private Canvas _canvas;
        private GameObject _hudPanel;
        private Text _beatIndicatorText;
        private Text _comboText;
        private Text _gradeText;
        private Text _audienceText;
        private Text _storyNodeText;
        private Text _lightColorText;
        private Text _promptText;
        private Text _titleText;
        private GameObject _calibrationPanel;
        private GameObject _resultPanel;
        private Text _calibrationStatusText;

        private StoryScriptData _storyScript;
        private GameMode _currentMode = GameMode.Normal;
        private bool _sessionStarted;

        private void Awake()
        {
            CreateUICanvas();
            CreateSubsystems();
            WireAllUI();
            CreateStoryScript();
            RegisterPuppets();
        }

        private void Start()
        {
            ShowTitleScreen();
        }

        private void Update()
        {
            if (_sessionStarted && _beatManager != null)
            {
                UpdateHUD();
            }

            if (!_sessionStarted && Input.GetKeyDown(KeyCode.Return))
            {
                StartDemoSession(GameMode.Normal);
            }

            if (!_sessionStarted && Input.GetKeyDown(KeyCode.P))
            {
                StartDemoSession(GameMode.Practice);
            }

            if (Input.GetKeyDown(KeyCode.C) && !_sessionStarted)
            {
                ToggleCalibrationPanel();
            }

            if (_calibrationPanel.activeSelf && Input.GetKeyDown(KeyCode.S) && !_calibrationPage.IsCalibrating)
            {
                _calibrationPage.StartCalibration();
            }

            if (_calibrationPanel.activeSelf && _calibrationPage.IsCalibrating)
            {
                _calibrationStatusText.text = "校准中...按空格对齐节拍";
            }

            if (_calibrationPanel.activeSelf && !_calibrationPage.IsCalibrating && _calibrationPage.GetCalibrationOffsetMs() != 0f)
            {
                _calibrationStatusText.text = $"校准完成: {_calibrationPage.GetCalibrationOffsetMs():+0;-0}ms\n按 A 应用 | 按 C 关闭";
                if (Input.GetKeyDown(KeyCode.A))
                {
                    _calibrationPage.ApplyCalibration();
                    _calibrationStatusText.text = "校准已应用！按 C 关闭";
                }
            }
        }

        private void CreateSubsystems()
        {
            var sessionGo = new GameObject("GameSession");
            sessionGo.transform.SetParent(transform);
            _session = sessionGo.AddComponent<GameSession>();

            var beatGo = new GameObject("BeatManager");
            beatGo.transform.SetParent(transform);
            _beatManager = beatGo.AddComponent<BeatManager>();

            var lightGo = new GameObject("LightStateSystem");
            lightGo.transform.SetParent(transform);
            _lightStateSystem = lightGo.AddComponent<LightStateSystem>();

            var stageGo = new GameObject("StageMechanism");
            stageGo.transform.SetParent(transform);
            _stageMechanism = stageGo.AddComponent<StageMechanism>();

            var storyGo = new GameObject("StoryNodeSystem");
            storyGo.transform.SetParent(transform);
            _storyNodeSystem = storyGo.AddComponent<StoryNodeSystem>();

            var inputGo = new GameObject("InputManager");
            inputGo.transform.SetParent(transform);
            _inputManager = inputGo.AddComponent<InputManager>();

            var audioGo = new GameObject("AudioManager");
            audioGo.transform.SetParent(transform);
            _audioManager = audioGo.AddComponent<AudioManager>();

            var feedbackGo = new GameObject("AnimationFeedback");
            feedbackGo.transform.SetParent(transform);
            _animationFeedback = feedbackGo.AddComponent<AnimationFeedback>();

            var resultGo = new GameObject("ResultScreen");
            resultGo.transform.SetParent(transform);
            _resultScreen = resultGo.AddComponent<ResultScreen>();

            var calibGo = new GameObject("CalibrationPage");
            calibGo.transform.SetParent(transform);
            _calibrationPage = calibGo.AddComponent<CalibrationPage>();

            var leaderGo = new GameObject("LeaderboardSystem");
            leaderGo.transform.SetParent(transform);
            _leaderboardSystem = leaderGo.AddComponent<LeaderboardSystem>();
        }

        private void WireSessionReferences()
        {
            var sessionType = typeof(GameSession);
            var fieldMap = new Dictionary<string, MonoBehaviour>
            {
                { "_beatManager", _beatManager },
                { "_lightStateSystem", _lightStateSystem },
                { "_stageMechanism", _stageMechanism },
                { "_storyNodeSystem", _storyNodeSystem },
                { "_inputManager", _inputManager },
                { "_audioManager", _audioManager },
                { "_animationFeedback", _animationFeedback },
                { "_resultScreen", _resultScreen },
                { "_calibrationPage", _calibrationPage },
                { "_leaderboardSystem", _leaderboardSystem }
            };

            foreach (var kvp in fieldMap)
            {
                var field = sessionType.GetField(kvp.Key,
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                if (field != null)
                    field.SetValue(_session, kvp.Value);
            }

            var inputType = typeof(InputManager);
            var bmField = inputType.GetField("_beatManager",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            if (bmField != null)
                bmField.SetValue(_inputManager, _beatManager);

            var calibType = typeof(CalibrationPage);
            var calibBmField = calibType.GetField("_beatManager",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            if (calibBmField != null)
                calibBmField.SetValue(_calibrationPage, _beatManager);
        }

        private void WireResultScreenUI()
        {
            var rsType = typeof(ResultScreen);

            var textFieldMap = new Dictionary<string, string>
            {
                { "_perfectCountText", "Perfect: 0" },
                { "_greatCountText", "Great: 0" },
                { "_goodCountText", "Good: 0" },
                { "_earlyCountText", "Early: 0" },
                { "_lateCountText", "Late: 0" },
                { "_missCountText", "Miss: 0" },
                { "_accuracyText", "Accuracy: 0%" },
                { "_maxComboText", "MaxCombo: 0" },
                { "_totalScoreText", "Score: 0" },
                { "_storyBranchText", "Branch: --" },
                { "_audienceEmotionText", "Emotion: --" },
                { "_gradeText", "Grade: --" },
                { "_failReasonText", "" },
                { "_improvementTipText", "" },
                { "_earlyLateSummaryText", "" }
            };

            foreach (var kvp in textFieldMap)
            {
                var text = CreateChildText(_resultPanel, kvp.Key, 16, TextAnchor.MiddleCenter);
                text.text = kvp.Value;
                var field = rsType.GetField(kvp.Key,
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                if (field != null)
                    field.SetValue(_resultScreen, text);
            }

            SetField(rsType, _resultScreen, "_resultContainer", _resultPanel);

            var completedGroup = new GameObject("RsCompletedGroup");
            completedGroup.transform.SetParent(_resultPanel.transform);
            var failedGroup = new GameObject("RsFailedGroup");
            failedGroup.transform.SetParent(_resultPanel.transform);

            SetField(rsType, _resultScreen, "_completedGroup", completedGroup);
            SetField(rsType, _resultScreen, "_failedGroup", failedGroup);

            var restartBtn = CreateButton("BtnRestart", "重新开始");
            var menuBtn = CreateButton("BtnMenu", "返回菜单");
            var retryBtn = CreateButton("BtnRetry", "重试");

            SetField(rsType, _resultScreen, "_restartButton", restartBtn);
            SetField(rsType, _resultScreen, "_returnToMenuButton", menuBtn);
            SetField(rsType, _resultScreen, "_retryButton", retryBtn);

            _resultScreen.OnRestart += () => StartDemoSession(_currentMode);
            _resultScreen.OnReturnToMenu += ShowTitleScreen;
            _resultScreen.OnRetry += () => StartDemoSession(_currentMode);
        }

        private void CreateUICanvas()
        {
            var canvasGo = new GameObject("MainCanvas");
            canvasGo.transform.SetParent(transform);
            _canvas = canvasGo.AddComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvasGo.AddComponent<CanvasScaler>();
            canvasGo.AddComponent<GraphicRaycaster>();

            _hudPanel = CreatePanel("HUD", new Color(0, 0, 0, 0.6f));
            _hudPanel.transform.SetParent(_canvas.transform, false);
            var hudRect = _hudPanel.GetComponent<RectTransform>();
            hudRect.anchorMin = new Vector2(0, 0.7f);
            hudRect.anchorMax = new Vector2(1, 1f);

            _beatIndicatorText = CreateHudText("Beat", 24, TextAnchor.MiddleCenter);
            _comboText = CreateHudText("Combo", 20, TextAnchor.MiddleLeft);
            _gradeText = CreateHudText("Grade", 28, TextAnchor.MiddleRight);
            _audienceText = CreateHudText("Audience", 16, TextAnchor.MiddleLeft);
            _storyNodeText = CreateHudText("StoryNode", 14, TextAnchor.MiddleLeft);
            _lightColorText = CreateHudText("LightColor", 18, TextAnchor.MiddleCenter);
            _promptText = CreateHudText("Prompt", 14, TextAnchor.LowerCenter);

            LayoutHudTexts();

            _resultPanel = CreatePanel("ResultPanel", new Color(0, 0, 0, 0.85f));
            _resultPanel.transform.SetParent(_canvas.transform, false);
            var resultRect = _resultPanel.GetComponent<RectTransform>();
            resultRect.anchorMin = Vector2.zero;
            resultRect.anchorMax = Vector2.one;
            _resultPanel.SetActive(false);

            _calibrationPanel = CreatePanel("CalibrationPanel", new Color(0.1f, 0.1f, 0.15f, 0.9f));
            _calibrationPanel.transform.SetParent(_canvas.transform, false);
            var calibRect = _calibrationPanel.GetComponent<RectTransform>();
            calibRect.anchorMin = new Vector2(0.2f, 0.2f);
            calibRect.anchorMax = new Vector2(0.8f, 0.8f);
            _calibrationPanel.SetActive(false);

            _calibrationStatusText = CreateChildText(_calibrationPanel, "CalibStatus", 18, TextAnchor.MiddleCenter);
            _calibrationStatusText.text = "按 C 开始校准\n听到节拍声后按空格对齐";

            _titleText = CreateChildText(canvasGo, "Title", 22, TextAnchor.MiddleCenter);
            var titleRt = _titleText.GetComponent<RectTransform>();
            titleRt.anchorMin = new Vector2(0.1f, 0.2f);
            titleRt.anchorMax = new Vector2(0.9f, 0.8f);
            titleRt.offsetMin = Vector2.zero;
            titleRt.offsetMax = Vector2.zero;
        }

        private void WireAllUI()
        {
            WireResultScreenUI();
            WireCalibrationPageUI();
            WireSessionReferences();
        }

        private void WireCalibrationPageUI()
        {
            var calibType = typeof(CalibrationPage);

            var offsetText = CreateChildText(_calibrationPanel, "OffsetDisplay", 16, TextAnchor.MiddleCenter);
            var avgText = CreateChildText(_calibrationPanel, "AvgDisplay", 16, TextAnchor.MiddleCenter);
            var resultText = CreateChildText(_calibrationPanel, "ResultDisplay", 20, TextAnchor.MiddleCenter);
            var countdownText = CreateChildText(_calibrationPanel, "Countdown", 36, TextAnchor.MiddleCenter);

            SetField(calibType, _calibrationPage, "_offsetDisplayText", offsetText);
            SetField(calibType, _calibrationPage, "_averageDisplayText", avgText);
            SetField(calibType, _calibrationPage, "_resultDisplayText", resultText);
            SetField(calibType, _calibrationPage, "_countdownText", countdownText);
        }

        private void CreateStoryScript()
        {
            _storyScript = ScriptableObject.CreateInstance<StoryScriptData>();

            var nodes = new List<StoryNode>
            {
                new StoryNode
                {
                    nodeId = "act1_intro",
                    displayName = "序幕",
                    description = "木偶登场，灯光亮起",
                    requiredLightChoice = LightColor.White,
                    requiredAction = PuppetActionType.Bow,
                    branch = StoryBranch.Default,
                    nextNodeIds = new List<string> { "act1_heroic", "act1_comedic" },
                    minEmotionToUnlock = AudienceEmotion.Angry,
                    isCheckpoint = true
                },
                new StoryNode
                {
                    nodeId = "act1_heroic",
                    displayName = "英雄之路",
                    description = "木偶挺身而出",
                    requiredLightChoice = LightColor.Red,
                    requiredAction = PuppetActionType.Jump,
                    branch = StoryBranch.Heroic,
                    nextNodeIds = new List<string> { "act2_heroic_climax", "act2_heroic_fall" },
                    minEmotionToUnlock = AudienceEmotion.Bored,
                    isCheckpoint = true
                },
                new StoryNode
                {
                    nodeId = "act1_comedic",
                    displayName = "喜剧之路",
                    description = "木偶逗乐观众",
                    requiredLightChoice = LightColor.Yellow,
                    requiredAction = PuppetActionType.Dance,
                    branch = StoryBranch.Comedic,
                    nextNodeIds = new List<string> { "act2_comedic_twist", "act2_comedic_flat" },
                    minEmotionToUnlock = AudienceEmotion.Bored,
                    isCheckpoint = true
                },
                new StoryNode
                {
                    nodeId = "act2_heroic_climax",
                    displayName = "英雄高潮",
                    description = "木偶完成壮举",
                    requiredLightChoice = LightColor.Red,
                    requiredAction = PuppetActionType.Spin,
                    branch = StoryBranch.Heroic,
                    nextNodeIds = new List<string> { "finale_heroic" },
                    minEmotionToUnlock = AudienceEmotion.Bored,
                    isCheckpoint = false
                },
                new StoryNode
                {
                    nodeId = "act2_heroic_fall",
                    displayName = "英雄陨落",
                    description = "木偶失败了",
                    requiredLightChoice = LightColor.Blue,
                    requiredAction = PuppetActionType.Collapse,
                    branch = StoryBranch.Tragic,
                    nextNodeIds = new List<string> { "finale_tragic" },
                    minEmotionToUnlock = AudienceEmotion.Angry,
                    isCheckpoint = false
                },
                new StoryNode
                {
                    nodeId = "act2_comedic_twist",
                    displayName = "喜剧反转",
                    description = "意外结局",
                    requiredLightChoice = LightColor.Purple,
                    requiredAction = PuppetActionType.Wave,
                    branch = StoryBranch.Comedic,
                    nextNodeIds = new List<string> { "finale_comedic" },
                    minEmotionToUnlock = AudienceEmotion.Neutral,
                    isCheckpoint = false
                },
                new StoryNode
                {
                    nodeId = "act2_comedic_flat",
                    displayName = "喜剧平淡",
                    description = "表演不够精彩",
                    requiredLightChoice = LightColor.Yellow,
                    requiredAction = PuppetActionType.Idle,
                    branch = StoryBranch.Mysterious,
                    nextNodeIds = new List<string> { "finale_mystery" },
                    minEmotionToUnlock = AudienceEmotion.Angry,
                    isCheckpoint = false
                },
                new StoryNode
                {
                    nodeId = "finale_heroic",
                    displayName = "英雄终章",
                    description = "掌声雷动",
                    requiredLightChoice = LightColor.Red,
                    requiredAction = PuppetActionType.Bow,
                    branch = StoryBranch.Heroic,
                    nextNodeIds = new List<string>(),
                    minEmotionToUnlock = AudienceEmotion.Bored,
                    isCheckpoint = true
                },
                new StoryNode
                {
                    nodeId = "finale_tragic",
                    displayName = "悲剧终章",
                    description = "泪水与沉默",
                    requiredLightChoice = LightColor.Blue,
                    requiredAction = PuppetActionType.Bow,
                    branch = StoryBranch.Tragic,
                    nextNodeIds = new List<string>(),
                    minEmotionToUnlock = AudienceEmotion.Angry,
                    isCheckpoint = true
                },
                new StoryNode
                {
                    nodeId = "finale_comedic",
                    displayName = "喜剧终章",
                    description = "笑声不断",
                    requiredLightChoice = LightColor.Yellow,
                    requiredAction = PuppetActionType.Bow,
                    branch = StoryBranch.Comedic,
                    nextNodeIds = new List<string>(),
                    minEmotionToUnlock = AudienceEmotion.Bored,
                    isCheckpoint = true
                },
                new StoryNode
                {
                    nodeId = "finale_mystery",
                    displayName = "悬疑终章",
                    description = "真相大白",
                    requiredLightChoice = LightColor.Purple,
                    requiredAction = PuppetActionType.Bow,
                    branch = StoryBranch.Mysterious,
                    nextNodeIds = new List<string>(),
                    minEmotionToUnlock = AudienceEmotion.Angry,
                    isCheckpoint = true
                }
            };

            var nodesField = typeof(StoryScriptData).GetField("nodes",
                System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            nodesField?.SetValue(_storyScript, nodes);

            var startField = typeof(StoryScriptData).GetField("startNodeId",
                System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            startField?.SetValue(_storyScript, "act1_intro");
        }

        private void RegisterPuppets()
        {
            for (int i = 0; i < 5; i++)
            {
                var puppetGo = new GameObject($"Puppet_{i}");
                puppetGo.transform.SetParent(transform);
                puppetGo.transform.position = new Vector3((i - 2) * 2.5f, 0f, 0f);

                var zoneColor = (LightColor)(i % 6);
                var isCritical = (i == 1);
                _stageMechanism.RegisterPuppet(i, puppetGo.transform, zoneColor, isCritical);
            }

            _stageMechanism.CurrentStageLight = LightColor.White;
        }

        private void StartDemoSession(GameMode mode)
        {
            _currentMode = mode;
            _sessionStarted = true;

            _titleText.gameObject.SetActive(false);
            _calibrationPanel.SetActive(false);
            _resultPanel.SetActive(false);
            _hudPanel.SetActive(true);

            var beatMap = GenerateDemoBeatMap();
            _beatManager.SetBeatMap(beatMap);

            _session.StartSession(_storyScript, mode);
        }

        private List<BeatInfo> GenerateDemoBeatMap()
        {
            var beats = new List<BeatInfo>();
            double msPerBeat = 60000.0 / 120.0;
            double startTime = 3000.0;
            var colors = new LightColor[] { LightColor.Red, LightColor.Blue, LightColor.Green, LightColor.Yellow, LightColor.Purple, LightColor.White };
            var actions = new PuppetActionType[] { PuppetActionType.Bow, PuppetActionType.Dance, PuppetActionType.Spin, PuppetActionType.Jump, PuppetActionType.Wave };

            for (int i = 0; i < 32; i++)
            {
                beats.Add(new BeatInfo
                {
                    timeMs = startTime + i * msPerBeat,
                    expectedColor = colors[i % colors.Length],
                    actionType = actions[i % actions.Length]
                });
            }

            return beats;
        }

        private void ShowTitleScreen()
        {
            _sessionStarted = false;
            _hudPanel.SetActive(false);
            _resultPanel.SetActive(false);
            _calibrationPanel.SetActive(false);

            _titleText.gameObject.SetActive(true);
            _titleText.text = "🎭 木偶剧场灯光节奏 🎭\n\n按 Enter 开始正式演出\n按 P 开始练习模式\n按 C 进行延迟校准\n\n键盘: Q红 W蓝 E绿 R黄 T紫 Space白";
        }

        private void ToggleCalibrationPanel()
        {
            bool show = !_calibrationPanel.activeSelf;
            _calibrationPanel.SetActive(show);

            if (show)
            {
                _calibrationStatusText.text = "按 C 关闭校准页\n按 S 开始校准\n听到节拍声后按空格对齐";
            }
            else
            {
                _calibrationPage.StopCalibration();
            }
        }

        private void UpdateHUD()
        {
            if (_beatIndicatorText != null)
            {
                IReadOnlyList<BeatInfo> map = _beatManager.BeatMap;
                double pos = _beatManager.SongPositionMs;
                string beatInfo = "---";
                for (int i = 0; i < map.Count; i++)
                {
                    if (!_beatManager.IsBeatJudged(i))
                    {
                        double diff = map[i].timeMs - pos;
                        if (diff > -200 && diff < 600)
                        {
                            beatInfo = $"♪ {map[i].expectedColor} {diff:+0;-0}ms";
                            break;
                        }
                    }
                }
                _beatIndicatorText.text = beatInfo;
            }

            if (_comboText != null)
            {
                _comboText.text = $"Combo: {_beatManager.CurrentCombo}";
            }

            if (_lightColorText != null)
            {
                _lightColorText.text = $"灯光: {_lightStateSystem.CurrentColor}";
            }

            if (_audienceText != null)
            {
                _audienceText.text = $"观众: {_storyNodeSystem.CurrentAudienceEmotion}";
            }

            var node = _storyNodeSystem.GetCurrentNode();
            if (_storyNodeText != null && node != null)
            {
                _storyNodeText.text = $"剧情: {node.displayName} (需要{node.requiredLightChoice})";
            }

            if (_promptText != null && _sessionStarted)
            {
                _promptText.text = "Q红 W蓝 E绿 R黄 T紫 Space白 | Esc暂停";
            }

            if (Input.GetKeyDown(KeyCode.Escape) && _sessionStarted)
            {
                if (_session.IsPaused)
                    _session.ResumeSession();
                else
                    _session.PauseSession();
            }
        }

        private void LayoutHudTexts()
        {
            SetTextAnchor(_beatIndicatorText, new Vector2(0.3f, 0.5f), new Vector2(0.7f, 0.9f));
            SetTextAnchor(_comboText, new Vector2(0.02f, 0.6f), new Vector2(0.3f, 0.9f));
            SetTextAnchor(_gradeText, new Vector2(0.7f, 0.6f), new Vector2(0.98f, 0.9f));
            SetTextAnchor(_audienceText, new Vector2(0.02f, 0.3f), new Vector2(0.4f, 0.6f));
            SetTextAnchor(_storyNodeText, new Vector2(0.02f, 0.0f), new Vector2(0.4f, 0.3f));
            SetTextAnchor(_lightColorText, new Vector2(0.3f, 0.0f), new Vector2(0.7f, 0.4f));
            SetTextAnchor(_promptText, new Vector2(0.1f, 0.0f), new Vector2(0.9f, 0.3f));
        }

        private static void SetTextAnchor(Text text, Vector2 min, Vector2 max)
        {
            if (text == null) return;
            var rt = text.GetComponent<RectTransform>();
            rt.anchorMin = min;
            rt.anchorMax = max;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
        }

        private GameObject CreatePanel(string name, Color bgColor)
        {
            var go = new GameObject(name);
            var img = go.AddComponent<Image>();
            img.color = bgColor;
            go.AddComponent<CanvasGroup>();
            return go;
        }

        private Text CreateHudText(string suffix, int size, TextAnchor anchor)
        {
            var go = new GameObject($"Hud_{suffix}");
            go.transform.SetParent(_hudPanel.transform, false);
            var text = go.AddComponent<Text>();
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            text.fontSize = size;
            text.color = Color.white;
            text.alignment = anchor;
            return text;
        }

        private Text CreateChildText(GameObject parent, string name, int size, TextAnchor anchor)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent.transform, false);
            var text = go.AddComponent<Text>();
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            text.fontSize = size;
            text.color = Color.white;
            text.alignment = anchor;
            return text;
        }

        private Button CreateButton(string name, string label)
        {
            var go = new GameObject(name);
            var img = go.AddComponent<Image>();
            img.color = new Color(0.3f, 0.3f, 0.4f);
            var btn = go.AddComponent<Button>();
            var text = go.AddComponent<Text>();
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            text.fontSize = 16;
            text.color = Color.white;
            text.text = label;
            text.alignment = TextAnchor.MiddleCenter;
            return btn;
        }

        private static void SetField(System.Type type, object target, string fieldName, object value)
        {
            var field = type.GetField(fieldName,
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            field?.SetValue(target, value);
        }
    }
}
