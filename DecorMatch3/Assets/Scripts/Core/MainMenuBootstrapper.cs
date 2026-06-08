using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;

namespace DecorMatch3
{
    public class MainMenuBootstrapper : MonoBehaviour
    {
        private Canvas _canvas;

        private void Start()
        {
            Setup();
        }

        public void Setup()
        {
            EnsureCanvas();
            BuildMainMenuUI();
        }

        private void EnsureCanvas()
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
                mainCam.backgroundColor = new Color(0.15f, 0.15f, 0.2f);
            }
        }

        private void BuildMainMenuUI()
        {
            Transform existing = _canvas.transform.Find("MainMenuPanel");
            if (existing != null) return;

            GameObject panel = CreatePanel("MainMenuPanel", _canvas.transform);

            GameObject titleObj = CreateText("Title", panel.transform, "装修配色三消", 36, new Color(1f, 0.85f, 0.3f));
            RectTransform titleRt = titleObj.GetComponent<RectTransform>();
            titleRt.anchoredPosition = new Vector2(0, 150);

            GameObject newGameBtn = CreateButton("NewGameBtn", panel.transform, "新游戏", -30);
            newGameBtn.GetComponent<Button>().onClick.AddListener(() =>
            {
                PlayClick();
                GameManager.Instance.StartNewGame();
            });

            GameObject continueBtn = CreateButton("ContinueBtn", panel.transform, "继续游戏", 30);
            bool hasSave = SaveManager.Instance != null && SaveManager.Instance.HasSave;
            continueBtn.GetComponent<Button>().onClick.AddListener(() =>
            {
                PlayClick();
                GameManager.Instance.ChangeState(GameState.LevelSelect);
                BuildLevelSelectUI();
            });
            continueBtn.SetActive(hasSave);

            GameObject settingsBtn = CreateButton("SettingsBtn", panel.transform, "设置", 90);
            settingsBtn.GetComponent<Button>().onClick.AddListener(() =>
            {
                PlayClick();
                BuildSettingsUI();
            });

            GameObject quitBtn = CreateButton("QuitBtn", panel.transform, "退出", 150);
            quitBtn.GetComponent<Button>().onClick.AddListener(() =>
            {
                PlayClick();
                GameManager.Instance.QuitGame();
            });
        }

        private void BuildLevelSelectUI()
        {
            GameObject mainPanel = _canvas.transform.Find("MainMenuPanel")?.gameObject;
            if (mainPanel != null) mainPanel.SetActive(false);

            Transform existing = _canvas.transform.Find("LevelSelectPanel");
            if (existing != null) { existing.gameObject.SetActive(true); return; }

            GameObject panel = CreatePanel("LevelSelectPanel", _canvas.transform);

            GameObject titleObj = CreateText("Title", panel.transform, "选择关卡", 30, Color.white);
            titleObj.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, 250);

            if (ConfigManager.Instance != null && ConfigManager.Instance.Levels != null)
            {
                int count = ConfigManager.Instance.Levels.Length;
                int cols = Mathf.Min(count, 5);
                float spacing = 120f;
                float startX = -(cols - 1) * spacing * 0.5f;
                float startY = 120f;

                for (int i = 0; i < count; i++)
                {
                    int levelId = ConfigManager.Instance.Levels[i].levelId;
                    int row = i / cols;
                    int col = i % cols;
                    float x = startX + col * spacing;
                    float y = startY - row * spacing;

                    LevelRecordData record = null;
                    if (SaveManager.Instance?.CurrentSave?.levelRecords != null)
                    {
                        record = SaveManager.Instance.CurrentSave.levelRecords.Find(r => r.levelId == levelId);
                    }

                    bool unlocked = levelId == 1 || (record != null && record.bestStars > 0);
                    if (record == null && levelId > 1)
                    {
                        LevelRecordData prev = SaveManager.Instance?.CurrentSave?.levelRecords?.Find(r => r.levelId == levelId - 1);
                        unlocked = prev != null && prev.bestStars > 0;
                    }

                    string label = unlocked ? (record != null && record.bestStars > 0 ? levelId + "\n" + new string('★', record.bestStars) : levelId.ToString()) : levelId + "\n🔒";
                    GameObject btn = CreateButton("Level" + levelId, panel.transform, label, 0);
                    RectTransform rt = btn.GetComponent<RectTransform>();
                    rt.anchoredPosition = new Vector2(x, y);
                    rt.sizeDelta = new Vector2(100, 80);

                    if (!unlocked)
                    {
                        btn.GetComponent<Button>().interactable = false;
                        btn.GetComponentInChildren<Text>().color = Color.gray;
                    }
                    else
                    {
                        int capturedId = levelId;
                        btn.GetComponent<Button>().onClick.AddListener(() =>
                        {
                            PlayClick();
                            GameManager.Instance.LoadLevel(capturedId);
                        });
                        if (record != null && record.bestStars > 0)
                        {
                            btn.GetComponentInChildren<Text>().color = Color.yellow;
                        }
                    }
                }
            }

            GameObject backBtn = CreateButton("BackBtn", panel.transform, "返回", -250);
            backBtn.GetComponent<Button>().onClick.AddListener(() =>
            {
                PlayClick();
                Destroy(panel);
                if (mainPanel != null) mainPanel.SetActive(true);
            });
        }

        private void BuildSettingsUI()
        {
            GameObject panel = CreatePanel("SettingsPanel", _canvas.transform);

            GameObject titleObj = CreateText("Title", panel.transform, "设置", 30, Color.white);
            titleObj.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, 250);

            GameObject musicVol = CreateText("MusicVol", panel.transform, "音乐音量", 20, Color.white);
            musicVol.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, 150);

            GameObject sfxVol = CreateText("SfxVol", panel.transform, "音效音量", 20, Color.white);
            sfxVol.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, 80);

            GameObject perf = CreateText("Perf", panel.transform, "性能: 加载中...", 16, Color.gray);
            perf.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, -100);

            GameObject backBtn = CreateButton("BackBtn", panel.transform, "返回", -200);
            backBtn.GetComponent<Button>().onClick.AddListener(() =>
            {
                PlayClick();
                SaveManager.Instance?.Save();
                Destroy(panel);
            });
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
            img.color = new Color(0.1f, 0.1f, 0.15f, 0.95f);
            return panel;
        }

        private GameObject CreateText(string name, Transform parent, string text, int fontSize, Color color)
        {
            GameObject obj = new GameObject(name);
            obj.transform.SetParent(parent, false);
            RectTransform rt = obj.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(600, 60);
            Text uiText = obj.AddComponent<Text>();
            uiText.text = text;
            uiText.fontSize = fontSize;
            uiText.color = color;
            uiText.alignment = TextAnchor.MiddleCenter;
            uiText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            return obj;
        }

        private GameObject CreateButton(string name, Transform parent, string text, float yOffset)
        {
            GameObject btnObj = new GameObject(name);
            btnObj.transform.SetParent(parent, false);
            RectTransform rt = btnObj.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(240, 50);
            rt.anchoredPosition = new Vector2(0, yOffset);
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
            uiText.fontSize = 22;
            uiText.color = Color.white;
            uiText.alignment = TextAnchor.MiddleCenter;
            uiText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

            ColorBlock colors = btn.colors;
            colors.highlightedColor = new Color(0.35f, 0.65f, 0.95f);
            colors.pressedColor = new Color(0.15f, 0.4f, 0.7f);
            btn.colors = colors;

            return btnObj;
        }

        private void PlayClick()
        {
            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySFX("button_click");
            }
        }
    }
}
