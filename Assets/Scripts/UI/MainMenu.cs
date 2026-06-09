using System;
using System.Collections.Generic;
using BeatRunner.Core;
using BeatRunner.Data;
using UnityEngine;
using UnityEngine.UI;

namespace BeatRunner.UI
{
    public class MainMenu : MonoBehaviour
    {
        [SerializeField] private GameObject _mainMenuRoot;

        [Header("Track Selection")]
        [SerializeField] private RectTransform _trackListContainer;
        [SerializeField] private GameObject _trackItemPrefab;
        [SerializeField] private Text _selectedTrackName;
        [SerializeField] private Text _selectedTrackArtist;
        [SerializeField] private Text _selectedTrackBpm;
        [SerializeField] private Text _selectedTrackDescription;
        [SerializeField] private Image _selectedTrackCover;
        [SerializeField] private Slider _difficultySlider;
        [SerializeField] private Text _difficultyText;

        [Header("Skin Selection")]
        [SerializeField] private RectTransform _skinListContainer;
        [SerializeField] private GameObject _skinItemPrefab;
        [SerializeField] private Text _selectedSkinName;
        [SerializeField] private Image _skinPreview;

        [Header("Stats")]
        [SerializeField] private Text _totalFragmentsText;
        [SerializeField] private Text _unlockedTracksText;

        [Header("Buttons")]
        [SerializeField] private Button _startBtn;
        [SerializeField] private Button _tutorialBtn;
        [SerializeField] private Button _settingsBtn;
        [SerializeField] private Button _quitBtn;

        private TrackLibrary _library;
        private TrackData _selectedTrack;
        private SkinData _selectedSkin;
        private int _currentDifficulty;
        private readonly List<GameObject> _trackItems = new List<GameObject>();
        private readonly List<GameObject> _skinItems = new List<GameObject>();

        public event Action<TrackData, SkinData, int> OnStartSelected;
        public event Action OnOpenTutorial;
        public event Action OnOpenSettings;
        public event Action OnQuit;

        private void Start()
        {
            ServiceLocator.TryGet(out RuntimeGameData data);
            if (data == null)
            {
                data = ScriptableObject.CreateInstance<RuntimeGameData>();
                ServiceLocator.Register(data);
            }
        }

        private void OnEnable()
        {
            if (_startBtn) _startBtn.onClick.AddListener(HandleStart);
            if (_tutorialBtn) _tutorialBtn.onClick.AddListener(HandleTutorial);
            if (_settingsBtn) _settingsBtn.onClick.AddListener(HandleSettings);
            if (_quitBtn) _quitBtn.onClick.AddListener(HandleQuit);
            if (_difficultySlider) _difficultySlider.onValueChanged.AddListener(OnDifficultyChanged);
        }

        private void OnDisable()
        {
            if (_startBtn) _startBtn.onClick.RemoveListener(HandleStart);
            if (_tutorialBtn) _tutorialBtn.onClick.RemoveListener(HandleTutorial);
            if (_settingsBtn) _settingsBtn.onClick.RemoveListener(HandleSettings);
            if (_quitBtn) _quitBtn.onClick.RemoveListener(HandleQuit);
            if (_difficultySlider) _difficultySlider.onValueChanged.RemoveListener(OnDifficultyChanged);
        }

        public void Show(TrackLibrary library)
        {
            _library = library;
            if (_mainMenuRoot) _mainMenuRoot.SetActive(true);
            PopulateTracks();
            PopulateSkins();
            UpdateStats();
            SelectDefaultTrack();
            SelectDefaultSkin();
            GameStateManager.Instance?.ChangeState(GameStateManager.GameState.MainMenu);
        }

        public void Hide()
        {
            if (_mainMenuRoot) _mainMenuRoot.SetActive(false);
        }

        private void PopulateTracks()
        {
            ClearList(_trackItems, _trackListContainer);
            if (_library == null) return;

            foreach (var track in _library.tracks)
            {
                if (track == null) continue;
                bool unlocked = track.isUnlockedByDefault || SaveSystem.IsTrackUnlocked(track.trackId);

                var go = Instantiate(_trackItemPrefab, _trackListContainer);
                _trackItems.Add(go);

                var texts = go.GetComponentsInChildren<Text>(true);
                foreach (var t in texts)
                {
                    if (t.gameObject.name.Contains("Name")) t.text = track.trackName;
                    if (t.gameObject.name.Contains("Artist")) t.text = track.artistName;
                    if (t.gameObject.name.Contains("Bpm")) t.text = $"{track.bpm} BPM";
                    if (t.gameObject.name.Contains("Lock") && !unlocked)
                        t.text = $"需 {track.requiredFragments} 碎片";
                }

                var images = go.GetComponentsInChildren<Image>(true);
                foreach (var img in images)
                {
                    if (img.gameObject.name.Contains("Cover") || img.gameObject.name.Contains("Bg"))
                    {
                        img.color = track.themeColor;
                    }
                }

                var btn = go.GetComponent<Button>();
                if (btn == null) btn = go.AddComponent<Button>();
                var capturedTrack = track;
                var isUnlocked = unlocked;
                btn.onClick.AddListener(() =>
                {
                    if (isUnlocked) SelectTrack(capturedTrack);
                });

                foreach (var t in texts)
                {
                    if (t.gameObject.name.Contains("Lock"))
                        t.gameObject.SetActive(!unlocked);
                }
            }
        }

        private void PopulateSkins()
        {
            ClearList(_skinItems, _skinListContainer);
            if (_library == null) return;

            foreach (var skin in _library.skins)
            {
                if (skin == null) continue;
                bool unlocked = skin.isUnlockedByDefault || SaveSystem.IsSkinUnlocked(skin.skinId);

                var go = Instantiate(_skinItemPrefab, _skinListContainer);
                _skinItems.Add(go);

                var images = go.GetComponentsInChildren<Image>(true);
                foreach (var img in images)
                {
                    if (img.gameObject.name.Contains("Color") || img.gameObject.name.Contains("Preview"))
                    {
                        img.color = skin.primaryColor;
                    }
                }

                var texts = go.GetComponentsInChildren<Text>(true);
                foreach (var t in texts)
                {
                    if (t.gameObject.name.Contains("Name")) t.text = skin.skinName;
                    if (t.gameObject.name.Contains("Lock") && !unlocked)
                        t.text = $"需 {skin.requiredFragments} 碎片";
                }

                var btn = go.GetComponent<Button>();
                if (btn == null) btn = go.AddComponent<Button>();
                var capturedSkin = skin;
                var isUnlocked = unlocked;
                btn.onClick.AddListener(() =>
                {
                    if (isUnlocked) SelectSkin(capturedSkin);
                });

                foreach (var t in texts)
                {
                    if (t.gameObject.name.Contains("Lock"))
                        t.gameObject.SetActive(!unlocked);
                }
            }
        }

        private void ClearList(List<GameObject> items, RectTransform container)
        {
            foreach (var item in items)
            {
                if (item != null) Destroy(item);
            }
            items.Clear();
        }

        private void SelectDefaultTrack()
        {
            if (_library == null || _library.tracks.Count == 0) return;
            foreach (var t in _library.tracks)
            {
                if (t != null && (t.isUnlockedByDefault || SaveSystem.IsTrackUnlocked(t.trackId)))
                {
                    SelectTrack(t);
                    return;
                }
            }
            SelectTrack(_library.tracks[0]);
        }

        private void SelectDefaultSkin()
        {
            if (_library == null || _library.skins.Count == 0) return;
            foreach (var s in _library.skins)
            {
                if (s != null && (s.isUnlockedByDefault || SaveSystem.IsSkinUnlocked(s.skinId)))
                {
                    SelectSkin(s);
                    return;
                }
            }
            SelectSkin(_library.skins[0]);
        }

        public void SelectTrack(TrackData track)
        {
            _selectedTrack = track;
            if (_selectedTrackName) _selectedTrackName.text = track.trackName;
            if (_selectedTrackArtist) _selectedTrackArtist.text = track.artistName;
            if (_selectedTrackBpm) _selectedTrackBpm.text = $"{track.bpm} BPM";
            if (_selectedTrackDescription) _selectedTrackDescription.text = track.description;
            if (_selectedTrackCover) _selectedTrackCover.color = track.themeColor;

            bool hasHard = track.hardLevel != null;
            bool hasNormal = track.normalLevel != null;
            bool hasEasy = track.easyLevel != null;

            int maxDiff = (hasHard ? 2 : (hasNormal ? 1 : 0));
            int minDiff = (hasEasy ? 0 : (hasNormal ? 1 : 2));

            if (_difficultySlider)
            {
                _difficultySlider.minValue = minDiff;
                _difficultySlider.maxValue = maxDiff;
                _currentDifficulty = Mathf.Clamp(_currentDifficulty, minDiff, maxDiff);
                _difficultySlider.value = _currentDifficulty;
                UpdateDifficultyDisplay();
            }

            if (ServiceLocator.TryGet(out RuntimeGameData data))
            {
                data.selectedTrack = track;
            }
        }

        public void SelectSkin(SkinData skin)
        {
            _selectedSkin = skin;
            if (_selectedSkinName) _selectedSkinName.text = skin.skinName;
            if (_skinPreview) _skinPreview.color = skin.primaryColor;

            if (ServiceLocator.TryGet(out RuntimeGameData data))
            {
                data.selectedSkin = skin;
            }
        }

        private void OnDifficultyChanged(float value)
        {
            _currentDifficulty = Mathf.RoundToInt(value);
            UpdateDifficultyDisplay();
        }

        private void UpdateDifficultyDisplay()
        {
            if (_difficultyText == null) return;
            switch (_currentDifficulty)
            {
                case 0: _difficultyText.text = "简单"; break;
                case 1: _difficultyText.text = "普通"; break;
                case 2: _difficultyText.text = "困难"; break;
            }
        }

        private void UpdateStats()
        {
            int total = SaveSystem.CurrentSave != null
                ? SaveSystem.CurrentSave.totalFragmentsCollected
                : 0;
            if (_totalFragmentsText) _totalFragmentsText.text = total.ToString();

            int unlocked = 0;
            if (_library != null)
            {
                foreach (var t in _library.tracks)
                {
                    if (t != null && (t.isUnlockedByDefault || SaveSystem.IsTrackUnlocked(t.trackId)))
                    {
                        unlocked++;
                    }
                }
            }
            if (_unlockedTracksText) _unlockedTracksText.text = $"{unlocked}/{_library?.tracks.Count ?? 0}";
        }

        private void HandleStart()
        {
            if (_selectedTrack == null) return;
            OnStartSelected?.Invoke(_selectedTrack, _selectedSkin, _currentDifficulty);
        }

        private void HandleTutorial()
        {
            OnOpenTutorial?.Invoke();
        }

        private void HandleSettings()
        {
            OnOpenSettings?.Invoke();
        }

        private void HandleQuit()
        {
            OnQuit?.Invoke();
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }
    }
}
