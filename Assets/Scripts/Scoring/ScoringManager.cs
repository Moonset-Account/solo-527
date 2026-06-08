using UnityEngine;
using System.Collections.Generic;
using System;

public class ScoringManager : Singleton<ScoringManager>
{
    public int currentScore;
    public int comboCount;
    public Timer comboTimer;
    public Dictionary<int, int> levelScores = new Dictionary<int, int>();
    public Dictionary<int, int> totalStars = new Dictionary<int, int>();

    public event Action<int> OnScoreChanged;
    public event Action<int> OnComboChanged;
    public event Action<int, int> OnStarEarned;

    private const float ComboWindow = 5f;

    private void Update()
    {
        if (comboTimer != null)
        {
            comboTimer.Tick(Time.deltaTime);
            if (comboTimer.IsFinished)
            {
                BreakCombo();
            }
        }
    }

    public void AddScore(int baseScore, DishRating rating, float timeBonus)
    {
        float multiplier = GetComboMultiplier();
        int ratingBonus = GetRatingBonus(rating);
        int total = Mathf.RoundToInt((baseScore + ratingBonus + timeBonus) * multiplier);

        currentScore += total;

        comboCount++;
        comboTimer = new Timer(ComboWindow);
        comboTimer.Start();

        OnScoreChanged?.Invoke(currentScore);
        OnComboChanged?.Invoke(comboCount);
    }

    public void ResetLevelScore()
    {
        currentScore = 0;
        comboCount = 0;
        comboTimer = null;
        OnScoreChanged?.Invoke(currentScore);
        OnComboChanged?.Invoke(comboCount);
    }

    public int CalculateStars(int score, LevelData data)
    {
        if (data == null) return 0;

        if (score >= data.targetScore3Stars) return 3;
        if (score >= data.targetScore2Stars) return 2;
        if (score >= data.targetScore) return 1;
        return 0;
    }

    public float GetComboMultiplier()
    {
        if (comboCount >= 5) return 2f;
        if (comboCount >= 3) return 1.5f;
        return 1f;
    }

    public void BreakCombo()
    {
        comboCount = 0;
        comboTimer = null;
        OnComboChanged?.Invoke(comboCount);
    }

    public void SaveLevelScore(int levelIndex)
    {
        levelScores[levelIndex] = currentScore;

        LevelData data = LevelManager.Instance.currentLevelData;
        int stars = CalculateStars(currentScore, data);

        if (!totalStars.ContainsKey(levelIndex) || totalStars[levelIndex] < stars)
        {
            totalStars[levelIndex] = stars;
            OnStarEarned?.Invoke(levelIndex, stars);
        }
    }

    private int GetRatingBonus(DishRating rating)
    {
        switch (rating)
        {
            case DishRating.Perfect: return 50;
            case DishRating.Gold: return 30;
            case DishRating.Silver: return 15;
            default: return 0;
        }
    }
}
