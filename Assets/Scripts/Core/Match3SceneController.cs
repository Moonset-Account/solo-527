using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using DecorMatch3.Core;
using DecorMatch3.Match3;
using DecorMatch3.Decoration;
using DecorMatch3.Data;
using DecorMatch3.UI;
using DecorMatch3.GameFlow;
using DecorMatch3.Utils;

namespace DecorMatch3.Scenes
{
    public class Match3SceneController : MonoBehaviour
    {
        [SerializeField] private LevelData _levelData;
        [SerializeField] private BoardManager _boardManager;
        [SerializeField] private LevelManager _levelManager;
        [SerializeField] private Transform _contentRoot;

        private RectTransform _hudPanel;
        private RectTransform _goalsPanel;
        private Text _scoreText;
        private Text _movesText;
        private Text _timeText;
        private Image _scoreProgressBar;
        private Button _pauseButton;
        private GameObject _resultPanel;

        private Canvas _canvas;

        private void Awake()
        {
            EnsureUIStructure();
            SetupLevel();
        }

        private void EnsureUIStructure()
        {
            if (FindObjectOfType<UnityEngine.EventSystems.EventSystem>() == null)
            {
                GameObject es = new GameObject("EventSystem");
                es.AddComponent<UnityEngine.EventSystems.EventSystem>();
                es.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
            }

            _canvas = FindObjectOfType<Canvas>();
            if (_canvas == null)
            {
                GameObject canvasGO = new GameObject("MainCanvas");
                _canvas = canvasGO.AddComponent<Canvas>();
                _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                CanvasScaler scaler = canvasGO.AddComponent<CanvasScaler>();
                scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                scaler.referenceResolution = new Vector2(1920, 1080);
                canvasGO.AddComponent<GraphicRaycaster>();
            }

            if (_contentRoot == null)
            {
                GameObject rootGO = new GameObject("Match3Content");
                rootGO.transform.SetParent(_canvas.transform, false);
                RectTransform rt = rootGO.AddComponent<RectTransform>();
                rt.anchorMin = Vector2.zero;
                rt.anchorMax = Vector2.one;
                rt.offsetMin = new Vector2(0, 80);
                rt.offsetMax = Vector2.zero;
                _contentRoot = rt;
            }
        }

        private void SetupLevel()
        {
            GameFlowController flow = GameFlowController.Instance;
            if (flow != null && flow.CurrentLevel != null)
            {
                _levelData = flow.CurrentLevel;
            }
            else
            {
                _levelData = _levelData != null ? _levelData : DataManager.Instance.GetLevelById(1);
            }

            if (_levelData == null)
            {
                Debug.LogError("[Match3Scene] No level data available!");
                return;
            }

            BuildHUD();
            BuildBoard();
            BuildLevelManager();
            StartLevel();
        }

        private void BuildHUD()
        {
            GameObject hudGO = new GameObject("HUD");
            hudGO.transform.SetParent(_contentRoot, false);
            _hudPanel = hudGO.AddComponent<RectTransform>();
            _hudPanel.anchorMin = new Vector2(0, 1);
            _hudPanel.anchorMax = new Vector2(1, 1);
            _hudPanel.pivot = new Vector2(0.5f, 1f);
            _hudPanel.anchoredPosition = new Vector2(0, -10);
            _hudPanel.sizeDelta = new Vector2(0, 120);
            Image hudBg = hudGO.AddComponent<Image>();
            hudBg.color = new Color(0.15f, 0.18f, 0.25f, 0.9f);

            GameObject levelInfoGO = new GameObject("LevelInfo");
            levelInfoGO.transform.SetParent(_hudPanel, false);
            Text levelInfoText = levelInfoGO.AddComponent<Text>();
            levelInfoText.text = $"关卡 {_levelData.LevelId}: {_levelData.LevelName}";
            levelInfoText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            levelInfoText.fontSize = 22;
            levelInfoText.color = Color.white;
            RectTransform levelInfoRT = levelInfoGO.GetComponent<RectTransform>();
            levelInfoRT.anchorMin = new Vector2(0.02f, 0.8f);
            levelInfoRT.anchorMax = new Vector2(0.4f, 0.8f);
            levelInfoRT.pivot = new Vector2(0, 0.5f);
            levelInfoRT.sizeDelta = new Vector2(0, 35);

            GameObject scoreGO = new GameObject("ScorePanel");
            scoreGO.transform.SetParent(_hudPanel, false);
            RectTransform scoreRT = scoreGO.AddComponent<RectTransform>();
            scoreRT.anchorMin = new Vector2(0.02f, 0.35f);
            scoreRT.anchorMax = new Vector2(0.5f, 0.35f);
            scoreRT.pivot = new Vector2(0, 0.5f);
            scoreRT.sizeDelta = new Vector2(0, 30);

            _scoreText = scoreGO.AddComponent<Text>();
            _scoreText.text = "分数: 0";
            _scoreText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            _scoreText.fontSize = 20;
            _scoreText.color = new Color(1f, 0.9f, 0.3f);
            _scoreText.alignment = TextAnchor.MiddleLeft;

            GameObject barBgGO = new GameObject("ScoreBarBG");
            barBgGO.transform.SetParent(_hudPanel, false);
            Image barBg = barBgGO.AddComponent<Image>();
            barBg.color = new Color(0.3f, 0.3f, 0.4f);
            RectTransform barBgRT = barBgGO.GetComponent<RectTransform>();
            barBgRT.anchorMin = new Vector2(0.02f, 0.1f);
            barBgRT.anchorMax = new Vector2(0.5f, 0.1f);
            barBgRT.pivot = new Vector2(0, 0.5f);
            barBgRT.sizeDelta = new Vector2(0, 15);

            GameObject barFillGO = new GameObject("ScoreBarFill");
            barFillGO.transform.SetParent(barBgGO.transform, false);
            _scoreProgressBar = barFillGO.AddComponent<Image>();
            _scoreProgressBar.color = new Color(0.3f, 0.85f, 0.4f);
            _scoreProgressBar.type = Image.Type.Filled;
            _scoreProgressBar.fillMethod = Image.FillMethod.Horizontal;
            _scoreProgressBar.fillAmount = 0f;
            RectTransform barFillRT = barFillGO.GetComponent<RectTransform>();
            barFillRT.anchorMin = Vector2.zero;
            barFillRT.anchorMax = Vector2.one;
            barFillRT.offsetMin = Vector2.zero;
            barFillRT.offsetMax = Vector2.zero;

            if (_levelData.LimitType == LevelLimitType.Moves)
            {
                GameObject movesGO = new GameObject("MovesPanel");
                movesGO.transform.SetParent(_hudPanel, false);
                RectTransform movesRT = movesGO.AddComponent<RectTransform>();
                movesRT.anchorMin = new Vector2(0.98f, 0.6f);
                movesRT.anchorMax = new Vector2(0.98f, 0.6f);
                movesRT.pivot = new Vector2(1, 0.5f);
                movesRT.sizeDelta = new Vector2(200, 40);
                _movesText = movesGO.AddComponent<Text>();
                _movesText.text = $"步数: {_levelData.MaxMoves}";
                _movesText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                _movesText.fontSize = 26;
                _movesText.fontStyle = FontStyle.Bold;
                _movesText.color = Color.white;
                _movesText.alignment = TextAnchor.MiddleRight;
            }
            else if (_levelData.LimitType == LevelLimitType.Time)
            {
                GameObject timeGO = new GameObject("TimePanel");
                timeGO.transform.SetParent(_hudPanel, false);
                RectTransform timeRT = timeGO.AddComponent<RectTransform>();
                timeRT.anchorMin = new Vector2(0.98f, 0.6f);
                timeRT.anchorMax = new Vector2(0.98f, 0.6f);
                timeRT.pivot = new Vector2(1, 0.5f);
                timeRT.sizeDelta = new Vector2(200, 40);
                _timeText = timeGO.AddComponent<Text>();
                _timeText.text = $"时间: {_levelData.TimeLimitSeconds:F0}s";
                _timeText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                _timeText.fontSize = 26;
                _timeText.fontStyle = FontStyle.Bold;
                _timeText.color = new Color(1f, 0.5f, 0.5f);
                _timeText.alignment = TextAnchor.MiddleRight;
            }

            _pauseButton = CreateButton("暂停", new Vector2(0.98f, 0.2f), new Vector2(100, 40),
                new Vector2(1, 0.5f), new Color(0.6f, 0.6f, 0.7f), () => { OnPauseClicked(); });

            BuildGoalsPanel();
        }

        private void BuildGoalsPanel()
        {
            if (_levelData.CollectionTargets == null || _levelData.CollectionTargets.Count == 0)
            {
                GameObject panelGO = new GameObject("GoalsPanel");
                panelGO.transform.SetParent(_contentRoot, false);
                RectTransform panelRT = panelGO.AddComponent<RectTransform>();
                panelRT.anchorMin = new Vector2(0.5f, 0.92f);
                panelRT.anchorMax = new Vector2(0.5f, 0.92f);
                panelRT.pivot = new Vector2(0.5f, 1f);
                panelRT.sizeDelta = new Vector2(400, 60);
                Image panelBg = panelGO.AddComponent<Image>();
                panelBg.color = new Color(0.95f, 0.85f, 0.6f, 0.95f);

                Text hintText = panelGO.AddComponent<Text>();
                hintText.text = $"🎯 目标: 达到 {_levelData.OneStarScore:N0} 分";
                hintText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                hintText.fontSize = 22;
                hintText.fontStyle = FontStyle.Bold;
                hintText.color = new Color(0.4f, 0.3f, 0.1f);
                hintText.alignment = TextAnchor.MiddleCenter;
                RectTransform hintRT = hintText.GetComponent<RectTransform>();
                hintRT.anchorMin = Vector2.zero;
                hintRT.anchorMax = Vector2.one;
                hintRT.offsetMin = Vector2.zero;
                hintRT.offsetMax = Vector2.zero;
                return;
            }

            _goalsPanel = new GameObject("GoalsPanel").AddComponent<RectTransform>();
            _goalsPanel.transform.SetParent(_contentRoot, false);
            _goalsPanel.anchorMin = new Vector2(0.5f, 0.92f);
            _goalsPanel.anchorMax = new Vector2(0.5f, 0.92f);
            _goalsPanel.pivot = new Vector2(0.5f, 1f);
            float panelWidth = _levelData.CollectionTargets.Count * 160 + 40;
            _goalsPanel.sizeDelta = new Vector2(panelWidth, 90);
            Image goalsBg = _goalsPanel.gameObject.AddComponent<Image>();
            goalsBg.color = new Color(0.98f, 0.95f, 0.9f, 0.95f);

            for (int i = 0; i < _levelData.CollectionTargets.Count; i++)
            {
                MaterialRequirement req = _levelData.CollectionTargets[i];
                GameObject goalGO = new GameObject($"Goal_{req.MaterialId}");
                goalGO.transform.SetParent(_goalsPanel, false);
                RectTransform goalRT = goalGO.AddComponent<RectTransform>();
                goalRT.anchorMin = new Vector2(0, 0.5f);
                goalRT.anchorMax = new Vector2(0, 0.5f);
                goalRT.pivot = new Vector2(0, 0.5f);
                float x = 20f + i * 160f;
                goalRT.anchoredPosition = new Vector2(x, 0);
                goalRT.sizeDelta = new Vector2(140, 70);

                GameObject iconGO = new GameObject("Icon");
                iconGO.transform.SetParent(goalGO.transform, false);
                Image iconImage = iconGO.AddComponent<Image>();
                iconImage.color = req.TileType.GetTileColor();
                iconImage.sprite = Resources.GetBuiltinResource<Sprite>("UI/Skin/UISprite.psd");
                RectTransform iconRT = iconGO.GetComponent<RectTransform>();
                iconRT.anchorMin = new Vector2(0, 0);
                iconRT.anchorMax = new Vector2(0, 1);
                iconRT.pivot = new Vector2(0, 0.5f);
                iconRT.sizeDelta = new Vector2(50, 0);
                iconRT.offsetMin = new Vector2(10, 10);
                iconRT.offsetMax = new Vector2(10, -10);

                GameObject countGO = new GameObject("Count");
                countGO.transform.SetParent(goalGO.transform, false);
                Text countText = countGO.AddComponent<Text>();
                countText.text = $"0/{req.RequiredAmount}";
                countText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                countText.fontSize = 26;
                countText.fontStyle = FontStyle.Bold;
                countText.color = new Color(0.3f, 0.3f, 0.4f);
                countText.alignment = TextAnchor.MiddleLeft;
                RectTransform countRT = countGO.GetComponent<RectTransform>();
                countRT.anchorMin = new Vector2(0.4f, 0);
                countRT.anchorMax = new Vector2(1, 1);
                countRT.offsetMin = new Vector2(5, 5);
                countRT.offsetMax = new Vector2(-10, -5);
                countText.name = $"GoalText_{req.MaterialId}";
            }
        }

        private void BuildBoard()
        {
            GameObject boardGO = new GameObject("BoardContainer");
            boardGO.transform.SetParent(_contentRoot, false);
            RectTransform boardRT = boardGO.AddComponent<RectTransform>();
            boardRT.anchorMin = new Vector2(0.5f, 0.5f);
            boardRT.anchorMax = new Vector2(0.5f, 0.5f);
            boardRT.pivot = new Vector2(0.5f, 0.5f);
            boardRT.anchoredPosition = new Vector2(0, -30);
            float boardSize = Mathf.Min(_levelData.BoardWidth, _levelData.BoardHeight) * 110f;
            boardRT.sizeDelta = new Vector2(boardSize + 100, boardSize + 100);

            GameObject tileParentGO = new GameObject("TileParent");
            tileParentGO.transform.SetParent(boardGO.transform, false);
            RectTransform tileParentRT = tileParentGO.AddComponent<RectTransform>();
            tileParentRT.anchorMin = Vector2.zero;
            tileParentRT.anchorMax = Vector2.one;
            tileParentRT.offsetMin = Vector2.zero;
            tileParentRT.offsetMax = Vector2.zero;

            _boardManager = boardGO.AddComponent<BoardManager>();

            GameObject tilePrefabGO = new GameObject("TempTilePrefab");
            tilePrefabGO.SetActive(false);
            tilePrefabGO.AddComponent<RectTransform>();
            Image tileImage = tilePrefabGO.AddComponent<Image>();
            tileImage.color = Color.white;
            tileImage.sprite = Resources.GetBuiltinResource<Sprite>("UI/Skin/UISprite.psd");
            CanvasGroup tileCg = tilePrefabGO.AddComponent<CanvasGroup>();
            Tile tileComponent = tilePrefabGO.AddComponent<Tile>();

            GameObject highlightGO = new GameObject("Highlight");
            highlightGO.transform.SetParent(tilePrefabGO.transform, false);
            highlightGO.SetActive(false);
            Image highlightImage = highlightGO.AddComponent<Image>();
            highlightImage.color = new Color(1f, 1f, 0.5f, 0.5f);
            highlightImage.sprite = Resources.GetBuiltinResource<Sprite>("UI/Skin/UISprite.psd");
            RectTransform hrt = highlightGO.GetComponent<RectTransform>();
            hrt.anchorMin = Vector2.zero; hrt.anchorMax = Vector2.one;
            hrt.offsetMin = new Vector2(-5, -5); hrt.offsetMax = new Vector2(5, 5);

            tileComponent.SetupReferences(tileImage, highlightImage, tileCg);

            _boardManager.SetupReferences(boardRT, tileComponent, tileParentRT);
        }

        private void BuildLevelManager()
        {
            GameObject lmGO = new GameObject("LevelManager");
            _levelManager = lmGO.AddComponent<LevelManager>();

            _levelManager.OnScoreChanged += (score) => {
                if (_scoreText != null) _scoreText.text = $"分数: {score:N0}";
                if (_scoreProgressBar != null) _scoreProgressBar.fillAmount = _levelManager.GetScoreProgress();
            };
            _levelManager.OnMovesChanged += (moves) => {
                if (_movesText != null) _movesText.text = $"步数: {moves}";
            };
            _levelManager.OnTimeChanged += (time) => {
                if (_timeText != null) _timeText.text = $"时间: {Mathf.Max(0, time):F0}s";
            };
            _levelManager.OnMaterialCollected += (matId, amount) => {
                UpdateGoalDisplay(matId);
            };
            _levelManager.OnLevelEnded += (stars, success, score, coins, mats) => {
                ShowLevelResult(stars, success, score, coins, mats);
            };

            _levelManager.SetupBoardManager(_boardManager);
        }

        private void UpdateGoalDisplay(int materialId)
        {
            if (_goalsPanel == null) return;
            if (_levelManager == null) return;

            MaterialRequirement req = _levelData.CollectionTargets.Find(r => r.MaterialId == materialId);
            if (req == null) return;

            int remaining = _levelManager.GetRemainingMaterialTargets()
                .TryGetValue(materialId, out int r) ? r : 0;
            int collected = req.RequiredAmount - remaining;
            collected = Mathf.Max(0, collected);

            string textName = $"GoalText_{materialId}";
            Transform textTransform = _goalsPanel.Find($"Goal_{materialId}/Count(Clone)") ?? FindDeepChild(_goalsPanel, textName);
            if (textTransform != null)
            {
                Text t = textTransform.GetComponent<Text>();
                if (t != null)
                {
                    t.text = $"{collected}/{req.RequiredAmount}";
                    t.color = collected >= req.RequiredAmount ? new Color(0.2f, 0.7f, 0.3f) : new Color(0.3f, 0.3f, 0.4f);
                }
            }
        }

        private Transform FindDeepChild(Transform parent, string name)
        {
            foreach (Transform child in parent)
            {
                if (child.gameObject.name.StartsWith(name) || child.name == name)
                    return child;
                Transform found = FindDeepChild(child, name);
                if (found != null) return found;
            }
            return null;
        }

        private void StartLevel()
        {
            _levelManager.StartLevel(_levelData);
            UIManager.Instance?.UpdateCurrencyDisplay();
        }

        private void OnPauseClicked()
        {
            _levelManager.PauseLevel();
            UIManager.Instance?.ShowDialog(
                "游戏暂停",
                "休息一下吧~",
                "继续", "退出关卡",
                () => { _levelManager.ResumeLevel(); },
                () => {
                    _levelManager.QuitLevel();
                    GameFlowController.Instance?.GoToMainMenu();
                });
        }

        private void ShowLevelResult(int stars, bool success, int score, int coins, Dictionary<int, int> materials)
        {
            string title = success ? $"🎉 关卡通过! {GetStars(stars)}" : "😢 挑战失败";
            string content = "";

            if (success)
            {
                content = $"分数: {score:N0}\n" +
                          $"金币奖励: +{coins}\n\n" +
                          $"收集到的材料:\n";
                foreach (var kvp in materials)
                {
                    var mat = DataManager.Instance.GetMaterialById(kvp.Key);
                    string matName = mat != null ? mat.MaterialName : $"材料{kvp.Key}";
                    content += $"  • {matName} × {kvp.Value}\n";
                }
            }
            else
            {
                content = $"得分: {score:N0}\n\n再试一次吧！材料不够的话可过不了关哦~";
            }

            UIManager.Instance?.ShowDialog(title, content,
                success ? "进入装修" : "再试一次",
                success ? "返回主菜单" : "返回主菜单",
                () => {
                    if (success)
                    {
                        GameFlowController.Instance?.OnLevelComplete(
                            _levelData.LevelId, stars, score, coins, materials);
                    }
                    else
                    {
                        GameFlowController.Instance?.StartLevel(_levelData.LevelId);
                    }
                },
                () => {
                    if (!success)
                    {
                        GameFlowController.Instance?.OnLevelFail(_levelData.LevelId);
                    }
                    else
                    {
                        GameFlowController.Instance?.GoToMainMenu();
                    }
                });
        }

        private string GetStars(int count)
        {
            string s = "";
            for (int i = 0; i < 3; i++) s += i < count ? "⭐" : "☆";
            return s;
        }

        private Button CreateButton(string text, Vector2 anchor, Vector2 size, Vector2 pivot, Color color, Action onClick)
        {
            GameObject btnGO = new GameObject($"Button_{text}");
            btnGO.transform.SetParent(_hudPanel != null ? _hudPanel : _contentRoot, false);
            Image btnImage = btnGO.AddComponent<Image>();
            btnImage.color = color;
            btnImage.sprite = Resources.GetBuiltinResource<Sprite>("UI/Skin/UISprite.psd");
            btnImage.type = Image.Type.Sliced;
            Button btn = btnGO.AddComponent<Button>();
            ColorBlock cb = btn.colors;
            cb.normalColor = color;
            cb.highlightedColor = color * 1.1f;
            cb.pressedColor = color * 0.85f;
            btn.colors = cb;
            btn.onClick.AddListener(() => { onClick?.Invoke(); });
            RectTransform btnRT = btnGO.GetComponent<RectTransform>();
            btnRT.anchorMin = anchor;
            btnRT.anchorMax = anchor;
            btnRT.pivot = pivot;
            btnRT.sizeDelta = size;

            GameObject textGO = new GameObject("Text");
            textGO.transform.SetParent(btnGO.transform, false);
            Text btnText = textGO.AddComponent<Text>();
            btnText.text = text;
            btnText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            btnText.fontSize = 22;
            btnText.color = Color.white;
            btnText.alignment = TextAnchor.MiddleCenter;
            RectTransform textRT = textGO.GetComponent<RectTransform>();
            textRT.anchorMin = Vector2.zero;
            textRT.anchorMax = Vector2.one;
            textRT.offsetMin = Vector2.zero;
            textRT.offsetMax = Vector2.zero;

            return btn;
        }
    }
}
