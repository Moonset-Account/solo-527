using System;
using UnityEngine;
using YouthTrainingManagement.Core;

namespace YouthTrainingManagement.Utils
{
    public class TimeSystem
    {
        public float RealTimeSinceStart { get; private set; }
        public bool IsPaused { get; private set; }
        public float TimeScaleMultiplier { get; set; } = 1f;

        public event Action<DayPhase> OnPhaseChanged;
        public event Action<int> OnWeekChanged;
        public event Action OnDayAdvanced;

        public void UpdateTime(float deltaTime)
        {
            if (IsPaused) return;
            RealTimeSinceStart += deltaTime * TimeScaleMultiplier;
        }

        public void Pause()
        {
            if (!IsPaused)
            {
                IsPaused = true;
                Time.timeScale = 0f;
            }
        }

        public void Unpause()
        {
            if (IsPaused)
            {
                IsPaused = false;
                Time.timeScale = 1f;
            }
        }

        public void AdvancePhase(GameManager gm)
        {
            if (gm?.Season == null) return;

            var currentPhase = gm.Season.CurrentPhase;
            DayPhase nextPhase;

            switch (currentPhase)
            {
                case DayPhase.Morning:
                    nextPhase = DayPhase.Afternoon;
                    break;
                case DayPhase.Afternoon:
                    nextPhase = DayPhase.Evening;
                    break;
                case DayPhase.Evening:
                case DayPhase.MatchDay:
                    nextPhase = DayPhase.Morning;
                    AdvanceDay(gm);
                    break;
                default:
                    nextPhase = DayPhase.Morning;
                    break;
            }

            gm.Season.CurrentPhase = nextPhase;
            OnPhaseChanged?.Invoke(nextPhase);
            gm.UIManager?.UpdateTimeDisplay();
            gm.SaveSystem?.SaveAll();
        }

        private void AdvanceDay(GameManager gm)
        {
            gm.Season.CurrentDayInWeek++;
            if (gm.Season.CurrentDayInWeek >= 7)
            {
                gm.Season.CurrentDayInWeek = 0;
                gm.Season.CurrentWeek++;
                gm.Finance?.ProcessWeeklySettlement(gm.Season.CurrentWeek);
                OnWeekChanged?.Invoke(gm.Season.CurrentWeek);
                gm.Stats.WeeksCompleted++;
            }
            OnDayAdvanced?.Invoke();
            gm.Stats.DaysPlayed++;

            gm.PlayerSystem?.CommitWeeklyGains();
        }

        public void AdvancePhaseAfterMatch()
        {
        }

        public int CurrentWeek { get; set; }
        public int CurrentDay { get; set; }
        public DayPhase CurrentPhase { get; set; }
    }
}
