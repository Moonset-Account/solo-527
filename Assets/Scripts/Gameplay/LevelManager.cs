using System;
using System.Collections.Generic;
using BeatRunner.Audio;
using BeatRunner.Core;
using BeatRunner.Data;
using BeatRunner.Player;
using UnityEngine;

namespace BeatRunner.Gameplay
{
    public enum HitResult
    {
        None,
        Judged,
        Collided
    }

    public class LevelManager : MonoBehaviour
    {
        public static LevelManager Instance { get; private set; }

        [SerializeField] private Transform _levelRoot;
        [SerializeField] private PlayerController _player;

        [Header("Prefabs")]
        [SerializeField] private GameObject _obstacleHighPrefab;
        [SerializeField] private GameObject _obstacleLowPrefab;
        [SerializeField] private GameObject _fragmentPrefab;
        [SerializeField] private GameObject _laneIndicatorPrefab;

        [Header("Visual")]
        [SerializeField] private float _hitLineZ = 0f;
        [SerializeField] private float _spawnDistance = 30f;
        [SerializeField] private float _despawnDistance = -5f;

        public LevelData CurrentLevel { get; private set; }
        public TrackData CurrentTrack { get; private set; }

        private readonly List<GameObject> _spawnedObjects = new List<GameObject>();
        private readonly Dictionary<int, NoteData> _activeNotes = new Dictionary<int, NoteData>();
        private readonly HashSet<int> _judgedNotes = new HashSet<int>();
        private readonly Dictionary<GameObject, int> _objectToNoteIndex = new Dictionary<GameObject, int>();

        private int _currentNoteIndex;
        private float _secondsPerBeat;
        private float _startDelay;
        private double _levelStartTime;
        private bool _isRunning;
        private GameSettings _settings;
        private RuntimeGameData _runtimeData;

        public event Action<JudgmentType, NoteData> OnNoteJudged;
        public event Action<NoteData> OnNoteSpawned;
        public event Action OnLevelComplete;
        public event Action OnLevelFailed;
        public event Action<int> OnFragmentCollected;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            ServiceLocator.TryGet(out _settings);
            ServiceLocator.TryGet(out _runtimeData);
        }

        private void Update()
        {
            if (!_isRunning || CurrentLevel == null) return;

            UpdateNoteSpawning();
            UpdateObjectMovement();
            CheckForMissedNotes();
        }

        public void StartLevel(TrackData track, LevelData level)
        {
            CurrentTrack = track;
            CurrentLevel = level;
            _secondsPerBeat = 60f / track.bpm;
            _startDelay = level.startDelay;

            ClearLevel();
            _judgedNotes.Clear();
            _activeNotes.Clear();
            _currentNoteIndex = 0;
            _isRunning = true;

            if (BeatSystem.Instance != null)
            {
                BeatSystem.Instance.StartSystem(track.bpm, AudioSettings.dspTime + _startDelay);
            }

            if (AudioManager.Instance != null && track.musicClip != null)
            {
                AudioManager.Instance.PlayMusic(track.musicClip, _startDelay);
            }

            _levelStartTime = AudioSettings.dspTime + _startDelay;
            SpawnLaneIndicators();
        }

        public void StopLevel()
        {
            _isRunning = false;
            if (BeatSystem.Instance != null) BeatSystem.Instance.StopSystem();
            if (AudioManager.Instance != null) AudioManager.Instance.StopMusic();
        }

        public void PauseLevel()
        {
            _isRunning = false;
            if (AudioManager.Instance != null) AudioManager.Instance.PauseMusic();
        }

        public void ResumeLevel()
        {
            _isRunning = true;
            if (AudioManager.Instance != null) AudioManager.Instance.ResumeMusic();
        }

        public void ClearLevel()
        {
            foreach (var obj in _spawnedObjects)
            {
                if (obj != null) Destroy(obj);
            }
            _spawnedObjects.Clear();
            _activeNotes.Clear();
            _objectToNoteIndex.Clear();
            _currentNoteIndex = 0;
        }

        private void SpawnLaneIndicators()
        {
            if (_laneIndicatorPrefab == null || _settings == null) return;

            for (int i = 0; i < _settings.trackCount; i++)
            {
                int mid = _settings.trackCount / 2;
                float x = (i - mid) * _settings.trackWidth;
                for (int z = 0; z < 20; z++)
                {
                    var pos = new Vector3(x, 0.01f, z * 5f);
                    var go = Instantiate(_laneIndicatorPrefab, pos, Quaternion.identity, _levelRoot);
                    _spawnedObjects.Add(go);
                }
            }
        }

        private void UpdateNoteSpawning()
        {
            if (CurrentLevel == null || _settings == null) return;

            double currentTime = AudioManager.Instance != null
                ? AudioManager.Instance.currentPlaybackTime
                : (AudioSettings.dspTime - _levelStartTime);

            float secondsPerBeat = _secondsPerBeat;
            float lookAheadTime = _spawnDistance / _settings.playerForwardSpeed;

            while (_currentNoteIndex < CurrentLevel.notes.Count)
            {
                var note = CurrentLevel.notes[_currentNoteIndex];
                double noteTime = note.beatIndex * secondsPerBeat + note.beatOffset * secondsPerBeat;
                double spawnTime = noteTime - lookAheadTime;

                if (currentTime >= spawnTime)
                {
                    SpawnNoteObject(note, _currentNoteIndex);
                    _activeNotes[_currentNoteIndex] = note;
                    _currentNoteIndex++;
                }
                else
                {
                    break;
                }
            }

            int totalBeats = CurrentLevel.TotalBeats;
            double levelDuration = totalBeats * secondsPerBeat + CurrentLevel.endDelay;
            if (currentTime >= levelDuration)
            {
                CompleteLevel();
            }
        }

        private void SpawnNoteObject(NoteData note, int index)
        {
            if (_settings == null) return;

            int mid = _settings.trackCount / 2;
            float x = (note.trackIndex - mid) * _settings.trackWidth;
            float y = GetNoteY(note.type);
            float secondsPerBeat = _secondsPerBeat;
            double noteTime = note.beatIndex * secondsPerBeat + note.beatOffset * secondsPerBeat;
            float z = (float)(noteTime * _settings.playerForwardSpeed) + note.zOffset;

            Vector3 pos = new Vector3(x, y, z);
            GameObject prefab = GetNotePrefab(note.type);
            GameObject go = null;

            if (prefab != null)
            {
                go = Instantiate(prefab, pos, Quaternion.identity, _levelRoot);
                _spawnedObjects.Add(go);
                _objectToNoteIndex[go] = index;
            }

            OnNoteSpawned?.Invoke(note);
        }

        private float GetNoteY(NoteType type)
        {
            switch (type)
            {
                case NoteType.Jump:
                case NoteType.ObstacleHigh:
                    return 1.5f;
                case NoteType.Slide:
                case NoteType.ObstacleLow:
                    return 0.5f;
                case NoteType.Fragment:
                    return 1f;
                default:
                    return 1f;
            }
        }

        private GameObject GetNotePrefab(NoteType type)
        {
            switch (type)
            {
                case NoteType.Jump:
                case NoteType.ObstacleHigh:
                    return _obstacleHighPrefab;
                case NoteType.Slide:
                case NoteType.ObstacleLow:
                    return _obstacleLowPrefab;
                case NoteType.Fragment:
                    return _fragmentPrefab;
                default:
                    return null;
            }
        }

        private void UpdateObjectMovement()
        {
            if (_settings == null) return;

            float scrollSpeed = _settings.playerForwardSpeed;

            for (int i = _spawnedObjects.Count - 1; i >= 0; i--)
            {
                var obj = _spawnedObjects[i];
                if (obj == null)
                {
                    _spawnedObjects.RemoveAt(i);
                    continue;
                }

                var pos = obj.transform.position;
                pos.z -= scrollSpeed * Time.deltaTime;
                obj.transform.position = pos;

                if (pos.z < _despawnDistance)
                {
                    _objectToNoteIndex.Remove(obj);
                    Destroy(obj);
                    _spawnedObjects.RemoveAt(i);
                }
            }
        }

        private void CheckForMissedNotes()
        {
            if (_settings == null || _player == null) return;

            double currentTime = AudioManager.Instance != null
                ? AudioManager.Instance.currentPlaybackTime
                : (AudioSettings.dspTime - _levelStartTime);

            var removeKeys = new System.Collections.Generic.List<int>();
            float secondsPerBeat = _secondsPerBeat;

            foreach (var kvp in _activeNotes)
            {
                int index = kvp.Key;
                var note = kvp.Value;
                if (_judgedNotes.Contains(index)) continue;

                double noteTime = note.beatIndex * secondsPerBeat + note.beatOffset * secondsPerBeat;
                double diff = currentTime - noteTime;

                if (diff > _settings.missWindow)
                {
                    JudgeNote(note, index, JudgmentType.Miss);
                    removeKeys.Add(index);
                }
            }

            foreach (var k in removeKeys)
            {
                _activeNotes.Remove(k);
            }
        }

        public HitResult TryJudgeAction(PlayerState state, int trackIndex)
        {
            if (_settings == null) return HitResult.None;

            double currentTime = AudioManager.Instance != null
                ? AudioManager.Instance.currentPlaybackTime
                : (AudioSettings.dspTime - _levelStartTime);

            float secondsPerBeat = _secondsPerBeat;
            NoteType requiredType = GetRequiredNoteType(state);
            if (requiredType == NoteType.Jump)
            {
            }

            NoteType[] validTypes = GetValidNoteTypes(state);
            int bestIndex = -1;
            NoteData bestNote = null;
            double bestDiff = double.MaxValue;

            foreach (var kvp in _activeNotes)
            {
                int idx = kvp.Key;
                var note = kvp.Value;
                if (_judgedNotes.Contains(idx)) continue;
                if (note.trackIndex != trackIndex) continue;

                bool isValid = false;
                foreach (var vt in validTypes)
                {
                    if (note.type == vt) { isValid = true; break; }
                }
                if (!isValid) continue;

                double noteTime = note.beatIndex * secondsPerBeat + note.beatOffset * secondsPerBeat;
                double diff = Math.Abs(currentTime - noteTime);

                if (diff <= _settings.missWindow && diff < bestDiff)
                {
                    bestDiff = diff;
                    bestIndex = idx;
                    bestNote = note;
                }
            }

            if (bestIndex >= 0 && bestNote != null)
            {
                double noteTime = bestNote.beatIndex * secondsPerBeat + bestNote.beatOffset * secondsPerBeat;
                JudgmentType judgment = BeatSystem.Instance != null
                    ? BeatSystem.Instance.JudgeTiming(noteTime, currentTime)
                    : JudgmentType.Good;

                JudgeNote(bestNote, bestIndex, judgment);
                return HitResult.Judged;
            }

            return HitResult.None;
        }

        private NoteType[] GetValidNoteTypes(PlayerState state)
        {
            switch (state)
            {
                case PlayerState.Jumping:
                    return new[] { NoteType.ObstacleHigh, NoteType.Jump, NoteType.Fragment };
                case PlayerState.Sliding:
                    return new[] { NoteType.ObstacleLow, NoteType.Slide, NoteType.Fragment };
                default:
                    return new[] { NoteType.Fragment };
            }
        }

        private NoteType GetRequiredNoteType(PlayerState state)
        {
            switch (state)
            {
                case PlayerState.Jumping: return NoteType.Jump;
                case PlayerState.Sliding: return NoteType.Slide;
                default: return NoteType.Fragment;
            }
        }

        public void JudgeNote(NoteData note, int noteIndex, JudgmentType judgment)
        {
            if (_judgedNotes.Contains(noteIndex)) return;
            _judgedNotes.Add(noteIndex);

            if (_runtimeData != null)
            {
                int fragments = (judgment != JudgmentType.Miss && note.type == NoteType.Fragment) ? note.fragmentValue : 0;
                _runtimeData.AddHit(judgment, fragments);

                if (_settings != null)
                {
                    int baseScore = GetScoreForJudgment(judgment);
                    float mult = 1f + Mathf.Min(_runtimeData.currentCombo * _settings.comboMultiplier,
                        _settings.maxComboMultiplier);
                    _runtimeData.currentScore += Mathf.RoundToInt(baseScore * mult);
                }

                if (note.type == NoteType.Fragment && judgment != JudgmentType.Miss)
                {
                    OnFragmentCollected?.Invoke(note.fragmentValue);
                }
            }

            OnNoteJudged?.Invoke(judgment, note);
        }

        private int GetScoreForJudgment(JudgmentType j)
        {
            if (_settings == null) return 0;
            switch (j)
            {
                case JudgmentType.Perfect: return _settings.perfectScore;
                case JudgmentType.Great: return _settings.greatScore;
                case JudgmentType.Good: return _settings.goodScore;
                default: return _settings.missScore;
            }
        }

        public void CheckCollisions()
        {
            if (_player == null || _settings == null) return;

            Vector3 playerPos = _player.transform.position;
            int playerTrack = _player.CurrentTrackIndex;
            int mid = _settings.trackCount / 2;
            float playerX = (playerTrack - mid) * _settings.trackWidth;
            float hitZ = 0f;

            var removeKeys = new System.Collections.Generic.List<int>();

            foreach (var kvp in _activeNotes)
            {
                int idx = kvp.Key;
                var note = kvp.Value;
                if (_judgedNotes.Contains(idx)) continue;
                if (note.trackIndex != playerTrack) continue;

                bool isObstacle = note.type == NoteType.ObstacleHigh || note.type == NoteType.ObstacleLow ||
                                  note.type == NoteType.Jump || note.type == NoteType.Slide;

                if (!isObstacle) continue;

                float secondsPerBeat = _secondsPerBeat;
                double noteTime = note.beatIndex * secondsPerBeat + note.beatOffset * secondsPerBeat;
                float noteZ = (float)(noteTime * _settings.playerForwardSpeed);
                float actualZ = noteZ - (float)(AudioManager.Instance?.currentPlaybackTime * _settings.playerForwardSpeed ?? 0);

                if (Mathf.Abs(actualZ - hitZ) < 0.8f)
                {
                    bool playerAvoided = false;
                    switch (note.type)
                    {
                        case NoteType.Jump:
                        case NoteType.ObstacleLow:
                            playerAvoided = _player.IsJumping;
                            break;
                        case NoteType.Slide:
                        case NoteType.ObstacleHigh:
                            playerAvoided = _player.IsSliding;
                            break;
                    }

                    if (!playerAvoided)
                    {
                        JudgeNote(note, idx, JudgmentType.Miss);
                        removeKeys.Add(idx);
                        TriggerFailure();
                    }
                }
            }

            foreach (var k in removeKeys)
            {
                _activeNotes.Remove(k);
            }
        }

        private void TriggerFailure()
        {
            if (_player != null) _player.Die();
            OnLevelFailed?.Invoke();
        }

        private void CompleteLevel()
        {
            if (!_isRunning) return;
            _isRunning = false;

            if (SaveSystem.CurrentSave != null && CurrentTrack != null)
            {
                SaveSystem.CurrentSave.totalFragmentsCollected += _runtimeData?.fragmentsCollected ?? 0;
                float acc = CalculateAccuracy();
                SaveSystem.AddHighScore(CurrentTrack.trackId,
                    _runtimeData?.currentScore ?? 0,
                    _runtimeData?.maxCombo ?? 0,
                    acc);
                SaveSystem.SaveSaveData();
            }

            OnLevelComplete?.Invoke();
        }

        public float CalculateAccuracy()
        {
            if (_runtimeData == null) return 0f;
            float total = _runtimeData.perfectCount + _runtimeData.greatCount +
                          _runtimeData.goodCount + _runtimeData.missCount;
            if (total == 0) return 100f;
            float weighted = (_runtimeData.perfectCount * 1.0f +
                             _runtimeData.greatCount * 0.8f +
                             _runtimeData.goodCount * 0.5f);
            return (weighted / total) * 100f;
        }
    }
}
