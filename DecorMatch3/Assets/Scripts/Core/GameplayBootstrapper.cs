using UnityEngine;
using UnityEngine.UI;
using System.Collections;

namespace DecorMatch3
{
    public class GameplayBootstrapper : MonoBehaviour
    {
        private Canvas _canvas;
        private Board _board;
        private BoardVisual _boardVisual;
        private LevelController _levelController;
        private SwapHandler _swapHandler;
        private ComboSystem _comboSystem;

        private Text _scoreText;
        private Text _movesText;
        private Text _levelText;
        private Text _comboText;
        private Slider _progressSlider;
        private GameObject _comboPanel;
        private GameObject _pauseMenu;

        private int _currentLevelId;
        private LevelConfigData _currentConfig;

        private void Start()
        {
            EnsureCanvasAndCamera();
        }

        public void LaunchLevel(int levelId)
        {
            _currentLevelId = levelId;
            _currentConfig = ConfigManager.Instance?.GetLevel(levelId);
            if (_currentConfig == null)
            {
                Debug.LogError("Level config not found: " + levelId);
                return;
            }

            ClearGameplayUI();
            BuildGameplayUI();
            SetupBoard();
            SetupLevelController();

            if (_currentConfig.hasTutorial && !TutorialCompleted())
            {
                ShowTutorial();
            }
        }

        public void LaunchDecoration(int levelId)
        {
            _currentLevelId = levelId;
            ClearGameplayUI();
            BuildDecorationUI(levelId);
        }

        private void EnsureCanvasAndCamera()
        {
            _canvas = FindObjectOfType<Canvas>();
            if (_canvas == null)
            {
                GameObject canvasObj = new GameObject("Canvas");
                _canvas = canvasObj.AddComponent<Canvas>();
                _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                canvasObj.AddComponent<CanvasScaler>();
                canvasObj.AddComponent<GraphicRaycaster>();
            }

            if (FindObjectOfType<EventSystem>() == null)
            {
                GameObject esObj = new GameObject("EventSystem");
                esObj.AddComponent<UnityEngine.EventSystems.EventSystem>();
                esObj.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
            }

            Camera mainCam = Camera.main;
            if (mainCam == null)
            {
                GameObject camObj = new GameObject("Main Camera");
                mainCam = camObj.AddComponent<Camera>();
                camObj.tag = "MainCamera";
            }
            mainCam.backgroundColor = new Color(0.12f, 0.12f, 0.18f);
            mainCam.orthographic = true;
            mainCam.orthographicSize = 5f;
            mainCam.transform.position = new Vector3(0, 0, -10f);
        }

        private void SetupBoard()
        {
            GameObject boardObj = new GameObject("Board");
            _board = boardObj.AddComponent<Board>();
            _board.Initialize(_currentConfig);

            _boardVisual = boardObj.AddComponent<BoardVisual>();
            _boardVisual.Initialize(_board);

            _swapHandler = boardObj.AddComponent<SwapHandler>();
            _swapHandler.Initialize(_board);

            _comboSystem = boardObj.AddComponent<ComboSystem>();

            _board.OnVisualUpdateNeeded += OnVisualUpdate;

            GameEvents.OnTileMatched += OnTileMatchedFeedback;
            GameEvents.OnComboHit += OnComboFeedback;
            GameEvents.OnLevelCompleted += OnLevelCompleted;
            GameEvents.OnLevelFailed += OnLevelFailed;
            GameEvents.OnBoardReset += OnBoardResetVisual;
        }

        private void OnVisualUpdate()
        {
            if (_boardVisual != null) _boardVisual.UpdateBoardVisual();
        }

        private void SetupLevelController()
        {
            GameObject lcObj = new GameObject("LevelController");
            _levelController = lcObj.AddComponent<LevelController>();
            _levelController.StartLevel(_currentLevelId);
        }

        private void BuildGameplayUI()
        {
            GameObject panel = CreatePanel("GameplayPanel", _canvas.transform);

            _levelText = CreateTextObj("LevelText", panel.transform, "Level " + _currentLevelId, 28, Color.white).GetComponent<Text>();
            SetAnchoredPosition(_levelText.rectTransform, new Vector2(0, 280), new Vector2(300, 40));

            _scoreText = CreateTextObj("ScoreText", panel.transform, "分数: 0", 24, new Color(1f, 0.9f, 0.3f)).GetComponent<Text>();
            SetAnchoredPosition(_scoreText.rectTransform, new Vector2(-200, 240), new Vector2(250, 36));

            _movesText = CreateTextObj("MovesText", panel.transform, "步数: " + _currentConfig.movesLimit, 24, Color.white).GetComponent<Text>();
            SetAnchoredPosition(_movesText.rectTransform, new Vector2(200, 240), new Vector2(250, 36));

            GameObject sliderObj = new GameObject("ProgressSlider");
            sliderObj.transform.SetParent(panel.transform, false);
            RectTransform sliderRt = sliderObj.AddComponent<RectTransform>();
            SetAnchoredPosition(sliderRt, new Vector2(0, 210), new Vector2(500, 20));
            _progressSlider = sliderObj.AddComponent<Slider>();
            _progressSlider.minValue = 0;
            _progressSlider.maxValue = _currentConfig.targetScore;
            _progressSlider.value = 0;
            Image sliderBg = sliderObj.AddComponent<Image>();
            sliderBg.color = new Color(0.3f, 0.3f, 0.3f);

            _comboPanel = new GameObject("ComboPanel");
            _comboPanel.transform.SetParent(panel.transform, false);
            RectTransform comboRt = _comboPanel.AddComponent<RectTransform>();
            SetAnchoredPosition(comboRt, new Vector2(0, 170), new Vector2(200, 30));
            _comboText = _comboPanel.AddComponent<Text>();
            _comboText.text = "";
            _comboText.fontSize = 26;
            _comboText.color = new Color(1f, 0.5f, 0f);
            _comboText.alignment = TextAnchor.MiddleCenter;
            _comboText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            _comboPanel.SetActive(false);

            GameObject pauseBtn = CreateButtonObj("PauseBtn", panel.transform, "暂停", new Vector2(350, 280));
            pauseBtn.GetComponent<Button>().onClick.AddListener(() =>
            {
                Time.timeScale = 0f;
                ShowPauseMenu(panel);
            });

            GameEvents.OnScoreChanged += UpdateScoreUI;
            GameEvents.OnMovesChanged += UpdateMovesUI;
            GameEvents.OnComboHit += ShowComboUI;
        }

        private void BuildDecorationUI(int levelId)
        {
            LevelConfigData config = ConfigManager.Instance?.GetLevel(levelId);
            if (config == null) return;

            CustomerData customer = ConfigManager.Instance?.GetCustomer(config.customerId);

            GameObject panel = CreatePanel("DecorationPanel", _canvas.transform);

            GameObject title = CreateTextObj("Title", panel.transform, "装修房间", 30, new Color(1f, 0.85f, 0.3f));
            SetAnchoredPosition(title.GetComponent<RectTransform>(), new Vector2(0, 280), new Vector2(400, 40));

            string customerName = customer != null ? customer.displayName : "客户";
            GameObject customerInfo = CreateTextObj("CustomerInfo", panel.transform, "客户: " + customerName + " | 偏好: " + (customer != null ? customer.preferredStyle : ""), 20, Color.white);
            SetAnchoredPosition(customerInfo.GetComponent<RectTransform>(), new Vector2(0, 230), new Vector2(500, 30));

            GameObject roomPreview = new GameObject("RoomPreview");
            roomPreview.transform.SetParent(panel.transform, false);
            RectTransform rpRt = roomPreview.AddComponent<RectTransform>();
            SetAnchoredPosition(rpRt, new Vector2(-150, 20), new Vector2(300, 250));
            Image rpImg = roomPreview.AddComponent<Image>();
            rpImg.color = new Color(0.9f, 0.9f, 0.85f);

            GameObject paletteArea = new GameObject("PaletteArea");
            paletteArea.transform.SetParent(panel.transform, false);
            RectTransform paRt = paletteArea.AddComponent<RectTransform>();
            SetAnchoredPosition(paRt, new Vector2(180, 60), new Vector2(300, 280));

            if (ConfigManager.Instance?.ColorPalettes != null)
            {
                float yOff = 100f;
                foreach (var palette in ConfigManager.Instance.ColorPalettes)
                {
                    string pid = palette.paletteId;
                    GameObject pBtn = CreateButtonObj("Palette_" + pid, paletteArea.transform, palette.displayName, new Vector2(0, yOff));
                    pBtn.GetComponent<Button>().onClick.AddListener(() =>
                    {
                        PlayClick();
                        Color c;
                        if (palette.hexColors != null && palette.hexColors.Length > 0 && ColorUtility.TryParseHtmlString(palette.hexColors[0], out c))
                        {
                            rpImg.color = c;
                        }
                    });
                    yOff -= 50f;
                }
            }

            GameObject submitBtn = CreateButtonObj("SubmitBtn", panel.transform, "提交装修", new Vector2(0, -200));
            submitBtn.GetComponent<Button>().onClick.AddListener(() =>
            {
                PlayClick();
                float score = Random.Range(40f, 95f);
                int stars = score >= 85 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;
                string feedback = "风格: " + (score > 60 ? "良好" : "差") + " | 颜色: " + (score > 50 ? "匹配" : "不搭");
                ShowResultUI(levelId, (int)score, stars, feedback, true);
            });

            GameObject backBtn = CreateButtonObj("BackBtn", panel.transform, "返回关卡选择", new Vector2(0, -260));
            backBtn.GetComponent<Button>().onClick.AddListener(() =>
            {
                PlayClick();
                GameManager.Instance.ReturnToMenu();
            });
        }

        private void ShowResultUI(int levelId, int score, int stars, string feedback, bool isDecoration)
        {
            ClearGameplayUI();

            GameObject panel = CreatePanel("ResultPanel", _canvas.transform);

            string titleText = isDecoration ? "装修结果" : (stars > 0 ? "关卡完成！" : "关卡失败");
            GameObject title = CreateTextObj("Title", panel.transform, titleText, 32, stars > 0 ? new Color(1f, 0.85f, 0.3f) : Color.red);
            SetAnchoredPosition(title.GetComponent<RectTransform>(), new Vector2(0, 200), new Vector2(400, 50));

            GameObject scoreObj = CreateTextObj("Score", panel.transform, "分数: " + score, 28, Color.white);
            SetAnchoredPosition(scoreObj.GetComponent<RectTransform>(), new Vector2(0, 130), new Vector2(300, 40));

            GameObject starsObj = CreateTextObj("Stars", panel.transform, new string('★', stars) + new string('☆', 3 - stars), 36, Color.yellow);
            SetAnchoredPosition(starsObj.GetComponent<RectTransform>(), new Vector2(0, 70), new Vector2(300, 50));

            if (!string.IsNullOrEmpty(feedback))
            {
                GameObject fbObj = CreateTextObj("Feedback", panel.transform, feedback, 20, Color.white);
                SetAnchoredPosition(fbObj.GetComponent<RectTransform>(), new Vector2(0, 10), new Vector2(500, 40));
            }

            if (stars > 0)
            {
                GameObject decorBtn = CreateButtonObj("DecorationBtn", panel.transform, "去装修", new Vector2(0, -60));
                decorBtn.GetComponent<Button>().onClick.AddListener(() =>
                {
                    PlayClick();
                    GameManager.Instance.LoadDecoration(levelId);
                });
            }

            if (stars > 0)
            {
                GameObject nextBtn = CreateButtonObj("NextBtn", panel.transform, "下一关", new Vector2(-130, -130));
                nextBtn.GetComponent<Button>().onClick.AddListener(() =>
                {
                    PlayClick();
                    GameManager.Instance.LoadLevel(levelId + 1);
                });
            }

            GameObject retryBtn = CreateButtonObj("RetryBtn", panel.transform, "重试", new Vector2(stars > 0 ? 130 : 0, -130));
            retryBtn.GetComponent<Button>().onClick.AddListener(() =>
            {
                PlayClick();
                SaveManager.Instance?.RecordRetry(levelId);
                GameManager.Instance.LoadLevel(levelId);
            });

            GameObject menuBtn = CreateButtonObj("MenuBtn", panel.transform, "返回主菜单", new Vector2(0, -200));
            menuBtn.GetComponent<Button>().onClick.AddListener(() =>
            {
                PlayClick();
                SaveManager.Instance?.Save();
                GameManager.Instance.ReturnToMenu();
            });

            if (SaveManager.Instance != null)
            {
                SaveManager.Instance.UpdateLevelRecord(levelId, score, stars, stars > 0, stars == 0 ? "insufficient_score" : null);
                SaveManager.Instance.Save();
            }
        }

        private void ShowTutorial()
        {
            GameObject panel = CreatePanel("TutorialPanel", _canvas.transform);

            string[] steps = {
                "欢迎来到装修配色三消！",
                "点击两个相邻方块来交换位置",
                "三个或更多相同方块连线即可消除",
                "消除方块获得材料来装修房间",
                "注意步数限制，合理规划每一步！",
                "创建连击来获得更高分数！"
            };

            GameObject stepText = CreateTextObj("StepText", panel.transform, steps[0], 24, Color.white);
            SetAnchoredPosition(stepText.GetComponent<RectTransform>(), new Vector2(0, 50), new Vector2(600, 80));

            int[] currentStep = { 0 };

            GameObject nextBtn = CreateButtonObj("NextBtn", panel.transform, "下一步", new Vector2(80, -80));
            nextBtn.GetComponent<Button>().onClick.AddListener(() =>
            {
                currentStep[0]++;
                if (currentStep[0] < steps.Length)
                {
                    stepText.GetComponent<Text>().text = steps[currentStep[0]];
                    if (currentStep[0] == steps.Length - 1)
                    {
                        nextBtn.GetComponentInChildren<Text>().text = "开始！";
                    }
                }
                else
                {
                    if (SaveManager.Instance?.CurrentSave?.playerProfile != null)
                    {
                        SaveManager.Instance.CurrentSave.playerProfile.tutorialCompleted = true;
                        SaveManager.Instance.Save();
                    }
                    Destroy(panel);
                }
                PlayClick();
            });

            GameObject skipBtn = CreateButtonObj("SkipBtn", panel.transform, "跳过教程", new Vector2(-120, -80));
            skipBtn.GetComponentInChildren<Text>().fontSize = 18;
            skipBtn.GetComponent<Button>().onClick.AddListener(() =>
            {
                SaveManager.Instance?.RecordTutorialSkip();
                if (SaveManager.Instance?.CurrentSave?.playerProfile != null)
                {
                    SaveManager.Instance.CurrentSave.playerProfile.skippedTutorial = true;
                    SaveManager.Instance.CurrentSave.playerProfile.tutorialCompleted = true;
                    SaveManager.Instance.Save();
                }
                Destroy(panel);
                PlayClick();
            });
        }

        private void ShowPauseMenu(Transform parent)
        {
            if (_pauseMenu != null) return;
            _pauseMenu = CreatePanel("PauseMenu", parent);
            _pauseMenu.transform.SetAsLastSibling();

            GameObject title = CreateTextObj("Title", _pauseMenu.transform, "暂停", 32, Color.white);
            SetAnchoredPosition(title.GetComponent<RectTransform>(), new Vector2(0, 80), new Vector2(200, 50));

            GameObject resumeBtn = CreateButtonObj("ResumeBtn", _pauseMenu.transform, "继续", new Vector2(0, 0));
            resumeBtn.GetComponent<Button>().onClick.AddListener(() =>
            {
                Time.timeScale = 1f;
                Destroy(_pauseMenu);
                _pauseMenu = null;
                PlayClick();
            });

            GameObject restartBtn = CreateButtonObj("RestartBtn", _pauseMenu.transform, "重新开始", new Vector2(0, -70));
            restartBtn.GetComponent<Button>().onClick.AddListener(() =>
            {
                Time.timeScale = 1f;
                SaveManager.Instance?.RecordRetry(_currentLevelId);
                GameManager.Instance.LoadLevel(_currentLevelId);
                PlayClick();
            });

            GameObject quitBtn = CreateButtonObj("QuitBtn", _pauseMenu.transform, "退出关卡", new Vector2(0, -140));
            quitBtn.GetComponent<Button>().onClick.AddListener(() =>
            {
                Time.timeScale = 1f;
                SaveManager.Instance?.Save();
                GameManager.Instance.ReturnToMenu();
                PlayClick();
            });
        }

        private void OnTileMatchedFeedback(int count, TileType type)
        {
            if (_boardVisual != null) _boardVisual.OnTileMatched(count, type);
            if (AudioManager.Instance != null) AudioManager.Instance.PlaySFX("tile_match");
        }

        private void OnComboFeedback(int combo)
        {
            if (AudioManager.Instance != null) AudioManager.Instance.PlaySFX("combo");
        }

        private void OnLevelCompleted(int id, int score, int stars)
        {
            CleanupBoard();
            string feedback = "步数剩余: " + (_currentConfig != null ? "完成" : "");
            ShowResultUI(id, score, stars, feedback, false);
        }

        private void OnLevelFailed(int id, string reason)
        {
            CleanupBoard();
            ShowResultUI(id, 0, 0, "失败原因: " + reason, false);
        }

        private void OnBoardResetVisual()
        {
            if (_boardVisual != null) _boardVisual.OnBoardReset();
        }

        private void UpdateScoreUI(int score)
        {
            if (_scoreText != null) _scoreText.text = "分数: " + score;
            if (_progressSlider != null) _progressSlider.value = score;
        }

        private void UpdateMovesUI(int moves)
        {
            if (_movesText != null) _movesText.text = "步数: " + moves;
        }

        private void ShowComboUI(int combo)
        {
            if (_comboPanel != null && _comboText != null)
            {
                _comboPanel.SetActive(true);
                _comboText.text = "Combo x" + combo + "!";
            }
        }

        private void HideComboUI()
        {
            if (_comboPanel != null) _comboPanel.SetActive(false);
        }

        private void CleanupBoard()
        {
            if (_board != null)
            {
                _board.OnVisualUpdateNeeded -= OnVisualUpdate;
            }

            GameEvents.OnTileMatched -= OnTileMatchedFeedback;
            GameEvents.OnComboHit -= OnComboFeedback;
            GameEvents.OnLevelCompleted -= OnLevelCompleted;
            GameEvents.OnLevelFailed -= OnLevelFailed;
            GameEvents.OnBoardReset -= OnBoardResetVisual;
            GameEvents.OnScoreChanged -= UpdateScoreUI;
            GameEvents.OnMovesChanged -= UpdateMovesUI;
            GameEvents.OnComboHit -= ShowComboUI;

            if (_board != null && _board.gameObject != null)
            {
                Destroy(_board.gameObject);
            }
            if (_levelController != null && _levelController.gameObject != null)
            {
                Destroy(_levelController.gameObject);
            }
            _board = null;
            _boardVisual = null;
            _swapHandler = null;
            _comboSystem = null;
            _levelController = null;
        }

        private void ClearGameplayUI()
        {
            CleanupBoard();
            for (int i = _canvas.transform.childCount - 1; i >= 0; i--)
            {
                Destroy(_canvas.transform.GetChild(i).gameObject);
            }
        }

        private bool TutorialCompleted()
        {
            return SaveManager.Instance?.CurrentSave?.playerProfile?.tutorialCompleted == true
                || SaveManager.Instance?.CurrentSave?.playerProfile?.skippedTutorial == true;
        }

        private void OnDestroy()
        {
            CleanupBoard();
        }

        private GameObject CreatePanel(string name, Transform parent)
        {
            GameObject panel = new GameObject(name);
            panel.transform.SetParent(parent, false);
            RectTransform rt = panel.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.sizeDelta = Vector2.zero;
            Image img = panel.AddComponent<Image>();
            img.color = new Color(0.08f, 0.08f, 0.12f, 0.95f);
            return panel;
        }

        private GameObject CreateTextObj(string name, Transform parent, string text, int fontSize, Color color)
        {
            GameObject obj = new GameObject(name);
            obj.transform.SetParent(parent, false);
            RectTransform rt = obj.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(400, 40);
            Text uiText = obj.AddComponent<Text>();
            uiText.text = text;
            uiText.fontSize = fontSize;
            uiText.color = color;
            uiText.alignment = TextAnchor.MiddleCenter;
            uiText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            return obj;
        }

        private GameObject CreateButtonObj(string name, Transform parent, string text, Vector2 pos)
        {
            GameObject btnObj = new GameObject(name);
            btnObj.transform.SetParent(parent, false);
            RectTransform rt = btnObj.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(200, 45);
            rt.anchoredPosition = pos;
            Image img = btnObj.AddComponent<Image>();
            img.color = new Color(0.25f, 0.55f, 0.85f);
            Button btn = btnObj.AddComponent<Button>();

            GameObject textObj = new GameObject("Text");
            textObj.transform.SetParent(btnObj.transform, false);
            RectTransform textRt = textObj.AddComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.sizeDelta = Vector2.zero;
            Text uiText = textObj.AddComponent<Text>();
            uiText.text = text;
            uiText.fontSize = 20;
            uiText.color = Color.white;
            uiText.alignment = TextAnchor.MiddleCenter;
            uiText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

            ColorBlock colors = btn.colors;
            colors.highlightedColor = new Color(0.35f, 0.65f, 0.95f);
            colors.pressedColor = new Color(0.15f, 0.4f, 0.7f);
            btn.colors = colors;

            return btnObj;
        }

        private void SetAnchoredPosition(RectTransform rt, Vector2 pos, Vector2 size)
        {
            rt.anchoredPosition = pos;
            rt.sizeDelta = size;
        }

        private void PlayClick()
        {
            if (AudioManager.Instance != null) AudioManager.Instance.PlaySFX("button_click");
        }
    }
}
