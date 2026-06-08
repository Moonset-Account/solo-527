using System;
using System.Collections.Generic;
using UnityEngine;
using RainAlley.BeatSystem;
using RainAlley.Calibration;
using RainAlley.Core;
using RainAlley.Gameplay;
using RainAlley.InputSystem;
using RainAlley.Leaderboard;
using RainAlley.Replay;
using RainAlley.Track;

namespace RainAlley.GameFlow
{
    public enum GameState
    {
        Menu,
        Calibration,
        Countdown,
        Playing,
        Replay,
        Paused,
        Failed,
        Results
    }

    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public GameState CurrentState { get; private set; } = GameState.Menu;

        public LevelConfig CurrentLevel { get; private set; }
        public GameStats CurrentStats { get; private set; }

        public BeatClock Clock { get; private set; }
        public BeatJudge Judge { get; private set; }
        public ColorStateMachine ColorState { get; private set; }
        public TrackObstacleManager TrackMgr { get; private set; }
        public CalibrationManager Calibration { get; private set; }
        public InputManager Input { get; private set; }
        public LeaderboardManager Leaderboard { get; private set; }
        public ReplayManager Replay { get; private set; }

        private int _missStreak = 0;
        private int _failCountdown = 3;

        public event Action<GameState, GameState> OnStateChanged;
        public event Action<JudgeResult, ObstacleData> OnAnyJudge;
        public event Action<int> OnComboBroken;
        public event Action<int, int, int> OnCountdownTick;
        public event Action OnLevelComplete;
        public event Action<string, string> OnShowHint;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            InitializeSystems();
        }

        private void InitializeSystems()
        {
            CurrentStats = new GameStats();
            Calibration = new CalibrationManager();
            Input = new InputManager();
            Leaderboard = new LeaderboardManager();
            Replay = new ReplayManager();

            Input.OnJudgeInput += HandleJudgeInput;
            Input.OnColorSelect += HandleColorSelect;
            Input.OnColorNext += () => ColorState?.CycleColorForward();
            Input.OnColorPrev += () => ColorState?.CycleColorBackward();
            Input.OnTrackToggle += HandleTrackToggle;
            Input.OnPause += TogglePause;

            Calibration.OnCalibrationComplete += (rec, std, total) =>
            {
                ShowHint("校准完成", $"推荐延迟: {rec:F0}ms\n{Calibration.GetWindowDescription()}");
            };

            ColorState = new ColorStateMachine(new List<UmbrellaColorType>
            { UmbrellaColorType.Blue, UmbrellaColorType.Pink }, false);

            ColorState.OnColorChanged += (oldC, newC) =>
            {
                if (CurrentState == GameState.Playing || CurrentState == GameState.Replay)
                {
                    int idx = ColorState.GetAvailableColors().IndexOf(newC);
                    Replay?.RecordColorSwitch(Clock.ElapsedMs, newC, idx);
                }
            };

            ColorState.OnTrackChanged += (oldT, newT) =>
            {
                if (CurrentState == GameState.Playing || CurrentState == GameState.Replay)
                {
                    Replay?.RecordTrackSwitch(Clock.ElapsedMs, newT);
                }
            };
        }

        private void Update()
        {
            Input?.Tick();

            if (CurrentState == GameState.Playing || CurrentState == GameState.Replay)
            {
                TickGameplay(Time.deltaTime);
            }
            else if (CurrentState == GameState.Calibration)
            {
                TickCalibration();
            }
        }

        private void TickGameplay(float dt)
        {
            double prevBeat = Clock.CurrentBeatIndex;
            Clock.Tick();

            if (CurrentState == GameState.Replay)
            {
                TrackMgr.Update(Clock.ElapsedMs, Calibration.Settings.TotalLatencyMs,
                    (_, __) => false);

                var replayEvents = Replay.TickReplay(Clock.ElapsedMs - _replayStartOffsetMs);
                foreach (var ev in replayEvents) ApplyReplayEvent(ev);

                if (prevBeat != Clock.CurrentBeatIndex)
                    CheckEndReplay();
            }
            else
            {
                TrackMgr.Update(Clock.ElapsedMs, Calibration.Settings.TotalLatencyMs,
                    Judge.CheckAutoMiss);
            }

            if (TrackMgr != null)
            {
                for (int i = TrackMgr.ActiveWindowObstacles.Count - 1; i >= 0; i--)
                {
                    var obs = TrackMgr.ActiveWindowObstacles[i];
                    if (obs.Status == ObstacleStatus.Missed && obs.Result.Type == JudgeType.Miss)
                    {
                        HandleMissResult(obs);
                    }
                }
            }

            if (Clock.IsFinished && CurrentState == GameState.Playing)
            {
                CompleteLevel();
            }
        }

        private double _replayEndThresholdMs = 0;
        private int _replayStartBeat = 0;
        private int _replayFailBeat = 0;
        private double _replayStartOffsetMs = 0;

        private void CheckEndReplay()
        {
            double replayDurMs = (_replayFailBeat - _replayStartBeat) * Clock.MsPerBeat;
            double cur = Clock.ElapsedMs - _replayStartOffsetMs;

            if (cur >= replayDurMs - Clock.MsPerBeat * 0.5 && !Replay.IsReplaying) return;
            if (cur >= replayDurMs)
            {
                ExitReplay();
            }
        }

        private void ApplyReplayEvent(ReplayInputEvent ev)
        {
            switch (ev.ActionType)
            {
                case InputActionType.ColorSwitch:
                    ColorState.SetColorByIndex(ev.ColorIndex);
                    break;
                case InputActionType.TrackSwitch:
                    ColorState.SetTrack(ev.Track);
                    break;
                case InputActionType.JudgeInput:
                    break;
            }
        }

        private void HandleJudgeInput()
        {
            if (CurrentState == GameState.Calibration)
            {
                Calibration.RecordInput(Clock.ElapsedMs);
                return;
            }

            if (CurrentState != GameState.Playing && CurrentState != GameState.Replay) return;

            var target = TrackMgr.FindClosestActiveToJudge(
                Clock.ElapsedMs,
                Calibration.Settings.TotalLatencyMs,
                Judge.GoodWindowMs);

            if (target == null) return;

            var result = Judge.JudgeInput(
                Clock.ElapsedMs,
                target.Data,
                ColorState.CurrentColor,
                ColorState.CurrentTrack);

            TrackMgr.MarkJudged(target, result);
            CurrentStats.AddResult(result);
            OnAnyJudge?.Invoke(result, target.Data);
            Replay?.RecordJudgeInput(Clock.ElapsedMs, result);

            if (!result.IsSuccessful)
            {
                HandleMissResult(target);
            }
            else
            {
                _missStreak = 0;
            }
        }

        private void HandleColorSelect(int index)
        {
            ColorState?.SetColorByIndex(index);
        }

        private void HandleTrackToggle()
        {
            if (CurrentLevel != null && CurrentLevel.UnlockDualTrack)
            {
                ColorState?.ToggleTrack();
            }
        }

        private void HandleMissResult(Track.ActiveObstacle obs)
        {
            if (CurrentState != GameState.Playing) return;
            _missStreak++;

            if (CurrentStats.CurrentCombo == 0 && CurrentStats.TotalObstacles > 1)
            {
                int prevCombo = Math.Max(1, obs.Index > 0 ? obs.Index : 1);
                OnComboBroken?.Invoke(prevCombo);
            }

            if (CurrentLevel != null && _missStreak >= CurrentLevel.MissThreshold)
            {
                HandleFailure(obs.Data.BeatIndex);
            }
        }

        private void HandleFailure(int failBeat)
        {
            if (CurrentLevel == null) return;

            if (Replay.PrepareReplay(failBeat, Clock.MsPerBeat, out int startBeat, out int endBeat))
            {
                _replayStartBeat = startBeat;
                _replayFailBeat = endBeat;

                RollbackStatsToBeat(startBeat);

                TrackMgr.RewindToBeat(startBeat);

                GameplaySceneVisuals.Instance?.ClearForRewind(startBeat, TrackMgr);

                Clock.SeekToBeat(startBeat);
                _replayStartOffsetMs = startBeat * Clock.MsPerBeat;

                Replay.BeginReplay();
                ChangeState(GameState.Replay);

                ShowHint("回放到前八拍", $"从第 {startBeat + 1} 拍到第 {endBeat} 拍\n回放结束后你可以重新操作！");
            }
            else
            {
                ChangeState(GameState.Failed);
            }

            _missStreak = 0;
        }

        private void RollbackStatsToBeat(int beatIndex)
        {
            var list = TrackMgr != null ? TrackMgr.AllObstacles : null;
            if (list == null) return;

            GameStats rebuilt = new GameStats();
            foreach (var o in list)
            {
                if (o.Data == null || o.Data.BeatIndex >= beatIndex) break;
                if (o.Status == ObstacleStatus.Judged || o.Status == ObstacleStatus.Missed)
                {
                    if (o.Status == ObstacleStatus.Judged || o.Result.Type == JudgeType.Miss)
                        rebuilt.AddResult(o.Result);
                }
            }

            int perfect = rebuilt.PerfectCount;
            int early = rebuilt.EarlyCount;
            int late = rebuilt.LateCount;
            int miss = rebuilt.MissCount;
            int maxCombo = rebuilt.MaxCombo;
            int combo = rebuilt.CurrentCombo;
            int score = rebuilt.TotalScore;
            int total = rebuilt.TotalObstacles;

            CurrentStats.Reset();
            for (int i = 0; i < total; i++)
            {
                var fake = new JudgeResult();
                if (i < perfect) fake.Type = JudgeType.Perfect;
                else if (i < perfect + early) fake.Type = JudgeType.Early;
                else if (i < perfect + early + late) fake.Type = JudgeType.Late;
                else fake.Type = JudgeType.Miss;
                fake.ColorCorrect = true;
                fake.TrackCorrect = true;
                switch (fake.Type)
                {
                    case JudgeType.Perfect: fake.Score = Judge != null ? Judge.PerfectScore : 300; break;
                    case JudgeType.Early:
                    case JudgeType.Late: fake.Score = Judge != null ? Judge.GoodScore : 150; break;
                    default: fake.Score = 0; fake.ColorCorrect = fake.Type != JudgeType.Miss; break;
                }
                if (fake.Type == JudgeType.Miss) { fake.ColorCorrect = false; fake.TrackCorrect = false; }
                CurrentStats.AddResult(fake);
            }

            if (maxCombo > CurrentStats.MaxCombo)
            {
                var field = typeof(GameStats).GetField("MaxCombo",
                    System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                if (field != null) field.SetValueDirect(__makeref(CurrentStats), maxCombo);
            }
        }

        public void ExitReplay()
        {
            if (CurrentState != GameState.Replay) return;
            Replay.EndReplay();
            ChangeState(GameState.Playing);
        }

        public void StartLevel(LevelConfig level)
        {
            CurrentLevel = level;
            CurrentStats.Reset();
            _missStreak = 0;
            Replay.ClearRun();

            Clock = new BeatClock(level.BPM, level.TotalBeats, level.BeatsPerMeasure);
            Judge = new BeatJudge(
                Calibration.Settings.PerfectWindowMs,
                Calibration.Settings.GoodWindowMs,
                Calibration.Settings.TotalLatencyMs);

            ColorState.SetAvailableColors(level.AvailableColors);
            ColorState.SetDualTrackEnabled(level.UnlockDualTrack);
            ColorState.Reset();

            TrackMgr = new TrackObstacleManager();
            TrackMgr.LoadObstacles(level.Obstacles);
            TrackMgr.OnObstacleJudged += (o, r) => { };

            if (GameplaySceneVisuals.Instance != null)
                GameplaySceneVisuals.Instance.Attach();

            ChangeState(GameState.Countdown);
            StartCountdown();
        }

        private async void StartCountdown()
        {
            for (int i = _failCountdown; i > 0; i--)
            {
                OnCountdownTick?.Invoke(i, _failCountdown, Clock.CurrentBeatIndex);
                await System.Threading.Tasks.Task.Delay(800);
                if (CurrentState != GameState.Countdown) return;
            }
            OnCountdownTick?.Invoke(0, _failCountdown, 0);
            await System.Threading.Tasks.Task.Delay(200);
            if (CurrentState != GameState.Countdown) return;

            Clock.Start();
            ChangeState(GameState.Playing);
        }

        private void CompleteLevel()
        {
            if (CurrentStats.MissCount < CurrentLevel.MissThreshold * 2)
            {
                Leaderboard.AddEntry(CurrentStats, CurrentLevel);
            }
            OnLevelComplete?.Invoke();
            ChangeState(GameState.Results);
        }

        public void TogglePause()
        {
            if (CurrentState == GameState.Playing)
            {
                Clock.Pause();
                ChangeState(GameState.Paused);
            }
            else if (CurrentState == GameState.Paused)
            {
                Clock.Start();
                ChangeState(GameState.Playing);
            }
        }

        public void RestartLevel()
        {
            if (CurrentLevel != null) StartLevel(CurrentLevel);
        }

        public void ExitToMenu()
        {
            Clock?.Stop();
            ChangeState(GameState.Menu);
        }

        public void ChangeStatePublic(GameState newState)
        {
            ChangeState(newState);
        }

        public void ShowHintPublic(string title, string content)
        {
            ShowHint(title, content);
        }

        public void PublicExitReplay()
        {
            ExitReplay();
        }

        private void ChangeState(GameState newState)
        {
            if (CurrentState == newState) return;
            var old = CurrentState;
            CurrentState = newState;
            OnStateChanged?.Invoke(old, newState);
        }

        private void ShowHint(string title, string content)
        {
            OnShowHint?.Invoke(title, content);
        }

        public void StartCalibrationMode()
        {
            Clock = new BeatClock(80, 100, 4);
            Clock.Start();
            Calibration.StartCalibration(80);
            ChangeState(GameState.Calibration);
        }

        private void TickCalibration()
        {
            Clock?.Tick();
        }

        public void EndCalibrationMode()
        {
            Calibration.StopCalibration();
            Clock?.Stop();
            ChangeState(GameState.Menu);
        }
    }
}
