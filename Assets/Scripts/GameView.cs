using System;
using System.Collections.Generic;
using UnityEngine;
using TeaGardenDefense.Core;
using TeaGardenDefense.Config;

namespace TeaGardenDefense
{
    public class GameView : MonoBehaviour
    {
        public static GameView Instance { get; private set; }

        [Header("View Settings")]
        public float slotButtonSize = 48f;
        public float enemyMarkerSize = 16f;
        public float towerMarkerSize = 40f;
        public float pathPointSize = 10f;
        public int bottomBarHeight = 120;
        public int topBarHeight = 80;

        private GameManager _gm;
        private Camera _cam;
        private bool _subscribed;

        private SettlementData _lastSettlement;
        private FailureReport _lastFailureReport;
        private bool _showSettlement;
        private bool _isVictory;

        private bool _pathEditMode;
        private List<Vector3> _editPathPoints;
        private int _draggingPathIndex = -1;

        private GUIStyle _labelStyle;
        private GUIStyle _buttonStyle;
        private GUIStyle _headerStyle;
        private GUIStyle _towerSlotStyle;
        private GUIStyle _toastStyle;
        private GUIStyle _logEntryStyle;
        private bool _stylesInit;

        private string _toastMessage;
        private float _toastTimer;

        private bool _showLogsPanel;
        private Vector2 _logScrollPos;
        private int _logTab; // 0=关键选择 1=存档状态 2=游玩统计

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            _cam = Camera.main;
            StartCoroutine(WaitAndInit());
        }

        private System.Collections.IEnumerator WaitAndInit()
        {
            while (GameManager.Instance == null) yield return null;
            while (!ConfigManager.Instance.IsLoaded) yield return null;
            _gm = GameManager.Instance;
            SubscribeAll();
            _gm.Hints.OnToastShown += msg => { _toastMessage = msg; _toastTimer = 2.5f; };
            Debug.Log("[GameView] 初始化完成，UI已就绪");
        }

        private void SubscribeAll()
        {
            if (_subscribed || _gm == null) return;
            _gm.Settlement.OnVictory += data => { _lastSettlement = data; _lastFailureReport = null; _isVictory = true; _showSettlement = true; };
            _gm.Settlement.OnDefeat += (data, report) => { _lastSettlement = data; _lastFailureReport = report; _isVictory = false; _showSettlement = true; };
            _gm.OnGameStateChanged += s => { if (s == GameState.Setup || s == GameState.Playing) _showSettlement = false; };
            _subscribed = true;
        }

        private void Update()
        {
            if (_gm == null) return;
            if (_toastTimer > 0) _toastTimer -= Time.unscaledDeltaTime;

            HandleMouseClick();
            HandlePathEdit();
        }

        private void InitStyles()
        {
            if (_stylesInit) return;
            _labelStyle = new GUIStyle(GUI.skin.label) { fontSize = 14, fontStyle = FontStyle.Bold, wordWrap = true, normal = { textColor = Color.white } };
            _buttonStyle = new GUIStyle(GUI.skin.button) { fontSize = 13, fontStyle = FontStyle.Bold };
            _headerStyle = new GUIStyle(GUI.skin.label) { fontSize = 18, fontStyle = FontStyle.Bold, alignment = TextAnchor.MiddleCenter, normal = { textColor = new Color(1, 0.95f, 0.5f) } };
            _towerSlotStyle = new GUIStyle(GUI.skin.box) { fontSize = 10, alignment = TextAnchor.LowerCenter, fontStyle = FontStyle.Bold };
            _toastStyle = new GUIStyle(GUI.skin.box) { fontSize = 16, alignment = TextAnchor.MiddleCenter, fontStyle = FontStyle.Bold, normal = { textColor = Color.white, background = MakeTex(1, 1, new Color(0, 0, 0, 0.7f)) } };
            _logEntryStyle = new GUIStyle(GUI.skin.label) { fontSize = 11, wordWrap = true, normal = { textColor = new Color(0.9f, 0.95f, 0.9f) } };
            _stylesInit = true;
        }

        private Texture2D MakeTex(int w, int h, Color c)
        {
            var t = new Texture2D(w, h);
            var px = new Color[w * h];
            for (int i = 0; i < px.Length; i++) px[i] = c;
            t.SetPixels(px); t.Apply();
            return t;
        }

        private Vector2 WorldToScreen(Vector3 world)
        {
            if (_cam == null) _cam = Camera.main;
            if (_cam == null) return Vector2.zero;
            Vector3 p = _cam.WorldToScreenPoint(world);
            return new Vector2(p.x, Screen.height - p.y);
        }

        private bool WorldInView(Vector3 world)
        {
            if (_cam == null) _cam = Camera.main;
            if (_cam == null) return false;
            Vector3 p = _cam.WorldToViewportPoint(world);
            return p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1 && p.z > 0;
        }

        private void HandleMouseClick()
        {
            if (_gm == null) return;
            if (EventSystemCurrentOverUI()) return;

            if (_pathEditMode) return;

            if (Input.GetMouseButtonDown(0))
            {
                Vector2 mouse = Input.mousePosition;
                Vector3 world = ScreenToWorldGround(mouse);

                foreach (var slot in _gm.Towers.GetAllSlots())
                {
                    Vector3 slotPos = new Vector3(slot.x, slot.y, slot.z);
                    if (Vector3.Distance(world, slotPos) < 1.2f)
                    {
                        _gm.SelectSlot(slot.slotId);
                        return;
                    }
                }
            }

            if (Input.GetMouseButtonDown(1))
            {
                _gm.SelectTowerId(null);
            }
        }

        private bool EventSystemCurrentOverUI()
        {
            var es = UnityEngine.EventSystems.EventSystem.current;
            return es != null && es.IsPointerOverGameObject();
        }

        private Vector3 ScreenToWorldGround(Vector2 screenPos)
        {
            if (_cam == null) _cam = Camera.main;
            if (_cam == null) return Vector3.zero;
            Plane ground = new Plane(Vector3.up, Vector3.zero);
            Ray r = _cam.ScreenPointToRay(screenPos);
            if (ground.Raycast(r, out float d)) return r.GetPoint(d);
            return Vector3.zero;
        }

        private void HandlePathEdit()
        {
            if (!_pathEditMode || _editPathPoints == null || _gm == null) return;

            if (Input.GetMouseButtonDown(0))
            {
                Vector3 world = ScreenToWorldGround(Input.mousePosition);
                world.y = 0;

                for (int i = 0; i < _editPathPoints.Count; i++)
                {
                    if (Vector3.Distance(world, _editPathPoints[i]) < 1.5f)
                    {
                        _draggingPathIndex = i;
                        break;
                    }
                }
            }

            if (Input.GetMouseButton(0) && _draggingPathIndex >= 0)
            {
                Vector3 world = ScreenToWorldGround(Input.mousePosition);
                world.y = 0;
                _editPathPoints[_draggingPathIndex] = world;
            }

            if (Input.GetMouseButtonUp(0))
            {
                _draggingPathIndex = -1;
            }
        }

        private void OnGUI()
        {
            InitStyles();
            if (_gm == null) { DrawLoading(); return; }
            if (_gm.CurrentLevel == null) return;

            DrawTopHUD();
            DrawBottomTowerBar();
            DrawPath();
            DrawTowerSlots();
            DrawTowers();
            DrawEnemies();
            DrawTutorialHints();
            DrawToast();
            DrawSelectionInfo();
            DrawPathEditUI();
            if (_showSettlement) DrawSettlementPanel();
            if (_showLogsPanel) DrawLogsPanel();
        }

        private void DrawLoading()
        {
            GUI.Label(new Rect(Screen.width / 2 - 100, Screen.height / 2 - 20, 200, 40), "🏯 茶园塔防 加载中...", _headerStyle);
        }

        private void DrawTopHUD()
        {
            int w = Screen.width;
            GUI.Box(new Rect(0, 0, w, topBarHeight), GUIContent.none);
            GUI.color = new Color(0, 0, 0, 0.75f);
            GUI.DrawTexture(new Rect(0, 0, w, topBarHeight), MakeTex(1, 1, new Color(0.1f, 0.2f, 0.1f, 0.85f)));
            GUI.color = Color.white;

            int x = 15, y = 10;
            GUI.Label(new Rect(x, y, 220, 28), $"🏞️ {_gm.CurrentLevel.levelName}", _labelStyle);
            x += 230;

            var res = _gm.Resources;
            GUI.Label(new Rect(x, y, 100, 28), $"💰 {res.Gold}", _labelStyle); x += 110;
            GUI.Label(new Rect(x, y, 140, 28), $"🏠 {res.BaseHealth}/{res.MaxBaseHealth}", _labelStyle); x += 150;

            var waves = _gm.Waves;
            string waveInfo = waves.IsWaveActive ? $"{waves.CurrentWaveNumber}/{waves.TotalWaves} ⚔️" : $"{waves.CurrentWaveNumber}/{waves.TotalWaves} ⏸️";
            GUI.Label(new Rect(x, y, 120, 28), $"🌊 {waveInfo}", _labelStyle); x += 130;

            GUI.Label(new Rect(x, y, 100, 28), $"🌤️ {_gm.Weather.CurrentWeatherName}", _labelStyle); x += 110;
            GUI.Label(new Rect(x, y, 90, 28), $"⏱️ {res.ElapsedTime:F0}s", _labelStyle); x += 100;

            string levelKey = _gm.CurrentLevel.levelId;
            int fails = SaveSystem.Instance.FailureCounts.ContainsKey(levelKey) ? SaveSystem.Instance.FailureCounts[levelKey] : 0;
            GUI.Label(new Rect(x, y, 80, 28), $"💀 {fails}", _labelStyle); x += 90;
            GUI.Label(new Rect(x, y, 100, 28), $"⚡ {_gm.TimeScale}x", _labelStyle);

            int btnX = w - 420, btnY = 15, btnW = 90, btnH = 30;
            Color oldC = GUI.backgroundColor;
            if (_showLogsPanel) GUI.backgroundColor = new Color(0.9f, 0.75f, 0.3f, 1f);
            if (GUI.Button(new Rect(btnX, btnY, 100, btnH), "📝 日志/存档", _buttonStyle))
                _showLogsPanel = !_showLogsPanel;
            GUI.backgroundColor = oldC;
            btnX += 106;
            if (GUI.Button(new Rect(btnX, btnY, btnW, btnH), "⏭️ 波次(Space)", _buttonStyle))
                _gm.StartNextWave();
            btnX += btnW + 6;
            if (GUI.Button(new Rect(btnX, btnY, btnW, btnH), "⏩ 加速(Shift)", _buttonStyle))
            {
                float ts = _gm.TimeScale > 1f ? 1f : 2f;
                _gm.SetTimeScale(ts);
            }
            btnX += btnW + 6;
            if (GUI.Button(new Rect(btnX, btnY, btnW, btnH), "⏸️ 暂停(ESC)", _buttonStyle))
                _gm.TogglePause();
        }

        private void DrawBottomTowerBar()
        {
            int w = Screen.width;
            int barTop = Screen.height - bottomBarHeight;
            GUI.DrawTexture(new Rect(0, barTop, w, bottomBarHeight), MakeTex(1, 1, new Color(0.08f, 0.12f, 0.08f, 0.9f)));

            var ids = _gm.CurrentLevel.availableTowerIds;
            if (ids == null) return;
            int count = ids.Count;
            int slotW = 120, gap = 10;
            int totalW = count * slotW + (count - 1) * gap;
            int startX = (w - totalW) / 2;
            int y = barTop + 10;

            for (int i = 0; i < count; i++)
            {
                string towerId = ids[i];
                var cfg = ConfigManager.Instance.GetTowerConfig(towerId);
                if (cfg == null) continue;

                int x = startX + i * (slotW + gap);
                bool selected = _gm.SelectedTowerId == towerId;
                Color oldBg = GUI.backgroundColor;
                GUI.backgroundColor = selected ? new Color(0.6f, 0.9f, 0.4f, 0.9f) : (_gm.Resources.CanAfford(cfg.baseCost) ? new Color(0.3f, 0.55f, 0.3f, 0.9f) : new Color(0.5f, 0.3f, 0.3f, 0.9f));

                if (GUI.Button(new Rect(x, y, slotW, bottomBarHeight - 40), GetTowerIcon(cfg.type) + "\n" + cfg.towerName, _towerSlotStyle))
                {
                    _gm.SelectTowerId(towerId);
                }
                GUI.backgroundColor = oldBg;

                GUI.Label(new Rect(x + 5, y + bottomBarHeight - 60, slotW - 10, 20), $"💰{cfg.baseCost}  攻{cfg.levels[0].damage}", new GUIStyle(GUI.skin.label) { fontSize = 11, alignment = TextAnchor.MiddleCenter, normal = { textColor = Color.white } });
                GUI.Label(new Rect(x, y + bottomBarHeight - 30, slotW, 20), $"[{i + 1}] 射程{cfg.levels[0].range:F0}", new GUIStyle(GUI.skin.label) { fontSize = 10, alignment = TextAnchor.MiddleCenter, normal = { textColor = new Color(0.85f, 1f, 0.85f) } });
            }

            int editX = w - 200, editY = barTop + 15, editW = 80, editH = 30;
            if (GUI.Button(new Rect(editX, editY, editW, editH), _pathEditMode ? "✅ 保存路径" : "🛠️ 编辑路径", _buttonStyle))
            {
                TogglePathEdit();
            }
            editX += editW + 10;
            if (GUI.Button(new Rect(editX, editY, 90, editH), "🔄 重玩(F5)", _buttonStyle))
            {
                _gm.RestartLevel();
            }
        }

        private string GetTowerIcon(TowerType t)
        {
            switch (t)
            {
                case TowerType.SingleTarget: return "🏹";
                case TowerType.Splash: return "💧";
                case TowerType.Slow: return "❄️";
                case TowerType.Poison: return "☠️";
                case TowerType.AreaOfEffect: return "🌪️";
                default: return "🗼";
            }
        }

        private void DrawPath()
        {
            var points = _pathEditMode ? _editPathPoints : GetCurrentPathPoints();
            if (points == null || points.Count < 2) return;

            HandlesLineStart();
            for (int i = 0; i < points.Count - 1; i++)
            {
                if (!WorldInView(points[i]) && !WorldInView(points[i + 1])) continue;
                Vector2 s1 = WorldToScreen(points[i]);
                Vector2 s2 = WorldToScreen(points[i + 1]);
                DrawScreenLine(s1, s2, _pathEditMode ? new Color(0.9f, 0.7f, 0.2f) : new Color(0.75f, 0.6f, 0.35f), 5f);
            }
            HandlesLineEnd();

            for (int i = 0; i < points.Count; i++)
            {
                if (!WorldInView(points[i])) continue;
                Vector2 sp = WorldToScreen(points[i]);
                GUI.color = _pathEditMode ? new Color(1f, 0.85f, 0.2f) : new Color(0.85f, 0.7f, 0.45f);
                GUI.DrawTexture(new Rect(sp.x - pathPointSize / 2, sp.y - pathPointSize / 2, pathPointSize, pathPointSize),
                    MakeTex(1, 1, GUI.color));
            }
            GUI.color = Color.white;

            if (points.Count >= 1)
            {
                Vector2 start = WorldToScreen(points[0]);
                Vector2 end = WorldToScreen(points[points.Count - 1]);
                GUI.Label(new Rect(start.x - 20, start.y - 28, 40, 24), "🐛", new GUIStyle(GUI.skin.label) { fontSize = 20, alignment = TextAnchor.MiddleCenter });
                GUI.Label(new Rect(end.x - 20, end.y - 28, 40, 24), "🏠", new GUIStyle(GUI.skin.label) { fontSize = 20, alignment = TextAnchor.MiddleCenter });
            }
        }

        private List<Vector3> GetCurrentPathPoints()
        {
            var cfg = _gm?.CurrentLevel;
            if (cfg == null) return new List<Vector3>();
            var list = new List<Vector3>();
            foreach (var p in cfg.pathPoints) list.Add(new Vector3(p.x, p.y, p.z));
            if (_gm?.Path != null && _gm.Path.IsInitialized)
            {
                list.Clear();
                for (int i = 0; i < _gm.Path.PointCount; i++)
                {
                    float d = (float)i / Mathf.Max(1, _gm.Path.PointCount - 1) * _gm.Path.TotalLength;
                    list.Add(_gm.Path.GetPointAtDistance(d));
                }
            }
            return list;
        }

        private void DrawTowerSlots()
        {
            foreach (var slot in _gm.Towers.GetAllSlots())
            {
                Vector3 wpos = new Vector3(slot.x, slot.y, slot.z);
                if (!WorldInView(wpos)) continue;
                Vector2 spos = WorldToScreen(wpos);

                var existing = _gm.Towers.GetTower(slot.slotId);
                bool isSelected = _gm.SelectedSlotId == slot.slotId;
                Color c;
                if (existing != null) continue;
                else if (!slot.isUnlocked) c = new Color(0.4f, 0.3f, 0.1f, 0.65f);
                else if (isSelected) c = new Color(0.95f, 0.75f, 0.3f, 0.9f);
                else if (!string.IsNullOrEmpty(_gm.SelectedTowerId)) c = new Color(0.55f, 0.9f, 0.45f, 0.7f);
                else c = new Color(0.4f, 0.45f, 0.35f, 0.55f);

                GUI.color = c;
                GUI.DrawTexture(new Rect(spos.x - slotButtonSize / 2, spos.y - slotButtonSize / 2, slotButtonSize, slotButtonSize),
                    MakeTex(1, 1, c));
                GUI.color = Color.white;

                string label;
                if (!slot.isUnlocked) label = $"🔒{slot.unlockCost}";
                else label = isSelected ? "✅" : "+";
                GUI.Label(new Rect(spos.x - slotButtonSize / 2, spos.y - slotButtonSize / 2, slotButtonSize, slotButtonSize),
                    label, new GUIStyle(GUI.skin.label) { fontSize = 20, alignment = TextAnchor.MiddleCenter, fontStyle = FontStyle.Bold, normal = { textColor = Color.white } });

                if (!slot.isUnlocked || !string.IsNullOrEmpty(_gm.SelectedTowerId))
                {
                    string hint = !slot.isUnlocked ? $"解锁:{slot.unlockCost}" : "点此建塔";
                    GUI.Label(new Rect(spos.x - 40, spos.y - slotButtonSize / 2 - 20, 80, 18), hint,
                        new GUIStyle(GUI.skin.label) { fontSize = 10, alignment = TextAnchor.MiddleCenter, normal = { textColor = new Color(1, 1, 0.7f) } });
                }
            }
        }

        private void DrawTowers()
        {
            foreach (var slot in _gm.Towers.GetAllSlots())
            {
                var tower = _gm.Towers.GetTower(slot.slotId);
                if (tower == null) continue;
                Vector3 wpos = new Vector3(slot.x, slot.y, slot.z);
                if (!WorldInView(wpos)) continue;
                Vector2 spos = WorldToScreen(wpos);
                bool isSel = _gm.SelectedSlotId == slot.slotId;

                if (isSel)
                {
                    float rangePx = WorldDistanceToScreenPixels(wpos, tower.GetEffectiveRange());
                    GUI.color = new Color(0.3f, 0.8f, 0.3f, 0.18f);
                    DrawCircle(spos, rangePx);
                    GUI.color = new Color(0.3f, 0.9f, 0.4f, 0.9f);
                    DrawCircleOutline(spos, rangePx, 2f);
                }

                Color bg = isSel ? new Color(0.5f, 0.85f, 0.4f, 0.95f) : new Color(0.3f, 0.55f, 0.3f, 0.9f);
                GUI.color = bg;
                GUI.DrawTexture(new Rect(spos.x - towerMarkerSize / 2, spos.y - towerMarkerSize / 2, towerMarkerSize, towerMarkerSize), MakeTex(1, 1, bg));
                GUI.color = Color.white;

                GUI.Label(new Rect(spos.x - towerMarkerSize / 2, spos.y - towerMarkerSize / 2, towerMarkerSize, towerMarkerSize),
                    GetTowerIcon(tower.Config.type),
                    new GUIStyle(GUI.skin.label) { fontSize = 22, alignment = TextAnchor.MiddleCenter });

                string lvl = new string('★', tower.CurrentLevel);
                GUI.Label(new Rect(spos.x - towerMarkerSize / 2, spos.y + towerMarkerSize / 2 - 16, towerMarkerSize, 16),
                    lvl, new GUIStyle(GUI.skin.label) { fontSize = 12, alignment = TextAnchor.MiddleCenter, fontStyle = FontStyle.Bold, normal = { textColor = new Color(1, 0.85f, 0.2f) } });

                GUI.Label(new Rect(spos.x - towerMarkerSize / 2, spos.y - towerMarkerSize / 2 - 18, towerMarkerSize, 16),
                    $"Lv{tower.CurrentLevel} 🔪{tower.GetEffectiveDamage():F0}",
                    new GUIStyle(GUI.skin.label) { fontSize = 9, alignment = TextAnchor.MiddleCenter, normal = { textColor = Color.white } });
            }
        }

        private float WorldDistanceToScreenPixels(Vector3 center, float worldDist)
        {
            Vector3 p1 = center;
            Vector3 p2 = center + _cam.transform.right * worldDist;
            Vector2 s1 = WorldToScreen(p1);
            Vector2 s2 = WorldToScreen(p2);
            return Vector2.Distance(s1, s2);
        }

        private void DrawEnemies()
        {
            foreach (var e in _gm.Enemies.GetActiveEnemies())
            {
                if (!e.IsAlive) continue;
                if (!WorldInView(e.Position)) continue;
                Vector2 spos = WorldToScreen(e.Position);

                Color hpC = e.CurrentHealth / e.MaxHealth > 0.5f ? new Color(0.4f, 0.9f, 0.4f) : (e.CurrentHealth / e.MaxHealth > 0.25f ? new Color(0.9f, 0.75f, 0.2f) : new Color(0.95f, 0.35f, 0.3f));
                float hpRatio = Mathf.Clamp01(e.CurrentHealth / e.MaxHealth);

                GUI.color = e.Config.type == EnemyType.Boss ? new Color(0.85f, 0.25f, 0.25f, 0.95f) : e.Config.type == EnemyType.Flying ? new Color(0.6f, 0.5f, 0.9f, 0.95f) : new Color(0.75f, 0.45f, 0.2f, 0.95f);
                float s = e.Config.type == EnemyType.Boss ? enemyMarkerSize * 1.8f : (e.Config.type == EnemyType.Tank ? enemyMarkerSize * 1.4f : enemyMarkerSize);
                GUI.DrawTexture(new Rect(spos.x - s / 2, spos.y - s / 2, s, s), MakeTex(1, 1, GUI.color));
                GUI.color = Color.white;

                string icon = e.Config.type == EnemyType.Boss ? "👑" : e.Config.type == EnemyType.Flying ? "🦋" : e.Config.type == EnemyType.Tank ? "🪲" : "🐛";
                GUI.Label(new Rect(spos.x - s / 2, spos.y - s / 2, s, s), icon,
                    new GUIStyle(GUI.skin.label) { fontSize = Mathf.RoundToInt(s * 0.7f), alignment = TextAnchor.MiddleCenter });

                float barW = 40f, barH = 5f;
                GUI.color = new Color(0.15f, 0.15f, 0.15f, 0.8f);
                GUI.DrawTexture(new Rect(spos.x - barW / 2, spos.y - s / 2 - 12, barW, barH), MakeTex(1, 1, GUI.color));
                GUI.color = hpC;
                GUI.DrawTexture(new Rect(spos.x - barW / 2, spos.y - s / 2 - 12, barW * hpRatio, barH), MakeTex(1, 1, GUI.color));
                GUI.color = Color.white;
            }
        }

        private void DrawTutorialHints()
        {
            var t = _gm.Tutorial;
            if (!t.TutorialActive || t.ActiveStep == null) return;
            var step = t.ActiveStep;

            int panelW = 560, panelH = 180;
            int x = (Screen.width - panelW) / 2;
            int y = topBarHeight + 40;

            GUI.color = new Color(0.05f, 0.1f, 0.05f, 0.92f);
            GUI.DrawTexture(new Rect(x, y, panelW, panelH), MakeTex(1, 1, GUI.color));
            GUI.color = Color.white;
            GUI.Box(new Rect(x, y, panelW, panelH), "📖 教程提示");

            GUI.Label(new Rect(x + 20, y + 35, panelW - 40, 30),
                $"[{t.CurrentStepIndex + 1}/{t.TotalSteps}] {step.title}", _headerStyle);
            GUI.Label(new Rect(x + 20, y + 70, panelW - 40, 70),
                step.message + $"\n\n⏭️ 按 Enter 或点击继续...",
                new GUIStyle(GUI.skin.label) { fontSize = 14, wordWrap = true, normal = { textColor = Color.white } });

            if (GUI.Button(new Rect(x + panelW / 2 - 60, y + panelH - 42, 120, 32), "✅ 下一步 (Enter)", _buttonStyle)
                || Event.current.keyCode == KeyCode.Return)
            {
                t.CompleteCurrentStep();
            }

            if (GUI.Button(new Rect(x + panelW - 90, y + 8, 80, 24), "跳过▶", new GUIStyle(GUI.skin.button) { fontSize = 11 }))
            {
                t.SkipTutorial();
            }
        }

        private void DrawToast()
        {
            if (_toastTimer <= 0 || string.IsNullOrEmpty(_toastMessage)) return;
            int w = 400, h = 40;
            GUI.color = new Color(0, 0, 0, Mathf.Min(0.8f, _toastTimer / 2.5f * 0.8f));
            GUI.DrawTexture(new Rect(Screen.width / 2 - w / 2, Screen.height / 2 - h / 2, w, h), MakeTex(1, 1, GUI.color));
            GUI.color = new Color(1, 1, 1, Mathf.Min(1f, _toastTimer / 2.5f));
            GUI.Label(new Rect(Screen.width / 2 - w / 2, Screen.height / 2 - h / 2, w, h), _toastMessage, _toastStyle);
            GUI.color = Color.white;
        }

        private void DrawSelectionInfo()
        {
            if (string.IsNullOrEmpty(_gm.SelectedSlotId)) return;
            var slot = _gm.Towers.GetSlot(_gm.SelectedSlotId);
            var tower = _gm.Towers.GetTower(_gm.SelectedSlotId);

            int w = 260, h = 150;
            int x = 15, y = topBarHeight + 15;
            GUI.color = new Color(0, 0, 0, 0.82f);
            GUI.DrawTexture(new Rect(x, y, w, h), MakeTex(1, 1, GUI.color));
            GUI.color = Color.white;
            GUI.Box(new Rect(x, y, w, h), "🎯 选中信息");

            if (tower != null)
            {
                GUI.Label(new Rect(x + 10, y + 28, w - 20, 22), $"{GetTowerIcon(tower.Config.type)} {tower.Config.towerName} Lv.{tower.CurrentLevel}/{tower.Config.levels.Count}", _labelStyle);
                GUI.Label(new Rect(x + 10, y + 50, w - 20, 20), $"🔪 伤害: {tower.GetEffectiveDamage():F1}", _labelStyle);
                GUI.Label(new Rect(x + 10, y + 70, w - 20, 20), $"🎯 射程: {tower.GetEffectiveRange():F1}", _labelStyle);
                GUI.Label(new Rect(x + 10, y + 90, w - 20, 20), $"⚡ 射速: {1f / tower.GetEffectiveFireRate():F1}/s", _labelStyle);

                int buy = 120, btnH = 30;
                int by = y + h - 40;
                if (tower.CanUpgrade)
                {
                    int cost = tower.GetUpgradeCost();
                    if (GUI.Button(new Rect(x + 10, by, buy, btnH), $"⬆️ 升级 U ({cost})", _buttonStyle))
                        _gm.UpgradeSelectedTower();
                }
                if (GUI.Button(new Rect(x + 10 + buy + 10, by, buy, btnH), $"💸 出售 S (+{tower.GetSellValue()})", _buttonStyle))
                    _gm.SellSelectedTower();
            }
            else if (slot != null)
            {
                if (!slot.isUnlocked)
                {
                    GUI.Label(new Rect(x + 10, y + 28, w - 20, 22), $"🔒 塔位未解锁", _labelStyle);
                    GUI.Label(new Rect(x + 10, y + 50, w - 20, 20), $"解锁花费: {slot.unlockCost}金", _labelStyle);
                    if (GUI.Button(new Rect(x + 10, y + h - 40, w - 20, 30), "🔓 解锁塔位", _buttonStyle))
                        _gm.UnlockSlot();
                }
                else
                {
                    GUI.Label(new Rect(x + 10, y + 28, w - 20, 22), "⬜ 空塔位", _labelStyle);
                    GUI.Label(new Rect(x + 10, y + 50, w - 20, 40), string.IsNullOrEmpty(_gm.SelectedTowerId)
                        ? "在下方塔型条选择一种塔\n然后点击此塔位建造"
                        : $"准备建造: {ConfigManager.Instance.GetTowerConfig(_gm.SelectedTowerId)?.towerName}",
                        new GUIStyle(GUI.skin.label) { fontSize = 12, wordWrap = true, normal = { textColor = new Color(0.9f, 1f, 0.8f) } });
                }
            }
        }

        private void DrawPathEditUI()
        {
            if (!_pathEditMode || _editPathPoints == null) return;

            GUI.color = new Color(1, 0.2f, 0.2f, 0.9f);
            GUI.Box(new Rect(Screen.width / 2 - 150, 80, 300, 30), "⚠️ 路径编辑模式 - 拖拽黄点改路线", _toastStyle);
            GUI.color = Color.white;

            int x = 15, y = topBarHeight + 180, w = 260, h = 120;
            GUI.color = new Color(0.1f, 0.08f, 0.02f, 0.9f);
            GUI.DrawTexture(new Rect(x, y, w, h), MakeTex(1, 1, GUI.color));
            GUI.color = Color.white;
            GUI.Box(new Rect(x, y, w, h), "🛠️ 路径编辑");

            GUI.Label(new Rect(x + 10, y + 28, w - 20, 20), $"点数: {_editPathPoints.Count}", _labelStyle);
            int bw = 110, bh = 26;
            if (GUI.Button(new Rect(x + 10, y + 55, bw, bh), "➕ 在末尾加点", _buttonStyle))
            {
                Vector3 last = _editPathPoints.Count > 0 ? _editPathPoints[_editPathPoints.Count - 1] : Vector3.zero;
                _editPathPoints.Add(last + new Vector3(2, 0, 0));
            }
            if (GUI.Button(new Rect(x + 10 + bw + 8, y + 55, bw, bh), "➖ 删除末尾点", _buttonStyle))
            {
                if (_editPathPoints.Count > 2) _editPathPoints.RemoveAt(_editPathPoints.Count - 1);
            }
            if (GUI.Button(new Rect(x + 10, y + 55 + bh + 6, bw, bh), "↩️ 还原默认", _buttonStyle))
            {
                ResetEditPathToDefault();
            }
            if (GUI.Button(new Rect(x + 10 + bw + 8, y + 55 + bh + 6, bw, bh), "✅ 保存应用", _buttonStyle))
            {
                ApplyEditPath();
            }
        }

        private void TogglePathEdit()
        {
            _pathEditMode = !_pathEditMode;
            if (_pathEditMode)
            {
                ResetEditPathToDefault();
                _gm.Hints?.ShowToast("进入路径编辑模式：拖动路径点修改路线");
            }
            else
            {
                ApplyEditPath();
            }
        }

        private void ResetEditPathToDefault()
        {
            _editPathPoints = new List<Vector3>();
            foreach (var p in _gm.CurrentLevel.pathPoints)
                _editPathPoints.Add(new Vector3(p.x, p.y, p.z));
        }

        private void ApplyEditPath()
        {
            if (_editPathPoints == null || _editPathPoints.Count < 2)
            {
                _gm.Hints?.ShowToast("路径至少需要2个点");
                return;
            }
            _gm.Path.SetCustomPath(_editPathPoints);
            var level = _gm.CurrentLevel;
            level.pathPoints.Clear();
            foreach (var p in _editPathPoints)
                level.pathPoints.Add(new PathPoint { x = p.x, y = p.y, z = p.z });
            string levelId = level.levelId;
            int expectedCount = _editPathPoints.Count;
            var expectedPts = new List<Vector3>(_editPathPoints);
            ConfigManager.Instance.UpdateLevelConfig(level);

            try
            {
                ConfigManager.Instance.SaveConfigToDisk();
                ConfigManager.Instance.ReloadConfig();
                var diskLevel = ConfigManager.Instance.GetLevelConfig(levelId);
                bool match = true;
                string details = "";
                if (diskLevel == null) { match = false; details = "磁盘未找到该关卡"; }
                else if (diskLevel.pathPoints.Count != expectedCount)
                {
                    match = false;
                    details = $"点数不一致(内存{expectedCount}≠磁盘{diskLevel.pathPoints.Count})";
                }
                else
                {
                    for (int i = 0; i < expectedCount; i++)
                    {
                        var a = expectedPts[i];
                        var b = diskLevel.pathPoints[i];
                        if (Vector3.Distance(a, new Vector3(b.x, b.y, b.z)) > 0.001f)
                        {
                            match = false;
                            details = $"点#{i}坐标不一致 (内存{a:F2}≠磁盘({b.x:F2},{b.y:F2},{b.z:F2}))";
                            break;
                        }
                    }
                }
                if (match)
                    _gm.Hints?.ShowToast($"✅ 路径持久化成功 ({expectedCount}点, 磁盘验证一致, 重启不丢失)");
                else
                    _gm.Hints?.ShowToast($"⚠️ 路径已保存但验证失败: {details}");
            }
            catch (Exception e)
            {
                _gm.Hints?.ShowToast($"路径已更新(内存), 写盘失败: {e.Message}");
                Debug.LogWarning($"[路径编辑] 保存到磁盘失败: {e}");
            }
        }

        private void DrawSettlementPanel()
        {
            int w = 620, h = 460;
            int x = (Screen.width - w) / 2, y = (Screen.height - h) / 2;

            var dimColor = new Color(0, 0, 0, 0.55f);
            GUI.DrawTexture(new Rect(0, 0, Screen.width, Screen.height), MakeTex(1, 1, dimColor));

            Color panelBg = _isVictory ? new Color(0.15f, 0.25f, 0.1f, 0.95f) : new Color(0.3f, 0.12f, 0.1f, 0.95f);
            GUI.color = panelBg;
            GUI.DrawTexture(new Rect(x, y, w, h), MakeTex(1, 1, panelBg));
            GUI.color = Color.white;
            GUI.Box(new Rect(x, y, w, h), _isVictory ? "🏆 关卡胜利！" : "💔 关卡失败");

            var d = _lastSettlement;
            if (d == null) return;

            int ty = y + 40;
            GUI.Label(new Rect(x + 20, ty, w - 40, 32), d.levelName + "  -  " + (_isVictory ? "🎉 成功通关" : "😵 挑战失败"),
                new GUIStyle(GUI.skin.label) { fontSize = 20, alignment = TextAnchor.MiddleCenter, fontStyle = FontStyle.Bold, normal = { textColor = _isVictory ? new Color(0.85f, 1f, 0.5f) : new Color(1f, 0.7f, 0.7f) } });
            ty += 40;

            if (_isVictory)
            {
                string stars = new string('⭐', d.starsEarned) + new string('☆', 3 - d.starsEarned);
                GUI.Label(new Rect(x + 20, ty, w - 40, 36), stars, new GUIStyle(GUI.skin.label) { fontSize = 28, alignment = TextAnchor.MiddleCenter });
                ty += 44;
                GUI.Label(new Rect(x + 20, ty, w - 40, 24), $"得分: {d.score} / {d.perfectScore}",
                    new GUIStyle(GUI.skin.label) { fontSize = 16, alignment = TextAnchor.MiddleCenter, normal = { textColor = new Color(1, 0.95f, 0.5f) } });
                ty += 30;
            }

            ty += 6;
            GUI.BeginGroup(new Rect(x + 20, ty, w - 40, 180));
            int gy = 0, rowH = 24, col1 = 0, col2 = 300;
            DrawStat(ref gy, col1, "⏱️ 用时", $"{d.totalPlayTime:F1} 秒");
            DrawStat(ref gy, col2, "💀 累计失败", $"{GetFailCount(d.levelId)} 次");
            DrawStat(ref gy, col1, "🐛 击杀敌人", $"{d.enemiesKilled}");
            DrawStat(ref gy, col2, "🏃 漏网害虫", $"{d.enemiesPassed}");
            DrawStat(ref gy, col1, "🏠 基地血量", $"{d.remainingBaseHealth}/{d.maxBaseHealth}");
            DrawStat(ref gy, col2, "🌊 完成波次", $"{d.wavesCompleted}/{d.totalWaves}");
            DrawStat(ref gy, col1, "🗼 建造塔数", $"{d.towersBuilt} (平均Lv{d.averageTowerLevel})");
            DrawStat(ref gy, col2, "🔥 总DPS", $"{d.totalDPS}");
            DrawStat(ref gy, col1, "💰 剩余金币", $"{d.remainingGold}");
            DrawStat(ref gy, col2, "📈 关卡难度", $"{new string('★', Mathf.Clamp(d.difficulty, 1, 5))}");
            GUI.EndGroup();
            ty += 180;

            if (!_isVictory && _lastFailureReport != null)
            {
                GUI.Label(new Rect(x + 20, ty, w - 40, 22),
                    $"🔎 失败原因: {_lastFailureReport.primaryReasonName} ({_lastFailureReport.primaryScore:F0}分)",
                    new GUIStyle(GUI.skin.label) { fontSize = 13, fontStyle = FontStyle.Bold, normal = { textColor = new Color(1f, 0.75f, 0.5f) } });
                ty += 26;
                string advice = _lastFailureReport.replayAdvice != null && _lastFailureReport.replayAdvice.Count > 0
                    ? string.Join("\n", _lastFailureReport.replayAdvice)
                    : "分析暂无详细建议";
                GUI.Label(new Rect(x + 20, ty, w - 40, 38), $"💡 {advice}",
                    new GUIStyle(GUI.skin.label) { fontSize = 12, wordWrap = true, normal = { textColor = new Color(0.8f, 0.95f, 1f) } });
                ty += 44;
            }

            string key = d.levelId;
            var completion = SaveSystem.Instance.GetLevelCompletion(key);
            if (completion != null)
            {
                GUI.Label(new Rect(x + 20, ty, w - 40, 20),
                    $"📊 历史最佳: 用时{completion.bestTimeSeconds:F1}s / 最高{completion.highestScore}分 / {new string('⭐', completion.starsEarned)}星 / 游玩{completion.playCount}次",
                    new GUIStyle(GUI.skin.label) { fontSize = 11, alignment = TextAnchor.MiddleCenter, normal = { textColor = new Color(0.85f, 0.85f, 0.95f) } });
                ty += 26;
            }

            int bw = 180, bh = 40;
            int bx = x + w / 2 - bw - 10;
            if (GUI.Button(new Rect(bx, y + h - 60, bw, bh), "🔄 重玩本关 (F5)", _buttonStyle))
            {
                _showSettlement = false;
                _gm.RestartLevel();
            }
            bx += bw + 20;
            if (GUI.Button(new Rect(bx, y + h - 60, bw, bh), _isVictory ? "➡️ 下一关 (F6)" : "📋 查看建议", _buttonStyle))
            {
                if (_isVictory)
                {
                    _showSettlement = false;
                    var levels = ConfigManager.Instance.GetAllLevels();
                    int cur = -1;
                    for (int i = 0; i < levels.Count; i++)
                        if (levels[i].levelId == _gm.CurrentLevel.levelId) { cur = i; break; }
                    if (cur >= 0 && cur + 1 < levels.Count)
                        _gm.LoadLevel(levels[cur + 1].levelId);
                }
                else
                {
                    Debug.Log($"[建议] {_lastFailureReport?.replayAdvice}");
                }
            }
        }

        private int GetFailCount(string levelId)
        {
            var dic = SaveSystem.Instance.FailureCounts;
            return dic.ContainsKey(levelId) ? dic[levelId] : 0;
        }

        private const int RowH = 24;
        private void DrawStat(ref int y, int x, string label, string val)
        {
            GUI.Label(new Rect(x, y, 280, RowH), label, new GUIStyle(GUI.skin.label) { fontSize = 12, normal = { textColor = new Color(0.85f, 0.9f, 0.85f) } });
            GUI.Label(new Rect(x + 170, y, 130, RowH), val, new GUIStyle(GUI.skin.label) { fontSize = 12, alignment = TextAnchor.MiddleRight, fontStyle = FontStyle.Bold, normal = { textColor = Color.white } });
            if (x != 0) y += RowH + 2;
        }

        private void DrawLogsPanel()
        {
            int w = 520, h = 440;
            int x = Screen.width - w - 20, y = topBarHeight + 15;

            GUI.color = new Color(0.05f, 0.08f, 0.05f, 0.96f);
            GUI.DrawTexture(new Rect(x, y, w, h), MakeTex(1, 1, GUI.color));
            GUI.color = Color.white;
            GUI.Box(new Rect(x, y, w, h), "📝 日志 / 存档 / 统计");

            if (GUI.Button(new Rect(x + w - 30, y + 4, 24, 22), "×"))
                _showLogsPanel = false;

            int tabY = y + 30;
            int tabW = (w - 40) / 3;
            for (int i = 0; i < 3; i++)
            {
                string tn = i == 0 ? "🎯 关键选择" : (i == 1 ? "💾 存档状态" : "📊 游玩统计");
                Color old = GUI.backgroundColor;
                if (_logTab == i) GUI.backgroundColor = new Color(0.45f, 0.7f, 0.4f, 0.9f);
                if (GUI.Button(new Rect(x + 20 + i * (tabW + 2), tabY, tabW, 26), tn, _buttonStyle))
                    _logTab = i;
                GUI.backgroundColor = old;
            }

            int bodyX = x + 15, bodyY = tabY + 34;
            int bodyW = w - 30, bodyH = h - (bodyY - y) - 15;

            var save = SaveSystem.Instance;
            var pd = save?.PlayerData;
            var gm = _gm;
            var perf = PerformanceStats.Instance;

            if (_logTab == 0)
            {
                GUI.Label(new Rect(bodyX, bodyY, bodyW, 22), $"🔖 关键选择日志 (共{(pd?.choiceLogs?.Count ?? 0)}条)", _labelStyle);
                int listY = bodyY + 28;
                int listH = bodyH - 32;

                GUI.color = new Color(0.1f, 0.15f, 0.1f, 0.9f);
                GUI.DrawTexture(new Rect(bodyX, listY, bodyW, listH), MakeTex(1, 1, GUI.color));
                GUI.color = Color.white;

                var logs = pd?.choiceLogs;
                if (logs == null || logs.Count == 0)
                {
                    GUI.Label(new Rect(bodyX + 10, listY + 20, bodyW - 20, 40),
                        "尚未记录关键选择\n(建塔/升级/出售/解锁/开始波次/结算时自动记录)",
                        new GUIStyle(GUI.skin.label) { fontSize = 13, alignment = TextAnchor.UpperCenter, wordWrap = true, normal = { textColor = new Color(0.8f, 0.85f, 0.8f) } });
                }
                else
                {
                    float totalH = logs.Count * 38 + 6;
                    _logScrollPos = GUI.BeginScrollView(new Rect(bodyX, listY, bodyW, listH), _logScrollPos,
                        new Rect(0, 0, bodyW - 20, totalH));
                    int ry = 4;
                    for (int i = logs.Count - 1; i >= 0; i--)
                    {
                        var log = logs[i];
                        Color lc = log.choiceType == "victory" ? new Color(0.45f, 0.85f, 0.45f)
                            : log.choiceType == "defeat" ? new Color(0.95f, 0.45f, 0.45f)
                            : log.choiceType.StartsWith("unlock") ? new Color(0.9f, 0.7f, 0.35f)
                            : log.choiceType.StartsWith("upgrade") ? new Color(0.55f, 0.8f, 0.95f)
                            : new Color(0.85f, 0.85f, 0.85f);
                        GUI.color = new Color(0.18f, 0.24f, 0.18f, 0.95f);
                        GUI.DrawTexture(new Rect(4, ry, bodyW - 28, 34), MakeTex(1, 1, GUI.color));
                        GUI.color = Color.white;
                        int m = (int)log.gameTime / 60;
                        int s = (int)log.gameTime % 60;
                        int ms = (int)((log.gameTime - (int)log.gameTime) * 100);
                        string timeStr = $"T+{m:00}:{s:00}.{ms:00}";
                        GUI.Label(new Rect(10, ry + 2, 100, 18), $"[{timeStr}]",
                            new GUIStyle(GUI.skin.label) { fontSize = 10, normal = { textColor = new Color(0.7f, 0.75f, 0.7f) } });
                        GUI.Label(new Rect(110, ry + 2, bodyW - 145, 18),
                            $"{ActionTypeIcon(log.choiceType)} {log.choiceType.Replace('_', ' ')}",
                            new GUIStyle(GUI.skin.label) { fontSize = 11, fontStyle = FontStyle.Bold, normal = { textColor = lc } });
                        GUI.Label(new Rect(10, ry + 18, bodyW - 28, 14), $"  {log.choiceDetail}  [关卡:{log.levelId} 波次:{log.waveNumber} 💰{log.goldBefore}→{log.goldAfter}]",
                            new GUIStyle(GUI.skin.label) { fontSize = 10, normal = { textColor = new Color(0.85f, 0.9f, 0.85f) } });
                        ry += 38;
                    }
                    GUI.EndScrollView();
                }
            }
            else if (_logTab == 1)
            {
                GUI.Label(new Rect(bodyX, bodyY, bodyW, 22), $"💾 存档数据 (持久化到磁盘)", _labelStyle);
                int sy = bodyY + 28;
                GUI.color = new Color(0.1f, 0.15f, 0.1f, 0.9f);
                GUI.DrawTexture(new Rect(bodyX, sy, bodyW, bodyH - 32), MakeTex(1, 1, GUI.color));
                GUI.color = Color.white;

                int gy = sy + 10, gx = bodyX + 15, gw = (bodyW - 40) / 2;
                DrawStat(ref gy, gx, "🆔 玩家ID", pd?.playerId?.Substring(0, 8) + "...");
                DrawStat(ref gy, gx + gw + 10, "📅 创建时间", pd?.createdTime?.Substring(0, 10));
                gy = sy + 10;
                DrawStat(ref gy, gx, "⏱️ 总游戏时长", $"{(pd != null ? pd.totalPlayTimeSeconds : 0):F0} 秒");
                DrawStat(ref gy, gx + gw + 10, "💥 总失败次数", $"{pd?.totalFailures ?? 0} 次");
                gy = sy + 10;
                DrawStat(ref gy, gx, "🔓 已解锁关卡", pd != null ? string.Join(", ", pd.unlockedLevels) : "-");
                DrawStat(ref gy, gx + gw + 10, "🎚️ 画质等级", $"{pd?.settings?.qualityLevel ?? 0}");
                gy = sy + 10;
                DrawStat(ref gy, gx, "🎯 目标帧率", $"{pd?.settings?.targetFrameRate ?? 0}Hz");
                DrawStat(ref gy, gx + gw + 10, "📺 分辨率", $"{pd?.settings?.resolutionWidth ?? 0}x{pd?.settings?.resolutionHeight ?? 0}");

                gy += 12;
                GUI.Label(new Rect(gx, gy, bodyW - 30, 20), "━━━ 各关卡状态 ━━━", new GUIStyle(GUI.skin.label) { fontSize = 12, fontStyle = FontStyle.Bold, alignment = TextAnchor.MiddleCenter, normal = { textColor = new Color(0.9f, 0.85f, 0.5f) } });
                gy += 22;
                var levels = ConfigManager.Instance.GetAllLevels();
                foreach (var lv in levels)
                {
                    bool completed = save.HasLevelCompleted(lv.levelId);
                    var comp = save.GetLevelCompletion(lv.levelId);
                    int fails = save.FailureCounts.ContainsKey(lv.levelId) ? save.FailureCounts[lv.levelId] : 0;
                    Color lvc = completed ? new Color(0.5f, 0.9f, 0.5f) : new Color(0.85f, 0.5f, 0.5f);
                    GUI.color = new Color(0.15f, 0.22f, 0.15f, 0.9f);
                    GUI.DrawTexture(new Rect(gx, gy, bodyW - 30, 36), MakeTex(1, 1, GUI.color));
                    GUI.color = Color.white;
                    GUI.Label(new Rect(gx + 6, gy + 4, 30, 28), completed ? "✅" : "🔒",
                        new GUIStyle(GUI.skin.label) { fontSize = 16, alignment = TextAnchor.MiddleCenter });
                    GUI.Label(new Rect(gx + 40, gy + 4, 160, 20), lv.levelName,
                        new GUIStyle(GUI.skin.label) { fontSize = 12, fontStyle = FontStyle.Bold, normal = { textColor = lvc } });
                    GUI.Label(new Rect(gx + 40, gy + 20, 200, 14),
                        $"{(comp != null ? $"{new string('⭐', comp.starsEarned)} 最佳{comp.bestTimeSeconds:F0}s 最高{comp.highestScore}分 游玩{comp.playCount}次" : "尚未通关")}",
                        new GUIStyle(GUI.skin.label) { fontSize = 10, normal = { textColor = new Color(0.8f, 0.85f, 0.8f) } });
                    GUI.Label(new Rect(gx + bodyW - 130, gy + 10, 120, 18), $"失败: {fails}次",
                        new GUIStyle(GUI.skin.label) { fontSize = 11, alignment = TextAnchor.MiddleRight, normal = { textColor = fails > 0 ? new Color(0.95f, 0.6f, 0.6f) : new Color(0.7f, 0.75f, 0.7f) } });
                    gy += 40;
                }
            }
            else
            {
                GUI.Label(new Rect(bodyX, bodyY, bodyW, 22), "📊 游玩统计 (实时+历史)", _labelStyle);
                int sy = bodyY + 28;
                GUI.color = new Color(0.1f, 0.15f, 0.1f, 0.9f);
                GUI.DrawTexture(new Rect(bodyX, sy, bodyW, bodyH - 32), MakeTex(1, 1, GUI.color));
                GUI.color = Color.white;

                int gy = sy + 10, gx = bodyX + 15, gw = (bodyW - 40) / 2;
                DrawStat(ref gy, gx, "🏞️ 当前关卡", gm?.CurrentLevel?.levelName ?? "-");
                DrawStat(ref gy, gx + gw + 10, "⚙️ 游戏状态", gm?.CurrentState.ToString() ?? "-");
                gy = sy + 10;
                DrawStat(ref gy, gx, "⏱️ 当前用时", $"{gm?.Resources?.ElapsedTime ?? 0:F1} 秒");
                DrawStat(ref gy, gx + gw + 10, "💰 剩余金币", $"{gm?.Resources?.Gold ?? 0}");
                gy = sy + 10;
                DrawStat(ref gy, gx, "🏠 基地血量", $"{gm?.Resources?.BaseHealth ?? 0}/{gm?.Resources?.MaxBaseHealth ?? 0}");
                DrawStat(ref gy, gx + gw + 10, "🌊 波次进度", $"{gm?.Waves?.CurrentWaveNumber ?? 0}/{gm?.Waves?.TotalWaves ?? 0}");
                gy = sy + 10;
                DrawStat(ref gy, gx, "🗼 已建造塔", $"{gm?.Towers?.TowerCount ?? 0} 座");
                DrawStat(ref gy, gx + gw + 10, "🐛 场上敌人", $"{gm?.Enemies?.ActiveEnemyCount ?? 0} 只");
                gy = sy + 10;
                DrawStat(ref gy, gx, "🌤️ 当前天气", gm?.Weather?.CurrentWeatherName ?? "-");
                DrawStat(ref gy, gx + gw + 10, "⚡ 倍速", $"{gm?.TimeScale ?? 1:F1}x");

                gy += 12;
                GUI.Label(new Rect(gx, gy, bodyW - 30, 20), "━━━ 性能计数器 ━━━", new GUIStyle(GUI.skin.label) { fontSize = 12, fontStyle = FontStyle.Bold, alignment = TextAnchor.MiddleCenter, normal = { textColor = new Color(0.9f, 0.85f, 0.5f) } });
                gy += 22;
                if (perf != null)
                {
                    string[] names = { "TowersBuilt", "TowersUpgraded", "WavesStarted", "EnemiesKilled", "EnemiesPassed", "Victories", "Defeats" };
                    string[] labels = { "🏹 建塔次数", "⬆️ 升级次数", "🌊 启动波次", "💥 击杀敌数", "🏃 漏网敌数", "🏆 胜利局数", "💀 失败局数" };
                    for (int i = 0; i < names.Length; i++)
                    {
                        perf.RegisterCounter(names[i]);
                        long v = perf.GetCounter(names[i])?.count ?? 0;
                        DrawStat(ref gy, i % 2 == 0 ? gx : gx + gw + 10, labels[i], v.ToString());
                    }
                    gy += 8;
                    GUI.Label(new Rect(gx, gy, bodyW - 30, 18),
                        $"🖥️ FPS: {perf.CurrentFPS:F0}  |  内存: {perf.MemoryUsageMB:F1}MB  |  卡顿: {perf.StutterPercentage:F1}%",
                        new GUIStyle(GUI.skin.label) { fontSize = 11, alignment = TextAnchor.MiddleCenter, normal = { textColor = new Color(0.7f, 0.95f, 0.7f) } });
                }
                else
                {
                    GUI.Label(new Rect(gx, gy, bodyW - 30, 40), "(PerformanceStats未启用，FPS/内存监控暂不可用)",
                        new GUIStyle(GUI.skin.label) { fontSize = 12, alignment = TextAnchor.UpperCenter, wordWrap = true, normal = { textColor = new Color(0.75f, 0.8f, 0.75f) } });
                }
            }
        }

        private string ActionTypeIcon(string choiceType)
        {
            if (string.IsNullOrEmpty(choiceType)) return "📍";
            if (choiceType.StartsWith("place")) return "🏗️";
            if (choiceType.StartsWith("upgrade")) return "⬆️";
            if (choiceType.StartsWith("sell")) return "💰";
            if (choiceType.StartsWith("unlock")) return "🔓";
            if (choiceType.StartsWith("start_wave") || choiceType.StartsWith("wave")) return "🌊";
            if (choiceType == "victory") return "🏆";
            if (choiceType == "defeat") return "💔";
            if (choiceType.StartsWith("path")) return "🛤️";
            return "📌";
        }

        private void OnDrawGizmos()
        {
            if (_gm == null || _gm.CurrentLevel == null) return;

            Gizmos.color = new Color(0.7f, 0.55f, 0.3f, 0.5f);
            var points = GetCurrentPathPoints();
            for (int i = 0; i < points.Count - 1; i++)
                Gizmos.DrawLine(points[i], points[i + 1]);

            foreach (var slot in _gm.Towers.GetAllSlots())
            {
                Vector3 p = new Vector3(slot.x, slot.y + 0.5f, slot.z);
                Gizmos.color = slot.isUnlocked ? new Color(0.4f, 0.8f, 0.4f, 0.6f) : new Color(0.8f, 0.5f, 0.2f, 0.6f);
                Gizmos.DrawWireCube(p, new Vector3(1, 0.2f, 1));
            }

            foreach (var t in _gm.Towers.GetAllTowers())
            {
                Gizmos.color = new Color(0.3f, 0.9f, 0.3f, 0.18f);
                Gizmos.DrawSphere(t.Position, t.GetEffectiveRange());
                Gizmos.color = new Color(0.2f, 0.7f, 1f, 0.8f);
                Gizmos.DrawCube(t.Position + Vector3.up * 0.5f, new Vector3(0.8f, 1f, 0.8f));
            }
        }

        // ---------- 2D绘制辅助：GL画线 ----------
        private Material _lineMat;
        private int _lineNest;

        private void EnsureLineMat()
        {
            if (_lineMat == null)
            {
                Shader s = Shader.Find("Hidden/Internal-Colored");
                _lineMat = new Material(s);
                _lineMat.hideFlags = HideFlags.HideAndDontSave;
            }
        }

        private void HandlesLineStart()
        {
            EnsureLineMat();
            if (_lineNest == 0) { _lineMat.SetPass(0); GL.PushMatrix(); GL.LoadOrtho(); GL.Begin(GL.LINES); }
            _lineNest++;
        }

        private void DrawScreenLine(Vector2 a, Vector2 b, Color c, float thickness)
        {
            GL.Color(c);
            Vector3 A = new Vector3(a.x / Screen.width, 1 - a.y / Screen.height, 0);
            Vector3 B = new Vector3(b.x / Screen.width, 1 - b.y / Screen.height, 0);
            Vector2 dir = (b - a).normalized;
            Vector2 perp = new Vector2(-dir.y, dir.x) * (thickness / 2);
            Vector3 a1 = A + new Vector3(perp.x / Screen.width, -perp.y / Screen.height, 0);
            Vector3 a2 = A - new Vector3(perp.x / Screen.width, -perp.y / Screen.height, 0);
            Vector3 b1 = B + new Vector3(perp.x / Screen.width, -perp.y / Screen.height, 0);
            Vector3 b2 = B - new Vector3(perp.x / Screen.width, -perp.y / Screen.height, 0);
            GL.Vertex(a1); GL.Vertex(b1); GL.Vertex(a2); GL.Vertex(b2);
            GL.Vertex(a1); GL.Vertex(a2); GL.Vertex(b1); GL.Vertex(b2);
        }

        private void HandlesLineEnd()
        {
            _lineNest--;
            if (_lineNest == 0) { GL.End(); GL.PopMatrix(); }
        }

        private void DrawCircle(Vector2 center, float radius)
        {
            float x0 = (center.x - radius) / Screen.width;
            float y0 = 1 - (center.y - radius) / Screen.height;
            float x1 = (center.x + radius) / Screen.width;
            float y1 = 1 - (center.y + radius) / Screen.height;
            var tex = MakeTex(1, 1, GUI.color);
            GUI.DrawTexture(new Rect(x0 * Screen.width, (1 - y1) * Screen.height, (x1 - x0) * Screen.width, (y1 - y0) * Screen.height), tex);
        }

        private void DrawCircleOutline(Vector2 center, float radius, float thick)
        {
            int seg = 32;
            HandlesLineStart();
            for (int i = 0; i < seg; i++)
            {
                float a1 = (float)i / seg * Mathf.PI * 2;
                float a2 = (float)(i + 1) / seg * Mathf.PI * 2;
                Vector2 p1 = center + new Vector2(Mathf.Cos(a1), Mathf.Sin(a1)) * radius;
                Vector2 p2 = center + new Vector2(Mathf.Cos(a2), Mathf.Sin(a2)) * radius;
                DrawScreenLine(p1, p2, GUI.color, thick);
            }
            HandlesLineEnd();
        }
    }
}
