using System;
using System.Collections.Generic;
using Kitchen.Input;
using Kitchen.Performance;
using Kitchen.Save;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Audio;

namespace Kitchen.UI
{
    public class SettingsMenuController : MonoBehaviour
    {
        [Header("Panels")]
        public GameObject settingsPanel;
        public GameObject generalTab;
        public GameObject audioTab;
        public GameObject graphicsTab;
        public GameObject inputTab;
        public GameObject controlsTab;

        [Header("Tab Buttons")]
        public Button generalTabButton;
        public Button audioTabButton;
        public Button graphicsTabButton;
        public Button inputTabButton;
        public Button backButton;

        [Header("General")]
        public Slider uiScaleSlider;
        public TextMeshProUGUI uiScaleValue;
        public Toggle screenShakeToggle;
        public Toggle subtitlesToggle;
        public TMP_Dropdown languageDropdown;
        public Toggle showPerfStatsToggle;

        [Header("Audio")]
        public AudioMixer mixer;
        public Slider masterVolumeSlider;
        public Slider musicVolumeSlider;
        public Slider sfxVolumeSlider;
        public TextMeshProUGUI masterVolumeValue;
        public TextMeshProUGUI musicVolumeValue;
        public TextMeshProUGUI sfxVolumeValue;

        [Header("Graphics")]
        public TMP_Dropdown qualityDropdown;
        public TMP_Dropdown resolutionDropdown;
        public TMP_Dropdown fullscreenDropdown;
        public TMP_Dropdown targetFPSDropdown;
        public Toggle vsyncToggle;
        public Toggle autoAdaptToggle;
        public Button applyGraphicsButton;

        [Header("Input")]
        public TMP_Dropdown playerSelectDropdown;
        public Transform bindingsContainer;
        public GameObject bindingRowPrefab;
        public Button resetBindingsButton;
        public Button saveBindingsButton;

        private SettingsSaveData currentSettings;
        private int selectedPlayerIndex;
        private Dictionary<InputAction, KeyCode> pendingRebind = new Dictionary<InputAction, KeyCode>();
        private bool isRebinding;
        private InputAction rebindingAction;

        private void Awake()
        {
            currentSettings = SaveManager.Instance?.GetSettings() ?? new SettingsSaveData();
        }

        private void OnEnable()
        {
            if (backButton != null) backButton.onClick.AddListener(OnBack);
            if (generalTabButton != null) generalTabButton.onClick.AddListener(() => SwitchTab(0));
            if (audioTabButton != null) audioTabButton.onClick.AddListener(() => SwitchTab(1));
            if (graphicsTabButton != null) graphicsTabButton.onClick.AddListener(() => SwitchTab(2));
            if (inputTabButton != null) inputTabButton.onClick.AddListener(() => SwitchTab(3));

            if (applyGraphicsButton != null) applyGraphicsButton.onClick.AddListener(ApplyGraphics);
            if (resetBindingsButton != null) resetBindingsButton.onClick.AddListener(ResetBindings);
            if (saveBindingsButton != null) saveBindingsButton.onClick.AddListener(SaveBindings);

            if (playerSelectDropdown != null) playerSelectDropdown.onValueChanged.AddListener(OnPlayerSelected);

            PopulateGraphicsDropdowns();
            SwitchTab(0);
            LoadFromSettings();
        }

        private void OnDisable()
        {
            if (backButton != null) backButton.onClick.RemoveListener(OnBack);
        }

        public void Open()
        {
            if (settingsPanel != null) settingsPanel.SetActive(true);
            LoadFromSettings();
        }

        public void Close()
        {
            SaveToSettings();
            if (settingsPanel != null) settingsPanel.SetActive(false);
        }

        private void SwitchTab(int index)
        {
            if (generalTab != null) generalTab.SetActive(index == 0);
            if (audioTab != null) audioTab.SetActive(index == 1);
            if (graphicsTab != null) graphicsTab.SetActive(index == 2);
            if (inputTab != null) inputTab.SetActive(index == 3);
        }

        private void LoadFromSettings()
        {
            currentSettings = SaveManager.Instance?.GetSettings() ?? new SettingsSaveData();

            if (uiScaleSlider != null) { uiScaleSlider.value = currentSettings.uiScale; if (uiScaleValue != null) uiScaleValue.text = $"{currentSettings.uiScale * 100:F0}%"; }
            if (screenShakeToggle != null) screenShakeToggle.isOn = currentSettings.screenShakeEnabled;
            if (subtitlesToggle != null) subtitlesToggle.isOn = currentSettings.subtitlesEnabled;
            if (showPerfStatsToggle != null) showPerfStatsToggle.isOn = currentSettings.showPerformanceStats;

            if (masterVolumeSlider != null) { masterVolumeSlider.value = currentSettings.masterVolume; if (masterVolumeValue != null) masterVolumeValue.text = $"{currentSettings.masterVolume * 100:F0}%"; }
            if (musicVolumeSlider != null) { musicVolumeSlider.value = currentSettings.musicVolume; if (musicVolumeValue != null) musicVolumeValue.text = $"{currentSettings.musicVolume * 100:F0}%"; }
            if (sfxVolumeSlider != null) { sfxVolumeSlider.value = currentSettings.sfxVolume; if (sfxVolumeValue != null) sfxVolumeValue.text = $"{currentSettings.sfxVolume * 100:F0}%"; }

            if (targetFPSDropdown != null)
            {
                int idx = targetFPSDropdown.options.FindIndex(o => int.Parse(o.text) == currentSettings.targetFrameRate);
                targetFPSDropdown.value = idx >= 0 ? idx : 2;
            }
            if (vsyncToggle != null) vsyncToggle.isOn = currentSettings.vsyncEnabled;
            if (autoAdaptToggle != null) autoAdaptToggle.isOn = FrameRateAdapter.Instance?.enableAutoAdapt ?? true;

            PopulateBindings(selectedPlayerIndex);
        }

        private void SaveToSettings()
        {
            if (currentSettings == null) return;

            currentSettings.uiScale = uiScaleSlider != null ? uiScaleSlider.value : 1f;
            currentSettings.screenShakeEnabled = screenShakeToggle != null && screenShakeToggle.isOn;
            currentSettings.subtitlesEnabled = subtitlesToggle != null && subtitlesToggle.isOn;
            currentSettings.showPerformanceStats = showPerfStatsToggle != null && showPerfStatsToggle.isOn;

            currentSettings.masterVolume = masterVolumeSlider != null ? masterVolumeSlider.value : 1f;
            currentSettings.musicVolume = musicVolumeSlider != null ? musicVolumeSlider.value : 0.8f;
            currentSettings.sfxVolume = sfxVolumeSlider != null ? sfxVolumeSlider.value : 1f;

            if (targetFPSDropdown != null && int.TryParse(targetFPSDropdown.options[targetFPSDropdown.value].text, out int fps))
                currentSettings.targetFrameRate = fps;
            currentSettings.vsyncEnabled = vsyncToggle != null && vsyncToggle.isOn;

            if (mixer != null)
            {
                mixer.SetFloat("MasterVol", Mathf.Log10(Mathf.Max(0.001f, currentSettings.masterVolume)) * 20);
                mixer.SetFloat("MusicVol", Mathf.Log10(Mathf.Max(0.001f, currentSettings.musicVolume)) * 20);
                mixer.SetFloat("SFXVol", Mathf.Log10(Mathf.Max(0.001f, currentSettings.sfxVolume)) * 20);
            }

            SaveManager.Instance?.UpdateSettings(currentSettings);
            SaveManager.Instance?.ApplySettings();
        }

        private void PopulateGraphicsDropdowns()
        {
            if (qualityDropdown != null)
            {
                qualityDropdown.ClearOptions();
                qualityDropdown.AddOptions(new List<string>(QualitySettings.names));
                qualityDropdown.value = QualitySettings.GetQualityLevel();
            }
            if (resolutionDropdown != null)
            {
                resolutionDropdown.ClearOptions();
                List<string> res = new List<string>();
                foreach (var r in Screen.resolutions)
                    res.Add($"{r.width}x{r.height} @{r.refreshRateRatio.value}Hz");
                if (res.Count == 0) res.AddRange(new[] { "1920x1080", "1280x720", "3840x2160" });
                resolutionDropdown.AddOptions(res);
            }
            if (fullscreenDropdown != null)
            {
                fullscreenDropdown.ClearOptions();
                fullscreenDropdown.AddOptions(new List<string> { "全屏", "无边框", "最大化", "窗口化" });
                fullscreenDropdown.value = (int)currentSettings.fullscreenMode;
            }
            if (targetFPSDropdown != null)
            {
                targetFPSDropdown.ClearOptions();
                targetFPSDropdown.AddOptions(new List<string> { "30", "60", "90", "120", "144", "240" });
            }
        }

        private void ApplyGraphics()
        {
            if (qualityDropdown != null) QualitySettings.SetQualityLevel(qualityDropdown.value, true);
            if (fullscreenDropdown != null)
            {
                currentSettings.fullscreenMode = (FullScreenMode)fullscreenDropdown.value;
                UnityEngine.FullScreenMode mode = UnityEngine.FullScreenMode.FullScreenWindow;
                switch (currentSettings.fullscreenMode)
                {
                    case FullScreenMode.ExclusiveFullScreen: mode = UnityEngine.FullScreenMode.ExclusiveFullScreen; break;
                    case FullScreenMode.FullScreenWindow: mode = UnityEngine.FullScreenMode.FullScreenWindow; break;
                    case FullScreenMode.MaximizedWindow: mode = UnityEngine.FullScreenMode.MaximizedWindow; break;
                    case FullScreenMode.Windowed: mode = UnityEngine.FullScreenMode.Windowed; break;
                }
                if (resolutionDropdown != null)
                {
                    string[] parts = resolutionDropdown.options[resolutionDropdown.value].text.Split('x', ' ', '@');
                    if (parts.Length >= 2 && int.TryParse(parts[0], out int w) && int.TryParse(parts[1], out int h))
                    {
                        currentSettings.resolutionWidth = w;
                        currentSettings.resolutionHeight = h;
                        Screen.SetResolution(w, h, mode);
                    }
                    else
                    {
                        Screen.fullScreenMode = mode;
                    }
                }
            }
            SaveToSettings();
        }

        private void OnPlayerSelected(int index)
        {
            selectedPlayerIndex = index;
            PopulateBindings(index);
        }

        private void PopulateBindings(int playerIdx)
        {
            if (bindingsContainer == null || bindingRowPrefab == null) return;
            for (int i = bindingsContainer.childCount - 1; i >= 0; i--)
                Destroy(bindingsContainer.GetChild(i).gameObject);

            List<InputBinding> bindings = InputManager.Instance?.GetBindings(playerIdx) ?? new List<InputBinding>();
            foreach (var binding in bindings)
            {
                GameObject row = Instantiate(bindingRowPrefab, bindingsContainer);
                var nameTxt = row.transform.Find("ActionName")?.GetComponent<TextMeshProUGUI>();
                var primaryBtn = row.transform.Find("PrimaryButton")?.GetComponent<Button>();
                var primaryTxt = primaryBtn?.GetComponentInChildren<TextMeshProUGUI>();
                var secondaryBtn = row.transform.Find("SecondaryButton")?.GetComponent<Button>();
                var secondaryTxt = secondaryBtn?.GetComponentInChildren<TextMeshProUGUI>();

                if (nameTxt != null) nameTxt.text = binding.action.ToString();
                if (primaryTxt != null) primaryTxt.text = binding.primaryKey != KeyCode.None ? binding.primaryKey.ToString() : "未设置";
                if (secondaryTxt != null) secondaryTxt.text = binding.secondaryKey != KeyCode.None ? binding.secondaryKey.ToString() : "未设置";

                InputAction captured = binding.action;
                if (primaryBtn != null) primaryBtn.onClick.AddListener(() => StartRebind(playerIdx, captured, true));
                if (secondaryBtn != null) secondaryBtn.onClick.AddListener(() => StartRebind(playerIdx, captured, false));
            }
        }

        private void StartRebind(int playerIdx, InputAction action, bool isPrimary)
        {
            isRebinding = true;
            rebindingAction = action;
            StartCoroutine(WaitForKey(playerIdx, action, isPrimary));
        }

        private IEnumerator<WaitForEndOfFrame> WaitForKey(int playerIdx, InputAction action, bool isPrimary)
        {
            while (!UnityEngine.Input.anyKeyDown) yield return new WaitForEndOfFrame();
            foreach (KeyCode k in Enum.GetValues(typeof(KeyCode)))
            {
                if (UnityEngine.Input.GetKeyDown(k) && k != KeyCode.Escape)
                {
                    InputManager.Instance?.RemapBinding(playerIdx, action, k, isPrimary);
                    break;
                }
            }
            isRebinding = false;
            PopulateBindings(playerIdx);
        }

        private void ResetBindings()
        {
            InputManager.Instance?.ResetToDefault(selectedPlayerIndex);
            PopulateBindings(selectedPlayerIndex);
        }

        private void SaveBindings()
        {
        }

        private void OnBack()
        {
            SaveToSettings();
            if (Kitchen.Core.GameManager.Instance?.CurrentState == Kitchen.Core.GameManager.GameState.Settings)
                Kitchen.Core.GameManager.Instance?.ChangeState(Kitchen.Core.GameManager.GameState.Paused);
            Close();
        }
    }
}
