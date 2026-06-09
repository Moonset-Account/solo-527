using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace PixelPlantLab.Bootstrap
{
    [DefaultExecutionOrder(-1000)]
    public class SceneBootstrap : MonoBehaviour
    {
        public static SceneBootstrap Instance { get; private set; }

        [Tooltip("Unity运行时是否自动构建整个UI（场景直接启动用true；RuntimeInitialize兜底用true）")]
        public bool AutoBuildOnStart = true;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void AutoBootstrap()
        {
            if (FindObjectOfType<SceneBootstrap>() != null) return;
            var go = new GameObject("[SceneBootstrap]");
            var bs = go.AddComponent<SceneBootstrap>();
            bs.AutoBuildOnStart = true;
        }

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            if (AutoBuildOnStart)
            {
                BuildManagers();
                BuildEventSystem();
                BuildCanvasAndUI();
            }
        }

        // =====================================================
        //  Managers
        // =====================================================
        private DexManager _dexManager;
        private ExperimentLogManager _logManager;
        private ResourceManager _resourceManager;
        private QuestManager _questManager;
        private DailyChallengeManager _challengeManager;
        private GameManager _gameManager;

        private void BuildManagers()
        {
            var go = new GameObject("[Managers]");
            DontDestroyOnLoad(go);

            _dexManager = go.AddComponent<DexManager>();
            _logManager = go.AddComponent<ExperimentLogManager>();
            _resourceManager = go.AddComponent<ResourceManager>();
            _questManager = go.AddComponent<QuestManager>();
            _challengeManager = go.AddComponent<DailyChallengeManager>();
            _gameManager = go.AddComponent<GameManager>();

            _dexManager.InitializeSingleton();
            _logManager.InitializeSingleton();
            _resourceManager.InitializeSingleton();
            _questManager.InitializeSingleton();
            _challengeManager.InitializeSingleton();
            _gameManager.InitializeSingleton();
        }

        // =====================================================
        //  EventSystem
        // =====================================================
        private void BuildEventSystem()
        {
            if (FindObjectOfType<EventSystem>() != null) return;
            var es = new GameObject("EventSystem");
            es.AddComponent<EventSystem>();
            es.AddComponent<StandaloneInputModule>();
        }

        // =====================================================
        //  Canvas + Root UI
        // =====================================================
        private Canvas _rootCanvas;
        private RectTransform _canvasRT;

        private void BuildCanvasAndUI()
        {
            var canvasGO = new GameObject("UICanvas");
            DontDestroyOnLoad(canvasGO);
            _rootCanvas = canvasGO.AddComponent<Canvas>();
            _rootCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _rootCanvas.sortingOrder = 10;
            var scaler = canvasGO.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1600, 900);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGO.AddComponent<GraphicRaycaster>();
            _canvasRT = canvasGO.GetComponent<RectTransform>();

            BuildBackgroundPanel(_canvasRT);
            BuildHUD(_canvasRT);

            var leftColumn = BuildPanel(_canvasRT, "LeftColumn", new Vector2(0, 0), new Vector2(360, 900), new Color(0.12f, 0.12f, 0.15f, 0.95f));
            var centerColumn = BuildPanel(_canvasRT, "CenterColumn", new Vector2(360, 0), new Vector2(880, 900), new Color(0.08f, 0.08f, 0.1f, 0.9f));
            var rightColumn = BuildPanel(_canvasRT, "RightColumn", new Vector2(1240, 0), new Vector2(360, 900), new Color(0.12f, 0.12f, 0.15f, 0.95f));

            BuildParameterPanelUI(leftColumn);
            BuildSampleDisplayUI(centerColumn);
            BuildToastUI(centerColumn);
            BuildQuestPanelUI(rightColumn);

            BuildDexPopup(_canvasRT);
            BuildLogPopup(_canvasRT);
        }

        // =====================================================
        //  Background
        // =====================================================
        private void BuildBackgroundPanel(RectTransform parent)
        {
            var bg = CreateUIObject("Background", parent);
            Stretch(bg);
            var img = bg.gameObject.AddComponent<Image>();
            img.color = new Color(0.05f, 0.06f, 0.08f, 1f);
            img.rectTransform.SetAsFirstSibling();
        }

        // =====================================================
        //  HUD (Top Bar)
        // =====================================================
        private Text _hudSeeds, _hudNutrients, _hudCredits, _hudDex, _hudQuestHint;

        private void BuildHUD(RectTransform parent)
        {
            var hud = CreateUIObject("TopHUD", parent);
            SetAnchors(hud, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -40), new Vector2(0, 0));
            var hudImg = hud.gameObject.AddComponent<Image>();
            hudImg.color = new Color(0.05f, 0.05f, 0.07f, 0.95f);

            _hudSeeds = CreateText(hud, "Seeds: 20", 18, TextAnchor.MiddleLeft);
            SetAnchors(_hudSeeds.rectTransform, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(20, -200), new Vector2(180, 0));

            _hudNutrients = CreateText(hud, "Nutrients: 15", 18, TextAnchor.MiddleLeft);
            SetAnchors(_hudNutrients.rectTransform, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(200, -200), new Vector2(380, 0));

            _hudCredits = CreateText(hud, "Credits: 100", 18, TextAnchor.MiddleLeft);
            SetAnchors(_hudCredits.rectTransform, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(400, -200), new Vector2(580, 0));

            _hudDex = CreateText(hud, "Dex: 0/25", 18, TextAnchor.MiddleLeft);
            SetAnchors(_hudDex.rectTransform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-100, -200), new Vector2(100, 0));

            _hudQuestHint = CreateText(hud, "[教程 1] 初识实验", 18, TextAnchor.MiddleRight);
            SetAnchors(_hudQuestHint.rectTransform, new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-500, -200), new Vector2(-20, 0));
            _hudQuestHint.color = new Color(1f, 1f, 0.6f);

            // 将HUD引用绑定到GameManager
            _gameManager.HudSeedsText = _hudSeeds;
            _gameManager.HudNutrientsText = _hudNutrients;
            _gameManager.HudCreditsText = _hudCredits;
            _gameManager.HudDexProgressText = _hudDex;
            _gameManager.HudQuestHintText = _hudQuestHint;
        }

        // =====================================================
        //  ParameterPanel (Left Column)
        // =====================================================
        private ParameterSlider _lightSlider, _waterSlider, _nSlider, _pSlider, _kSlider, _timeSlider;
        private Button _startBtn, _abortBtn, _randomBtn, _resetBtn;
        private Text _failureRiskText, _rareChanceText, _recipeRunCountText;
        private RectTransform _probabilityPanel;
        private GameObject _probabilityItemPrefab;

        private void BuildParameterPanelUI(RectTransform parent)
        {
            var header = CreateText(parent, "⚙ 实验参数", 24, TextAnchor.UpperLeft);
            SetAnchors(header.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(16, -16), new Vector2(-16, -48));

            _lightSlider = BuildSlider(parent, "光照 Light", 0.55f, 50);
            _waterSlider = BuildSlider(parent, "水分 Water", 0.5f, 150);
            _nSlider = BuildSlider(parent, "氮 Nitrogen", 0.33f, 250);
            _pSlider = BuildSlider(parent, "磷 Phosphorus", 0.33f, 350);
            _kSlider = BuildSlider(parent, "钾 Potassium", 0.34f, 450);
            _timeSlider = BuildSlider(parent, "培养时间 Time", 0.65f, 550);

            // 风险预估
            var riskPanel = BuildPanel(parent, "RiskPanel", new Vector2(10, 660), new Vector2(340, 110), new Color(0.08f, 0.1f, 0.12f, 1f));
            _failureRiskText = CreateText(riskPanel, "失败风险: 15%", 16, TextAnchor.UpperLeft);
            SetAnchors(_failureRiskText.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(10, -10), new Vector2(-10, -32));
            _rareChanceText = CreateText(riskPanel, "稀有几率: 18%", 16, TextAnchor.UpperLeft);
            SetAnchors(_rareChanceText.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(10, -34), new Vector2(-10, -56));
            _recipeRunCountText = CreateText(riskPanel, "同配方实验次数: 0", 14, TextAnchor.UpperLeft);
            _recipeRunCountText.color = new Color(0.7f, 0.8f, 1f);
            SetAnchors(_recipeRunCountText.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(10, -58), new Vector2(-10, -80));

            // 概率面板
            var probHeader = CreateText(parent, "📊 同配方历史概率 (≥2次后显示)", 14, TextAnchor.UpperLeft);
            SetAnchors(probHeader.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(16, -795), new Vector2(-16, -815));
            probHeader.color = new Color(0.7f, 0.85f, 1f);

            _probabilityPanel = CreateUIObject("ProbabilityPanel", parent);
            SetAnchors(_probabilityPanel, new Vector2(0, 0), new Vector2(1, 0), new Vector2(10, 10), new Vector2(-10, 90));
            var probImg = _probabilityPanel.gameObject.AddComponent<Image>();
            probImg.color = new Color(0.06f, 0.07f, 0.1f, 1f);

            _probabilityItemPrefab = BuildProbabilityItemPrefab();

            // 按钮区
            _startBtn = BuildButton(parent, "▶ 开始实验", new Vector2(10, 5), new Vector2(170, 45), new Color(0.2f, 0.55f, 0.3f, 1f));
            _abortBtn = BuildButton(parent, "■ 终止实验", new Vector2(180, 5), new Vector2(170, 45), new Color(0.55f, 0.2f, 0.2f, 1f));
            _abortBtn.gameObject.SetActive(false);
            _randomBtn = BuildButton(parent, "🎲 随机参数", new Vector2(10, 600), new Vector2(165, 40), new Color(0.3f, 0.35f, 0.55f, 1f));
            _resetBtn = BuildButton(parent, "↺ 重置参数", new Vector2(185, 600), new Vector2(165, 40), new Color(0.35f, 0.3f, 0.3f, 1f));

            // 打开图鉴 / 日志按钮
            var dexBtn = BuildButton(parent, "📖 图鉴", new Vector2(10, 840), new Vector2(110, 40), new Color(0.25f, 0.45f, 0.35f, 1f));
            var logBtn = BuildButton(parent, "📝 日志", new Vector2(125, 840), new Vector2(110, 40), new Color(0.35f, 0.35f, 0.5f, 1f));
            var questBtn = BuildButton(parent, "🎯 任务", new Vector2(240, 840), new Vector2(110, 40), new Color(0.45f, 0.35f, 0.25f, 1f));

            dexBtn.onClick.AddListener(() => _dexPanelRoot.gameObject.SetActive(true));
            logBtn.onClick.AddListener(() => _logPanelRoot.gameObject.SetActive(true));
            questBtn.onClick.AddListener(() => _questPanelRoot.gameObject.SetActive(true));

            // 绑定ParameterPanel组件引用
            var ppGO = new GameObject("ParameterPanelLogic");
            ppGO.transform.SetParent(parent, false);
            var parameterPanel = ppGO.AddComponent<ParameterPanel>();
            parameterPanel.LightSlider = _lightSlider;
            parameterPanel.WaterSlider = _waterSlider;
            parameterPanel.NitrogenSlider = _nSlider;
            parameterPanel.PhosphorusSlider = _pSlider;
            parameterPanel.PotassiumSlider = _kSlider;
            parameterPanel.TimeSlider = _timeSlider;
            parameterPanel.StartExperimentButton = _startBtn;
            parameterPanel.AbortExperimentButton = _abortBtn;
            parameterPanel.RandomizeButton = _randomBtn;
            parameterPanel.ResetButton = _resetBtn;
            parameterPanel.FailureRiskText = _failureRiskText;
            parameterPanel.RareChanceText = _rareChanceText;
            parameterPanel.RecipeRunCountText = _recipeRunCountText;
            parameterPanel.ProbabilityPanel = _probabilityPanel;
            parameterPanel.ProbabilityItemPrefab = _probabilityItemPrefab;
            _gameManager.ParameterPanel = parameterPanel;

            // 绑定DexPanel打开按钮
            if (_dexPanel != null) _dexPanel.OpenButton = dexBtn;
            if (_expLogPanel != null) _expLogPanel.OpenButton = logBtn;
        }

        private ParameterSlider BuildSlider(RectTransform parent, string label, float defaultValue, float yOffset)
        {
            var go = CreateUIObject($"Slider_{label}", parent);
            SetAnchors(go, new Vector2(0, 1), new Vector2(1, 1), new Vector2(16, -yOffset), new Vector2(-16, -(yOffset + 80)));

            var labelText = CreateText(go, label, 16, TextAnchor.UpperLeft);
            SetAnchors(labelText.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, 0), new Vector2(0, -24));

            var sliderGO = CreateUIObject("Slider", go);
            SetAnchors(sliderGO, new Vector2(0, 0.5f), new Vector2(1, 0.5f), new Vector2(0, -6), new Vector2(0, 14));
            var slider = sliderGO.gameObject.AddComponent<Slider>();
            slider.minValue = 0f;
            slider.maxValue = 1f;
            slider.value = defaultValue;

            var bg = CreateUIObject("Background", sliderGO.transform as RectTransform);
            Stretch(bg);
            var bgImg = bg.gameObject.AddComponent<Image>();
            bgImg.color = new Color(0.2f, 0.2f, 0.25f, 1f);
            bgImg.rectTransform.sizeDelta = new Vector2(0, 8);

            var fillArea = CreateUIObject("Fill Area", sliderGO.transform as RectTransform);
            Stretch(fillArea);
            var fill = CreateUIObject("Fill", fillArea);
            Stretch(fill);
            var fillImg = fill.gameObject.AddComponent<Image>();
            fillImg.color = new Color(0.4f, 0.7f, 0.5f, 1f);
            fillImg.rectTransform.sizeDelta = new Vector2(0, 8);

            var handleArea = CreateUIObject("Handle Slide Area", sliderGO.transform as RectTransform);
            Stretch(handleArea);
            var handle = CreateUIObject("Handle", handleArea);
            SetAnchors(handle, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-10, -12), new Vector2(10, 12));
            var handleImg = handle.gameObject.AddComponent<Image>();
            handleImg.color = new Color(0.85f, 0.9f, 0.95f, 1f);

            slider.fillRect = fill;
            slider.handleRect = handle;
            slider.targetGraphic = handleImg;

            var valueText = CreateText(go, defaultValue.ToString("F2"), 14, TextAnchor.UpperRight);
            valueText.color = new Color(0.8f, 0.9f, 1f);
            SetAnchors(valueText.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -24), new Vector2(0, -44));

            var paramSlider = go.gameObject.AddComponent<ParameterSlider>();
            paramSlider.SliderComponent = slider;
            paramSlider.LabelText = labelText;
            paramSlider.ValueText = valueText;
            paramSlider.ParameterLabel = label;
            paramSlider.ParameterFormat = "F2";
            return paramSlider;
        }

        private GameObject BuildProbabilityItemPrefab()
        {
            var prefab = new GameObject("ProbabilityItem");
            prefab.SetActive(false);
            DontDestroyOnLoad(prefab);

            var rt = prefab.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(300, 30);
            var img = prefab.AddComponent<Image>();
            img.color = new Color(0.12f, 0.14f, 0.18f, 1f);

            var nameT = CreateText(rt, "", 14, TextAnchor.MiddleLeft);
            SetAnchors(nameT.rectTransform, new Vector2(0, 0), new Vector2(0.5f, 1), new Vector2(6, 0), new Vector2(-6, 0));
            nameT.gameObject.name = "NameText";

            var probT = CreateText(rt, "", 14, TextAnchor.MiddleRight);
            SetAnchors(probT.rectTransform, new Vector2(0.5f, 0), new Vector2(1, 1), new Vector2(6, 0), new Vector2(-6, 0));
            probT.gameObject.name = "ProbText";

            return prefab;
        }

        // =====================================================
        //  SampleDisplay (Center Column)
        // =====================================================
        private Slider _progressBar;
        private Text _statusTitle, _statusDetail, _timerText, _progressText;
        private Text _resultName, _resultDesc, _resultRarity, _resultTraits;
        private Image _resultImage;
        private GameObject _resultPanel, _sampleIconRoot;

        private void BuildSampleDisplayUI(RectTransform parent)
        {
            var title = CreateText(parent, "🌱 像素植物实验室", 28, TextAnchor.UpperCenter);
            SetAnchors(title.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -16), new Vector2(0, -52));

            // 样本显示区
            var sampleArea = BuildPanel(parent, "SampleArea", new Vector2(40, 420), new Vector2(800, 420), new Color(0.04f, 0.06f, 0.05f, 1f));
            _sampleIconRoot = new GameObject("SampleIconRoot");
            var sir = _sampleIconRoot.AddComponent<RectTransform>();
            sir.SetParent(sampleArea, false);
            SetAnchors(sir, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-80, -80), new Vector2(80, 80));
            var sampleImg = _sampleIconRoot.AddComponent<Image>();
            sampleImg.color = new Color(0.3f, 0.6f, 0.35f, 1f);
            var placeholderTex = CreateText(sir, "🌿", 80, TextAnchor.MiddleCenter);
            Stretch(placeholderTex.rectTransform);
            placeholderTex.gameObject.name = "SamplePlaceholder";

            // 结果面板
            _resultPanel = CreateUIObject("ResultPanel", sampleArea).gameObject;
            Stretch(_resultPanel.GetComponent<RectTransform>());
            _resultPanel.SetActive(false);
            var rImg = _resultPanel.AddComponent<Image>();
            rImg.color = new Color(0.04f, 0.05f, 0.07f, 0.95f);
            var rRT = _resultPanel.GetComponent<RectTransform>();

            _resultImage = CreateUIObject("ResultPlantImage", rRT).gameObject.AddComponent<Image>();
            SetAnchors(_resultImage.rectTransform, new Vector2(0.5f, 0.65f), new Vector2(0.5f, 0.65f), new Vector2(-70, -70), new Vector2(70, 70));
            _resultImage.color = new Color(0.4f, 0.75f, 0.45f, 1f);

            _resultName = CreateText(rRT, "", 24, TextAnchor.MiddleCenter);
            SetAnchors(_resultName.rectTransform, new Vector2(0, 0.5f), new Vector2(1, 0.5f), new Vector2(20, 20), new Vector2(-20, 52));

            _resultRarity = CreateText(rRT, "", 18, TextAnchor.MiddleCenter);
            SetAnchors(_resultRarity.rectTransform, new Vector2(0, 0.5f), new Vector2(1, 0.5f), new Vector2(20, -6), new Vector2(-20, 18));

            _resultDesc = CreateText(rRT, "", 16, TextAnchor.MiddleCenter);
            _resultDesc.color = new Color(0.8f, 0.85f, 0.9f);
            SetAnchors(_resultDesc.rectTransform, new Vector2(0, 0), new Vector2(1, 0.2f), new Vector2(20, 80), new Vector2(-20, 0));

            _resultTraits = CreateText(rRT, "", 14, TextAnchor.MiddleCenter);
            _resultTraits.color = new Color(0.6f, 0.8f, 1f);
            SetAnchors(_resultTraits.rectTransform, new Vector2(0, 0), new Vector2(1, 0.2f), new Vector2(20, 30), new Vector2(-20, 60));

            // 状态区
            _statusTitle = CreateText(parent, "等待开始实验", 22, TextAnchor.UpperCenter);
            _statusTitle.color = new Color(1f, 1f, 0.8f);
            SetAnchors(_statusTitle.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, -380), new Vector2(-20, -410));

            _statusDetail = CreateText(parent, "调整参数后点击开始实验", 16, TextAnchor.UpperCenter);
            _statusDetail.color = new Color(0.75f, 0.8f, 0.85f);
            SetAnchors(_statusDetail.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, -410), new Vector2(-20, -432));

            // 进度条
            var progGO = CreateUIObject("ProgressBar", parent);
            SetAnchors(progGO, new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(-350, -350), new Vector2(350, -320));
            var progBg = progGO.gameObject.AddComponent<Image>();
            progBg.color = new Color(0.1f, 0.12f, 0.14f, 1f);
            var progFillArea = CreateUIObject("FillArea", progGO);
            Stretch(progFillArea);
            var progFill = CreateUIObject("Fill", progFillArea);
            Stretch(progFill);
            var pfi = progFill.gameObject.AddComponent<Image>();
            pfi.color = new Color(0.3f, 0.75f, 0.4f, 1f);
            _progressBar = progGO.gameObject.AddComponent<Slider>();
            _progressBar.fillRect = progFill;
            _progressBar.handleRect = null;
            _progressBar.interactable = false;
            _progressBar.value = 0f;

            _progressText = CreateText(parent, "0%", 16, TextAnchor.UpperCenter);
            SetAnchors(_progressText.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -332), new Vector2(0, -352));

            _timerText = CreateText(parent, "剩余时间: --s", 16, TextAnchor.UpperCenter);
            _timerText.color = new Color(0.6f, 0.8f, 1f);
            SetAnchors(_timerText.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -445), new Vector2(0, -465));

            // 绑定SampleDisplay组件
            var sdGO = new GameObject("SampleDisplayLogic");
            sdGO.transform.SetParent(parent, false);
            var sampleDisplay = sdGO.AddComponent<SampleDisplay>();
            sampleDisplay.StatusTitleText = _statusTitle;
            sampleDisplay.StatusDetailText = _statusDetail;
            sampleDisplay.TimerText = _timerText;
            sampleDisplay.ProgressText = _progressText;
            sampleDisplay.ProgressBar = _progressBar;
            sampleDisplay.ResultPlantImage = _resultImage;
            sampleDisplay.ResultPlantNameText = _resultName;
            sampleDisplay.ResultPlantDescText = _resultDesc;
            sampleDisplay.ResultRarityText = _resultRarity;
            sampleDisplay.ResultTraitsText = _resultTraits;
            sampleDisplay.ResultPanel = _resultPanel;
            sampleDisplay.SampleIconRoot = _sampleIconRoot;
            _gameManager.SampleDisplay = sampleDisplay;
        }

        // =====================================================
        //  Toast
        // =====================================================
        private GameObject _toastRoot;
        private Text _toastText;
        private Image _toastBg;

        private void BuildToastUI(RectTransform parent)
        {
            _toastRoot = CreateUIObject("Toast", parent).gameObject;
            SetAnchors(_toastRoot.GetComponent<RectTransform>(), new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(-350, -520), new Vector2(350, -480));
            _toastBg = _toastRoot.AddComponent<Image>();
            _toastBg.color = new Color(0.15f, 0.15f, 0.15f, 0.95f);
            _toastText = CreateText(_toastRoot.GetComponent<RectTransform>(), "", 18, TextAnchor.MiddleCenter);
            Stretch(_toastText.rectTransform);
            _toastRoot.SetActive(false);

            _gameManager.ToastRoot = _toastRoot;
            _gameManager.ToastText = _toastText;
            _gameManager.ToastBg = _toastBg;
            _gameManager.ToastNormalColor = new Color(0.15f, 0.15f, 0.15f, 0.95f);
            _gameManager.ToastSuccessColor = new Color(0.15f, 0.4f, 0.15f, 0.95f);
            _gameManager.ToastWarnColor = new Color(0.4f, 0.25f, 0.15f, 0.95f);
            _gameManager.ToastErrorColor = new Color(0.4f, 0.15f, 0.15f, 0.95f);
        }

        // =====================================================
        //  Quest Panel (Right Column)
        // =====================================================
        private RectTransform _questPanelRoot;
        private RectTransform _tutorialListContainer;
        private RectTransform _dailyListContainer;
        private GameObject _questItemPrefab;
        private GameObject _challengeItemPrefab;
        private QuestAndChallengePanel _questPanel;
        private DexPanel _dexPanel;
        private ExperimentLogPanel _expLogPanel;
        private RectTransform _dexPanelRoot;
        private RectTransform _logPanelRoot;

        private void BuildQuestPanelUI(RectTransform parent)
        {
            _questPanelRoot = parent;

            var title = CreateText(parent, "🎯 任务 & 资源", 22, TextAnchor.UpperLeft);
            SetAnchors(title.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(16, -16), new Vector2(-16, -44));

            var tutHeader = CreateText(parent, "📚 教学任务", 18, TextAnchor.UpperLeft);
            SetAnchors(tutHeader.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(16, -54), new Vector2(-16, -76));

            _tutorialListContainer = CreateUIObject("TutorialList", parent);
            SetAnchors(_tutorialListContainer, new Vector2(0, 1), new Vector2(1, 1), new Vector2(10, -80), new Vector2(-10, -400));
            var tlImg = _tutorialListContainer.gameObject.AddComponent<Image>();
            tlImg.color = new Color(0.07f, 0.08f, 0.1f, 1f);

            var dailyHeader = CreateText(parent, "📅 每日挑战", 18, TextAnchor.UpperLeft);
            SetAnchors(dailyHeader.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(16, -410), new Vector2(-16, -432));

            _dailyListContainer = CreateUIObject("DailyList", parent);
            SetAnchors(_dailyListContainer, new Vector2(0, 1), new Vector2(1, 1), new Vector2(10, -436), new Vector2(-10, -710));
            var dlImg = _dailyListContainer.gameObject.AddComponent<Image>();
            dlImg.color = new Color(0.07f, 0.08f, 0.1f, 1f);

            var resHeader = CreateText(parent, "💰 资源总览", 18, TextAnchor.UpperLeft);
            SetAnchors(resHeader.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(16, -720), new Vector2(-16, -742));

            var resRT = CreateUIObject("ResourcesPanel", parent);
            SetAnchors(resRT, new Vector2(0, 0), new Vector2(1, 0), new Vector2(10, 10), new Vector2(-10, 240));
            var rImg = resRT.gameObject.AddComponent<Image>();
            rImg.color = new Color(0.07f, 0.08f, 0.1f, 1f);
            var seedsRes = CreateText(resRT, "种子: 20", 18, TextAnchor.UpperLeft);
            SetAnchors(seedsRes.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(16, -16), new Vector2(-16, -40));
            var nutriRes = CreateText(resRT, "营养素: 15", 18, TextAnchor.UpperLeft);
            SetAnchors(nutriRes.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(16, -44), new Vector2(-16, -68));
            var credRes = CreateText(resRT, "积分: 100", 18, TextAnchor.UpperLeft);
            SetAnchors(credRes.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(16, -72), new Vector2(-16, -96));

            _questItemPrefab = BuildQuestItemPrefab();
            _challengeItemPrefab = BuildChallengeItemPrefab();

            // 绑定QuestAndChallengePanel组件
            var qcGO = new GameObject("QuestAndChallengeLogic");
            qcGO.transform.SetParent(parent, false);
            var qcPanel = qcGO.AddComponent<QuestAndChallengePanel>();
            qcPanel.PanelRoot = parent.gameObject;
            qcPanel.CloseButton = null;
            qcPanel.OpenButton = null;
            qcPanel.TutorialToggle = null;
            qcPanel.DailyToggle = null;
            qcPanel.TutorialListContainer = _tutorialListContainer;
            qcPanel.DailyListContainer = _dailyListContainer;
            qcPanel.QuestItemPrefab = _questItemPrefab;
            qcPanel.ChallengeItemPrefab = _challengeItemPrefab;
            qcPanel.DailyRefreshText = dailyHeader;
            qcPanel.SeedsText = seedsRes;
            qcPanel.NutrientsText = nutriRes;
            qcPanel.CreditsText = credRes;
            qcPanel.NewQuestNotice = _toastRoot;
            qcPanel.NoticeText = _toastText;
            _questPanel = qcPanel;
            _gameManager.QuestAndChallengePanel = qcPanel;

            // 因为右栏是常驻，强制刷新一次（注意：不能假造实验结果，只刷新UI显示）
            Invoke(nameof(ForceRefreshPanels), 0.1f);
        }

        private void ForceRefreshPanels()
        {
            _questPanel?.ForceFullRefresh();
        }

        private GameObject BuildQuestItemPrefab()
        {
            var prefab = new GameObject("QuestItemPrefab");
            prefab.SetActive(false);
            DontDestroyOnLoad(prefab);
            var rt = prefab.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(320, 130);
            var img = prefab.AddComponent<Image>();
            img.color = new Color(0.1f, 0.12f, 0.15f, 1f);

            var title = CreateText(rt, "", 16, TextAnchor.UpperLeft);
            title.gameObject.name = "TitleText";
            SetAnchors(title.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(8, -6), new Vector2(-8, -26));

            var desc = CreateText(rt, "", 12, TextAnchor.UpperLeft);
            desc.gameObject.name = "DescText";
            desc.color = new Color(0.75f, 0.8f, 0.85f);
            SetAnchors(desc.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(8, -28), new Vector2(-8, -50));

            var obj = CreateText(rt, "", 12, TextAnchor.UpperLeft);
            obj.gameObject.name = "ObjText";
            obj.color = new Color(0.7f, 0.9f, 1f);
            SetAnchors(obj.rectTransform, new Vector2(0, 1), new Vector2(1, 0), new Vector2(8, 48), new Vector2(-8, 18));

            var reward = CreateText(rt, "", 12, TextAnchor.LowerLeft);
            reward.gameObject.name = "RewardText";
            reward.color = new Color(1f, 0.9f, 0.5f);
            SetAnchors(reward.rectTransform, new Vector2(0, 0), new Vector2(1, 0), new Vector2(8, 2), new Vector2(-8, 22));

            var claimBtnGO = CreateUIObject("ClaimBtn", rt);
            SetAnchors(claimBtnGO, new Vector2(1, 0), new Vector2(1, 0), new Vector2(-80, 2), new Vector2(-8, 28));
            var claimBtn = claimBtnGO.gameObject.AddComponent<Button>();
            var claimImg = claimBtnGO.gameObject.AddComponent<Image>();
            claimImg.color = new Color(0.25f, 0.5f, 0.3f, 1f);
            var claimTxt = CreateText(claimBtnGO, "领取", 14, TextAnchor.MiddleCenter);
            Stretch(claimTxt.rectTransform);
            return prefab;
        }

        private GameObject BuildChallengeItemPrefab()
        {
            var prefab = BuildQuestItemPrefab();
            prefab.name = "ChallengeItemPrefab";
            return prefab;
        }

        // =====================================================
        //  Dex Popup
        // =====================================================
        private void BuildDexPopup(RectTransform parent)
        {
            _dexPanelRoot = CreatePopupPanel(parent, "DexPanel", "📖 图鉴", out var closeBtn, out var container);

            // 筛选区（扩大高度以容纳2个Dropdown）
            var filterArea = CreateUIObject("FilterArea", container);
            SetAnchors(filterArea, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -10), new Vector2(0, -130));

            // 第1行：标签
            var rareLabel = CreateText(filterArea, "稀有度:", 14, TextAnchor.MiddleLeft);
            SetAnchors(rareLabel.rectTransform, new Vector2(0, 1), new Vector2(0, 1), new Vector2(10, -10), new Vector2(90, -40));
            var traitLabel = CreateText(filterArea, "特征:", 14, TextAnchor.MiddleLeft);
            SetAnchors(traitLabel.rectTransform, new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(10, -10), new Vector2(85, -40));

            // 第1行：Dropdown（真正的可交互控件，DexPanel自己会Init选项，但我们也预置）
            var rarityOpts = new List<string> { "全部稀有度", "失败", "普通", "稀有", "传说" };
            var rarityDD = CreateDropdown(filterArea, new Vector2(80, -40), new Vector2(320, 30), rarityOpts);
            rarityDD.name = "RarityFilterDropdown";

            // 特征选项
            var traitOpts = new List<string> { "全部特征" };
            foreach (MutationTrait t in System.Enum.GetValues(typeof(MutationTrait)))
                if (t != MutationTrait.None) traitOpts.Add(TraitDisplayName(t));
            var traitDD = CreateDropdown(filterArea, new Vector2(490, -40), new Vector2(360, 30), traitOpts);
            traitDD.name = "TraitFilterDropdown";

            // 第2行：进度 + 清除按钮
            var dexProgress = CreateText(filterArea, "", 14, TextAnchor.MiddleLeft);
            dexProgress.color = new Color(0.7f, 0.85f, 1f);
            SetAnchors(dexProgress.rectTransform, new Vector2(0, 0), new Vector2(0.6f, 0), new Vector2(10, 5), new Vector2(-10, 35));

            var clearFilterBtn = BuildButton(filterArea, "清除筛选", new Vector2(560, 5), new Vector2(180, 32), new Color(0.4f, 0.3f, 0.3f, 1f));

            // 列表区（调整y偏移从-120→-140因为筛选区变大）
            var listArea = CreateUIObject("EntryList", container);
            SetAnchors(listArea, new Vector2(0, 0), new Vector2(0.5f, 1), new Vector2(10, 10), new Vector2(-5, -145));
            var listImg = listArea.gameObject.AddComponent<Image>();
            listImg.color = new Color(0.05f, 0.06f, 0.08f, 1f);

            // 详情区
            var detailArea = CreateUIObject("DetailPanel", container);
            SetAnchors(detailArea, new Vector2(0.5f, 0), new Vector2(1, 1), new Vector2(5, 10), new Vector2(-10, -145));
            var dImg = detailArea.gameObject.AddComponent<Image>();
            dImg.color = new Color(0.05f, 0.06f, 0.08f, 1f);

            var detName = CreateText(detailArea, "", 22, TextAnchor.UpperCenter);
            detName.gameObject.name = "NameText";
            SetAnchors(detName.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(10, -16), new Vector2(-10, -44));

            var detRarity = CreateText(detailArea, "", 16, TextAnchor.UpperCenter);
            detRarity.gameObject.name = "RarityText";
            SetAnchors(detRarity.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(10, -46), new Vector2(-10, -70));

            var detDesc = CreateText(detailArea, "", 15, TextAnchor.UpperLeft);
            detDesc.gameObject.name = "DescText";
            detDesc.color = new Color(0.8f, 0.85f, 0.9f);
            SetAnchors(detDesc.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(16, -80), new Vector2(-16, -140));

            var detTraits = CreateText(detailArea, "", 14, TextAnchor.UpperLeft);
            detTraits.gameObject.name = "TraitsText";
            detTraits.color = new Color(0.6f, 0.85f, 1f);
            SetAnchors(detTraits.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(16, -145), new Vector2(-16, -190));

            var detCount = CreateText(detailArea, "", 14, TextAnchor.UpperLeft);
            detCount.gameObject.name = "CountText";
            SetAnchors(detCount.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(16, -195), new Vector2(-16, -230));

            var detFirst = CreateText(detailArea, "", 13, TextAnchor.UpperLeft);
            detFirst.gameObject.name = "FirstTimeText";
            detFirst.color = new Color(0.75f, 0.85f, 0.75f);
            SetAnchors(detFirst.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(16, -235), new Vector2(-16, -280));

            var detParams = CreateText(detailArea, "", 13, TextAnchor.UpperLeft);
            detParams.gameObject.name = "FirstParamsText";
            detParams.color = new Color(0.75f, 0.85f, 1f);
            SetAnchors(detParams.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(16, -285), new Vector2(-16, -330));

            var detHistory = CreateText(detailArea, "", 12, TextAnchor.UpperLeft);
            detHistory.gameObject.name = "HistoryText";
            detHistory.color = new Color(0.7f, 0.75f, 0.8f);
            SetAnchors(detHistory.rectTransform, new Vector2(0, 1), new Vector2(1, 0.3f), new Vector2(16, 30), new Vector2(-16, 0));

            var loadRecipeBtn = BuildButton(detailArea, "📋 载入首次配方", new Vector2(120, 12), new Vector2(240, 36), new Color(0.25f, 0.5f, 0.6f, 1f));
            loadRecipeBtn.gameObject.name = "LoadRecipeBtn";

            // 条目prefab
            var dexEntryPrefab = new GameObject("DexEntryItem");
            dexEntryPrefab.SetActive(false);
            DontDestroyOnLoad(dexEntryPrefab);
            var dprt = dexEntryPrefab.AddComponent<RectTransform>();
            dprt.sizeDelta = new Vector2(330, 40);
            var dpImg = dexEntryPrefab.AddComponent<Image>();
            dpImg.color = new Color(0.1f, 0.12f, 0.14f, 1f);
            var dName = CreateText(dprt, "", 14, TextAnchor.MiddleLeft);
            dName.gameObject.name = "NameText";
            SetAnchors(dName.rectTransform, new Vector2(0, 0), new Vector2(0.6f, 1), new Vector2(8, 0), new Vector2(-8, 0));
            var dRarity = CreateText(dprt, "", 12, TextAnchor.MiddleCenter);
            dRarity.gameObject.name = "RarityText";
            SetAnchors(dRarity.rectTransform, new Vector2(0.6f, 0), new Vector2(0.8f, 1), new Vector2(0, 0), new Vector2(0, 0));
            var dCount = CreateText(dprt, "", 12, TextAnchor.MiddleRight);
            dCount.gameObject.name = "CountText";
            SetAnchors(dCount.rectTransform, new Vector2(0.8f, 0), new Vector2(1, 1), new Vector2(0, 0), new Vector2(-8, 0));
            var dBtn = dexEntryPrefab.AddComponent<Button>();
            dBtn.targetGraphic = dpImg;

            // 绑定DexPanel组件
            var dexGO = new GameObject("DexPanelLogic");
            dexGO.transform.SetParent(parent, false);
            _dexPanel = dexGO.AddComponent<DexPanel>();
            _dexPanel.PanelRoot = _dexPanelRoot.gameObject;
            _dexPanel.CloseButton = closeBtn;
            _dexPanel.OpenButton = null;
            _dexPanel.ProgressText = dexProgress;
            _dexPanel.RarityFilterDropdown = rarityDD;   // ★ 绑定真实Dropdown
            _dexPanel.TraitFilterDropdown = traitDD;     // ★ 绑定真实Dropdown
            _dexPanel.ClearFilterButton = clearFilterBtn;
            _dexPanel.EntryListContainer = listArea;
            _dexPanel.DexEntryItemPrefab = dexEntryPrefab;
            _dexPanel.DetailPanel = detailArea.gameObject;
            _dexPanel.DetailPlantImage = null;
            _dexPanel.DetailNameText = detName;
            _dexPanel.DetailDescText = detDesc;
            _dexPanel.DetailRarityText = detRarity;
            _dexPanel.DetailTraitsText = detTraits;
            _dexPanel.DetailDiscoveryCountText = detCount;
            _dexPanel.DetailFirstDiscoveredText = detFirst;
            _dexPanel.DetailFirstParamsText = detParams;
            _dexPanel.DetailHistoryText = detHistory;
            _dexPanel.LoadRecipeButton = loadRecipeBtn;
            _gameManager.DexPanel = _dexPanel;

            _dexPanelRoot.gameObject.SetActive(false);
        }

        // =====================================================
        //  Log Popup
        // =====================================================
        private void BuildLogPopup(RectTransform parent)
        {
            _logPanelRoot = CreatePopupPanel(parent, "LogPanel", "📝 实验日志", out var closeBtn, out var container);

            // 顶部统计
            var summary = CreateText(container, "", 14, TextAnchor.UpperLeft);
            summary.color = new Color(0.7f, 0.85f, 1f);
            SetAnchors(summary.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(10, -10), new Vector2(-10, -38));

            var logCount = CreateText(container, "", 14, TextAnchor.UpperLeft);
            SetAnchors(logCount.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(10, -40), new Vector2(-10, -68));

            // ★ 筛选区（新增！）
            var logFilterArea = CreateUIObject("LogFilterArea", container);
            SetAnchors(logFilterArea, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -70), new Vector2(0, -160));

            // 标签
            var lbl1 = CreateText(logFilterArea, "稀有度:", 13, TextAnchor.MiddleLeft);
            SetAnchors(lbl1.rectTransform, new Vector2(0, 1), new Vector2(0, 1), new Vector2(10, -8), new Vector2(80, -34));
            var lbl2 = CreateText(logFilterArea, "状态:", 13, TextAnchor.MiddleLeft);
            SetAnchors(lbl2.rectTransform, new Vector2(0.22f, 1), new Vector2(0.22f, 1), new Vector2(10, -8), new Vector2(60, -34));
            var lbl3 = CreateText(logFilterArea, "特征:", 13, TextAnchor.MiddleLeft);
            SetAnchors(lbl3.rectTransform, new Vector2(0.44f, 1), new Vector2(0.44f, 1), new Vector2(10, -8), new Vector2(60, -34));

            // 3个Dropdown
            var logRarityOpts = new List<string> { "全部稀有度", "失败", "普通", "稀有", "传说" };
            var logRarityDD = CreateDropdown(logFilterArea, new Vector2(75, -38), new Vector2(150, 28), logRarityOpts);
            logRarityDD.name = "LogRarityFilter";

            var logStatusOpts = new List<string> { "全部状态", "成功", "失败", "已终止" };
            var logStatusDD = CreateDropdown(logFilterArea, new Vector2(310, -38), new Vector2(150, 28), logStatusOpts);
            logStatusDD.name = "LogStatusFilter";

            var logTraitOpts = new List<string> { "全部特征" };
            foreach (MutationTrait t in System.Enum.GetValues(typeof(MutationTrait)))
                if (t != MutationTrait.None) logTraitOpts.Add(TraitDisplayName(t));
            var logTraitDD = CreateDropdown(logFilterArea, new Vector2(540, -38), new Vector2(180, 28), logTraitOpts);
            logTraitDD.name = "LogTraitFilter";

            // Toggle + ClearFilter（第2行居中
            var firstOnlyToggle = CreateToggle(logFilterArea, new Vector2(75, -76), new Vector2(260, 28), "只看首次发现");
            firstOnlyToggle.name = "FirstDiscoveryOnlyToggle";
            var logClearBtn = BuildButton(logFilterArea, "清除筛选", new Vector2(660, -74), new Vector2(160, 30), new Color(0.4f, 0.3f, 0.3f, 1f));

            // 列表（下移因为筛选区变大：从y=-80→y=-170）
            var listArea = CreateUIObject("LogList", container);
            SetAnchors(listArea, new Vector2(0, 0), new Vector2(0.55f, 1), new Vector2(10, 10), new Vector2(-5, -170));
            var li = listArea.gameObject.AddComponent<Image>();
            li.color = new Color(0.05f, 0.06f, 0.08f, 1f);

            // 详情（下移）
            var detailArea = CreateUIObject("LogDetail", container);
            SetAnchors(detailArea, new Vector2(0.55f, 0), new Vector2(1, 1), new Vector2(5, 10), new Vector2(-10, -170));
            var di = detailArea.gameObject.AddComponent<Image>();
            di.color = new Color(0.05f, 0.06f, 0.08f, 1f);

            var dTime = CreateText(detailArea, "", 14, TextAnchor.UpperLeft);
            SetAnchors(dTime.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(12, -12), new Vector2(-12, -36));

            var dName = CreateText(detailArea, "", 18, TextAnchor.UpperLeft);
            SetAnchors(dName.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(12, -44), new Vector2(-12, -70));

            var dRarity = CreateText(detailArea, "", 14, TextAnchor.UpperLeft);
            SetAnchors(dRarity.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(12, -74), new Vector2(-12, -96));

            var dTraits = CreateText(detailArea, "", 14, TextAnchor.UpperLeft);
            dTraits.color = new Color(0.6f, 0.85f, 1f);
            SetAnchors(dTraits.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(12, -100), new Vector2(-12, -140));

            var dStatus = CreateText(detailArea, "", 14, TextAnchor.UpperLeft);
            SetAnchors(dStatus.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(12, -146), new Vector2(-12, -170));

            var dParams = CreateText(detailArea, "", 13, TextAnchor.UpperLeft);
            dParams.color = new Color(0.75f, 0.85f, 1f);
            SetAnchors(dParams.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(12, -176), new Vector2(-12, -210));

            var dRes = CreateText(detailArea, "", 13, TextAnchor.UpperLeft);
            dRes.color = new Color(0.9f, 0.8f, 0.6f);
            SetAnchors(dRes.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(12, -216), new Vector2(-12, -250));

            var dNotes = CreateText(detailArea, "", 13, TextAnchor.UpperLeft);
            dNotes.color = new Color(0.85f, 0.85f, 0.75f);
            SetAnchors(dNotes.rectTransform, new Vector2(0, 1), new Vector2(1, 0.3f), new Vector2(12, 10), new Vector2(-12, 0));

            var loadBtn = BuildButton(detailArea, "📋 载入此配方", new Vector2(120, 20), new Vector2(240, 34), new Color(0.25f, 0.5f, 0.6f, 1f));

            // log item prefab
            var logItemPrefab = new GameObject("LogItemPrefab");
            logItemPrefab.SetActive(false);
            DontDestroyOnLoad(logItemPrefab);
            var lpRT = logItemPrefab.AddComponent<RectTransform>();
            lpRT.sizeDelta = new Vector2(470, 50);
            var lpImg = logItemPrefab.AddComponent<Image>();
            lpImg.color = new Color(0.1f, 0.12f, 0.14f, 1f);
            var lTime = CreateText(lpRT, "", 12, TextAnchor.UpperLeft);
            lTime.gameObject.name = "TimeText";
            lTime.color = new Color(0.7f, 0.75f, 0.8f);
            SetAnchors(lTime.rectTransform, new Vector2(0, 1), new Vector2(0.3f, 1), new Vector2(4, -4), new Vector2(-4, -22));
            var lName = CreateText(lpRT, "", 14, TextAnchor.UpperLeft);
            lName.gameObject.name = "NameText";
            SetAnchors(lName.rectTransform, new Vector2(0.3f, 1), new Vector2(1, 1), new Vector2(4, -4), new Vector2(-4, -26));
            var lStatus = CreateText(lpRT, "", 12, TextAnchor.UpperLeft);
            lStatus.gameObject.name = "StatusText";
            SetAnchors(lStatus.rectTransform, new Vector2(0, 0), new Vector2(0.25f, 0), new Vector2(4, 4), new Vector2(-4, 22));
            var lParams = CreateText(lpRT, "", 11, TextAnchor.UpperLeft);
            lParams.gameObject.name = "ParamsText";
            lParams.color = new Color(0.65f, 0.75f, 0.85f);
            SetAnchors(lParams.rectTransform, new Vector2(0.25f, 0), new Vector2(1, 0), new Vector2(4, 4), new Vector2(-4, 22));
            var lBtn = logItemPrefab.AddComponent<Button>();
            lBtn.targetGraphic = lpImg;

            // 绑定（★全部筛选控件都真实绑定！
            var logGO = new GameObject("ExperimentLogLogic");
            logGO.transform.SetParent(parent, false);
            _expLogPanel = logGO.AddComponent<ExperimentLogPanel>();
            _expLogPanel.PanelRoot = _logPanelRoot.gameObject;
            _expLogPanel.CloseButton = closeBtn;
            _expLogPanel.OpenButton = null;
            _expLogPanel.StatsSummaryText = summary;
            _expLogPanel.LogCountText = logCount;
            _expLogPanel.RarityFilterDropdown = logRarityDD;
            _expLogPanel.TraitFilterDropdown = logTraitDD;
            _expLogPanel.StatusFilterDropdown = logStatusDD;
            _expLogPanel.FirstDiscoveryOnlyToggle = firstOnlyToggle;
            _expLogPanel.ClearFilterButton = logClearBtn;
            _expLogPanel.LogListContainer = listArea;
            _expLogPanel.LogItemPrefab = logItemPrefab;
            _expLogPanel.DetailPanel = detailArea.gameObject;
            _expLogPanel.DetailTimestampText = dTime;
            _expLogPanel.DetailPlantNameText = dName;
            _expLogPanel.DetailRarityText = dRarity;
            _expLogPanel.DetailTraitsText = dTraits;
            _expLogPanel.DetailStatusText = dStatus;
            _expLogPanel.DetailParamsText = dParams;
            _expLogPanel.DetailResourcesText = dRes;
            _expLogPanel.DetailNotesText = dNotes;
            _expLogPanel.LoadRecipeFromLogButton = loadBtn;
            _gameManager.ExperimentLogPanel = _expLogPanel;

            _logPanelRoot.gameObject.SetActive(false);
        }

        // =====================================================
        //  Helpers
        // =====================================================
        private RectTransform CreatePopupPanel(RectTransform parent, string name, string titleText, out Button closeBtn, out RectTransform container)
        {
            var root = CreateUIObject(name, parent);
            Stretch(root);
            var rootImg = root.gameObject.AddComponent<Image>();
            rootImg.color = new Color(0f, 0f, 0f, 0.75f);

            var panel = CreateUIObject(name + "_Inner", root);
            SetAnchors(panel, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-500, -380), new Vector2(500, 380));
            var pImg = panel.gameObject.AddComponent<Image>();
            pImg.color = new Color(0.09f, 0.1f, 0.13f, 1f);

            var title = CreateText(panel, titleText, 24, TextAnchor.MiddleLeft);
            SetAnchors(title.rectTransform, new Vector2(0, 1), new Vector2(1, 1), new Vector2(20, -8), new Vector2(-80, -44));

            closeBtn = BuildButton(panel, "✕ 关闭", new Vector2(850, 10), new Vector2(110, 36), new Color(0.45f, 0.25f, 0.25f, 1f));

            container = CreateUIObject("Container", panel);
            SetAnchors(container, new Vector2(0, 0), new Vector2(1, 1), new Vector2(10, 10), new Vector2(-10, -60));

            return root;
        }

        private RectTransform CreateUIObject(string name, RectTransform parent)
        {
            var go = new GameObject(name, typeof(RectTransform));
            var rt = go.GetComponent<RectTransform>();
            if (parent != null) rt.SetParent(parent, false);
            rt.anchoredPosition3D = Vector3.zero;
            rt.localScale = Vector3.one;
            rt.localRotation = Quaternion.identity;
            return rt;
        }

        private RectTransform BuildPanel(RectTransform parent, string name, Vector2 pos, Vector2 size, Color color)
        {
            var go = CreateUIObject(name, parent);
            SetAnchors(go, new Vector2(0, 0), new Vector2(0, 0), pos, pos + size);
            var img = go.gameObject.AddComponent<Image>();
            img.color = color;
            return go;
        }

        private Text CreateText(RectTransform parent, string content, int fontSize, TextAnchor anchor)
        {
            var go = CreateUIObject("Text", parent);
            Stretch(go);
            var txt = go.gameObject.AddComponent<Text>();
            txt.text = content;
            txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            txt.fontSize = fontSize;
            txt.alignment = anchor;
            txt.color = Color.white;
            txt.horizontalOverflow = HorizontalWrapMode.Overflow;
            txt.verticalOverflow = VerticalWrapMode.Overflow;
            return txt;
        }

        private Button BuildButton(RectTransform parent, string label, Vector2 pos, Vector2 size, Color color)
        {
            var go = CreateUIObject("Button", parent);
            SetAnchors(go, new Vector2(0, 0), new Vector2(0, 0), pos, pos + size);
            var img = go.gameObject.AddComponent<Image>();
            img.color = color;
            var btn = go.gameObject.AddComponent<Button>();
            var labelT = CreateText(go, label, 15, TextAnchor.MiddleCenter);
            Stretch(labelT.rectTransform);
            return btn;
        }

        private Dropdown CreateDropdown(RectTransform parent, Vector2 pos, Vector2 size, List<string> options)
        {
            var go = CreateUIObject("Dropdown", parent);
            SetAnchors(go, new Vector2(0, 0), new Vector2(0, 0), pos, pos + size);
            var img = go.gameObject.AddComponent<Image>();
            img.color = new Color(0.15f, 0.18f, 0.22f, 1f);
            var dd = go.gameObject.AddComponent<Dropdown>();
            dd.targetGraphic = img;

            // 模板
            var template = CreateUIObject("Template", go.GetComponent<RectTransform>());
            SetAnchors(template, new Vector2(0, 0), new Vector2(1, 0), new Vector2(0, -size.y * 4), new Vector2(0, 0));
            var tImg = template.gameObject.AddComponent<Image>();
            tImg.color = new Color(0.2f, 0.23f, 0.28f, 1f);
            var viewport = CreateUIObject("Viewport", template);
            SetAnchors(viewport, new Vector2(0, 0), new Vector2(1, 1), new Vector2(4, 4), new Vector2(-18, -4));
            var content = CreateUIObject("Content", viewport);
            SetAnchors(content, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, 0), new Vector2(0, -size.y * (options.Count + 1)));

            // Item模板
            var item = CreateUIObject("Item", content);
            SetAnchors(item, new Vector2(0, 0), new Vector2(1, 0), new Vector2(0, 0), new Vector2(0, size.y));
            var itemImg = item.gameObject.AddComponent<Image>();
            itemImg.color = new Color(0.2f, 0.23f, 0.28f, 1f);
            var itemToggle = item.gameObject.AddComponent<Toggle>();
            var itemText = CreateText(item, "", 14, TextAnchor.MiddleLeft);
            SetAnchors(itemText.rectTransform, new Vector2(0, 0), new Vector2(1, 1), new Vector2(8, 0), new Vector2(-8, 0));
            itemToggle.targetGraphic = itemImg;
            itemToggle.graphic = null;

            dd.template = template;
            dd.captionText = CreateText(go.GetComponent<RectTransform>(), "", 14, TextAnchor.MiddleLeft);
            SetAnchors(dd.captionText.rectTransform, new Vector2(0, 0), new Vector2(1, 1), new Vector2(10, 0), new Vector2(-size.y - 10, 0));
            dd.itemText = itemText;

            // 箭头
            var arrow = CreateUIObject("Arrow", go.GetComponent<RectTransform>());
            SetAnchors(arrow, new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-size.y - 4, -size.y / 2 + 2), new Vector2(-4, size.y / 2 - 2));
            var arrowText = CreateText(arrow, "▼", 12, TextAnchor.MiddleCenter);
            Stretch(arrowText.rectTransform);
            arrowText.color = new Color(0.7f, 0.75f, 0.8f);

            dd.options.Clear();
            foreach (var opt in options) dd.options.Add(new Dropdown.OptionData(opt));
            dd.value = 0;
            dd.RefreshShownValue();

            template.gameObject.SetActive(false);
            return dd;
        }

        private Toggle CreateToggle(RectTransform parent, Vector2 pos, Vector2 size, string label)
        {
            var go = CreateUIObject("Toggle", parent);
            SetAnchors(go, new Vector2(0, 0), new Vector2(0, 0), pos, pos + size);
            var toggle = go.gameObject.AddComponent<Toggle>();

            var bg = CreateUIObject("Background", go.GetComponent<RectTransform>());
            SetAnchors(bg, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(0, -size.y / 2 + 2), new Vector2(size.y - 4, size.y / 2 - 2));
            var bgImg = bg.gameObject.AddComponent<Image>();
            bgImg.color = new Color(0.25f, 0.3f, 0.35f, 1f);
            toggle.targetGraphic = bgImg;

            var check = CreateUIObject("Checkmark", bg);
            Stretch(check);
            var checkImg = check.gameObject.AddComponent<Image>();
            checkImg.color = new Color(0.55f, 0.9f, 0.65f, 1f);
            toggle.graphic = checkImg;

            var labelT = CreateText(go.GetComponent<RectTransform>(), label, 14, TextAnchor.MiddleLeft);
            SetAnchors(labelT.rectTransform, new Vector2(0, 0), new Vector2(1, 1), new Vector2(size.y + 4, 0), new Vector2(-4, 0));

            toggle.isOn = false;
            return toggle;
        }

        private void Stretch(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
        }

        private void SetAnchors(RectTransform rt, Vector2 anchorMin, Vector2 anchorMax, Vector2 offsetMin, Vector2 offsetMax)
        {
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = offsetMin;
            rt.offsetMax = offsetMax;
        }

        private static string TraitDisplayName(MutationTrait trait)
        {
            return trait switch
            {
                MutationTrait.Glowing => "发光",
                MutationTrait.Crystalline => "结晶",
                MutationTrait.Poisonous => "有毒",
                MutationTrait.Giant => "巨型",
                MutationTrait.Miniature => "迷你",
                MutationTrait.Spiky => "带刺",
                MutationTrait.Fruity => "果味",
                MutationTrait.Burning => "火焰",
                MutationTrait.Frozen => "冰霜",
                MutationTrait.Electric => "带电",
                MutationTrait.Invisible => "隐形",
                MutationTrait.MultiHead => "多头",
                MutationTrait.Winged => "有翼",
                MutationTrait.Metallic => "金属",
                MutationTrait.Rainbow => "彩虹",
                MutationTrait.Withered => "枯萎",
                MutationTrait.Moldy => "发霉",
                MutationTrait.Stunted => "发育不良",
                _ => trait.ToString()
            };
        }
    }
}
