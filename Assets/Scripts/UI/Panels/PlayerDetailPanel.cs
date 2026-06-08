using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class PlayerDetailPanel : UIPanel
{
    public Text nameText;
    public Text positionText;
    public Text stateText;
    public Image staminaBarFill;
    public Image speedBarFill;
    public Image techniqueBarFill;
    public Image tacticalBarFill;
    public Image mentalBarFill;
    public Text injuryRiskText;
    public Text moraleText;
    public Text overallText;
    public Button closeBtn;
    private PlayerData currentPlayer;
    private bool uiCreated;

    public void SetPlayer(PlayerData player) { currentPlayer = player; }

    public override void OnInit()
    {
        if (uiCreated) return;
        uiCreated = true;
        UIHelper.CreateTitle(transform, "Title", "球员详情", 32);
        nameText = UIHelper.CreateText(transform, "NameText", "", new Vector2(0.1f, 0.85f), new Vector2(0.9f, 0.92f), 28);
        positionText = UIHelper.CreateText(transform, "PositionText", "", new Vector2(0.1f, 0.8f), new Vector2(0.5f, 0.85f), 20);
        stateText = UIHelper.CreateText(transform, "StateText", "", new Vector2(0.5f, 0.8f), new Vector2(0.9f, 0.85f), 20);

        UIHelper.CreateText(transform, "StaminaLabel", "体能:", new Vector2(0.1f, 0.72f), new Vector2(0.25f, 0.77f), 16);
        staminaBarFill = UIHelper.CreateStatBar(transform, "StaminaBar", "体能", 0, new Vector2(0.25f, 0.72f), new Vector2(0.9f, 0.77f));
        UIHelper.CreateText(transform, "SpeedLabel", "速度:", new Vector2(0.1f, 0.64f), new Vector2(0.25f, 0.69f), 16);
        speedBarFill = UIHelper.CreateStatBar(transform, "SpeedBar", "速度", 0, new Vector2(0.25f, 0.64f), new Vector2(0.9f, 0.69f));
        UIHelper.CreateText(transform, "TechLabel", "技术:", new Vector2(0.1f, 0.56f), new Vector2(0.25f, 0.61f), 16);
        techniqueBarFill = UIHelper.CreateStatBar(transform, "TechBar", "技术", 0, new Vector2(0.25f, 0.56f), new Vector2(0.9f, 0.61f));
        UIHelper.CreateText(transform, "TacLabel", "战术:", new Vector2(0.1f, 0.48f), new Vector2(0.25f, 0.53f), 16);
        tacticalBarFill = UIHelper.CreateStatBar(transform, "TacBar", "战术", 0, new Vector2(0.25f, 0.48f), new Vector2(0.9f, 0.53f));
        UIHelper.CreateText(transform, "MentalLabel", "心理:", new Vector2(0.1f, 0.4f), new Vector2(0.25f, 0.45f), 16);
        mentalBarFill = UIHelper.CreateStatBar(transform, "MentalBar", "心理", 0, new Vector2(0.25f, 0.4f), new Vector2(0.9f, 0.45f));

        injuryRiskText = UIHelper.CreateText(transform, "InjuryRiskText", "", new Vector2(0.1f, 0.32f), new Vector2(0.5f, 0.38f), 18);
        moraleText = UIHelper.CreateText(transform, "MoraleText", "", new Vector2(0.5f, 0.32f), new Vector2(0.9f, 0.38f), 18);
        overallText = UIHelper.CreateText(transform, "OverallText", "", new Vector2(0.1f, 0.24f), new Vector2(0.9f, 0.32f), 26);
        closeBtn = UIHelper.CreateButton(transform, "CloseBtn", "返回", new Vector2(0.3f, 0.05f), new Vector2(0.7f, 0.14f), 22);
    }

    public override void OnShow()
    {
        OnInit();
        closeBtn.onClick.RemoveAllListeners();
        closeBtn.onClick.AddListener(Close);
        if (currentPlayer != null) UpdateDisplay();
    }

    void UpdateDisplay()
    {
        if (currentPlayer == null) return;
        nameText.text = currentPlayer.playerName;
        positionText.text = "位置: " + currentPlayer.position;
        stateText.text = "状态: " + currentPlayer.state;
        UpdateStatBar(staminaBarFill, "体能", currentPlayer.stamina / 100f);
        UpdateStatBar(speedBarFill, "速度", currentPlayer.speed / 100f);
        UpdateStatBar(techniqueBarFill, "技术", currentPlayer.technique / 100f);
        UpdateStatBar(tacticalBarFill, "战术", currentPlayer.tactical / 100f);
        UpdateStatBar(mentalBarFill, "心理", currentPlayer.mental / 100f);
        injuryRiskText.text = "伤病风险: " + (currentPlayer.injuryRisk * 100).ToString("F1") + "%";
        moraleText.text = "士气: " + currentPlayer.morale;
        overallText.text = "综合评分: " + currentPlayer.GetOverallRating().ToString("F1");
    }

    void UpdateStatBar(Image fill, string label, float value)
    {
        if (fill == null) return;
        RectTransform fillRt = fill.rectTransform;
        fillRt.anchorMax = new Vector2(Mathf.Clamp01(value), 1f);
        fill.color = value > 0.6f ? UIHelper.AccentColor : (value > 0.3f ? UIHelper.WarningColor : UIHelper.DangerColor);
        Text barLabel = fill.transform.parent?.Find("Label")?.GetComponent<Text>();
        if (barLabel != null) barLabel.text = label + ": " + (value * 100).ToString("F0");
    }

    public void Close() { UIManager.Instance.ShowPanel("MainGame"); }
}
