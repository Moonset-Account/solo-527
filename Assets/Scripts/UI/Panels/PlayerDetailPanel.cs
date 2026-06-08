using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class PlayerDetailPanel : UIPanel
{
    public Text nameText;
    public Text positionText;
    public Text stateText;
    public Image staminaBar;
    public Image speedBar;
    public Image techniqueBar;
    public Image tacticalBar;
    public Image mentalBar;
    public Text injuryRiskText;
    public Text moraleText;
    public Text overallText;
    public Button closeBtn;

    private PlayerData currentPlayer;

    public void SetPlayer(PlayerData player)
    {
        currentPlayer = player;
    }

    public override void OnShow()
    {
        closeBtn.onClick.RemoveAllListeners();
        closeBtn.onClick.AddListener(Close);
        if (currentPlayer != null)
        {
            UpdateDisplay();
        }
    }

    void UpdateDisplay()
    {
        if (currentPlayer == null) return;
        nameText.text = currentPlayer.playerName;
        positionText.text = currentPlayer.position.ToString();
        stateText.text = currentPlayer.state.ToString();
        staminaBar.fillAmount = currentPlayer.stamina / 100f;
        speedBar.fillAmount = currentPlayer.speed / 100f;
        techniqueBar.fillAmount = currentPlayer.technique / 100f;
        tacticalBar.fillAmount = currentPlayer.tactical / 100f;
        mentalBar.fillAmount = currentPlayer.mental / 100f;
        injuryRiskText.text = "伤病风险: " + (currentPlayer.injuryRisk * 100).ToString("F1") + "%";
        moraleText.text = "士气: " + currentPlayer.morale;
        overallText.text = "综合: " + currentPlayer.GetOverallRating().ToString("F1");
    }

    public void Close()
    {
        UIManager.Instance.ShowPanel("MainGame");
    }
}
