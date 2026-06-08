using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

public class UIManager : MonoBehaviour
{
    public static UIManager Instance;

    public Dictionary<string, UIPanel> panels = new Dictionary<string, UIPanel>();
    public Transform panelContainer;

    private string currentPanelName;

    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void RegisterPanel(string panelName, UIPanel panel)
    {
        if (!panels.ContainsKey(panelName))
        {
            panels[panelName] = panel;
            panel.OnInit();
        }
    }

    public void ShowPanel(string panelName)
    {
        if (currentPanelName != null && panels.ContainsKey(currentPanelName))
        {
            panels[currentPanelName].Hide();
        }

        if (panels.ContainsKey(panelName))
        {
            panels[panelName].Show();
            currentPanelName = panelName;
        }
    }

    public void HidePanel(string panelName)
    {
        if (panels.ContainsKey(panelName))
        {
            panels[panelName].Hide();
            if (currentPanelName == panelName)
            {
                currentPanelName = null;
            }
        }
    }

    public void HideAll()
    {
        foreach (var kvp in panels)
        {
            kvp.Value.Hide();
        }
        currentPanelName = null;
    }

    public T GetPanel<T>(string panelName) where T : UIPanel
    {
        if (panels.ContainsKey(panelName))
        {
            return panels[panelName] as T;
        }
        return null;
    }
}
