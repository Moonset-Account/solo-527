using UnityEngine;
using System.Collections.Generic;

public class UIStateDispatcher : MonoBehaviour
{
    public GameObject mainMenuPanel;
    public GameObject levelSelectPanel;
    public GameObject hudPanel;
    public GameObject pausePanel;
    public GameObject missionResultPanel;
    public GameObject settingsPanel;
    public GameObject supplyPanel;
    public GameObject collectionPanel;
    public GameObject mapPanel;
    public GameObject routePlannerPanel;

    private Dictionary<UIState, GameObject> _statePanelMap;

    private void Awake()
    {
        _statePanelMap = new Dictionary<UIState, GameObject>
        {
            { UIState.MainMenu, mainMenuPanel },
            { UIState.LevelSelect, levelSelectPanel },
            { UIState.Gameplay, hudPanel },
            { UIState.Paused, pausePanel },
            { UIState.MissionResult, missionResultPanel },
            { UIState.Settings, settingsPanel },
            { UIState.SupplyPanel, supplyPanel },
            { UIState.Collection, collectionPanel },
            { UIState.Map, mapPanel },
            { UIState.RoutePlanner, routePlannerPanel }
        };
    }

    private void OnEnable()
    {
        if (UIStateManager.Instance != null)
            UIStateManager.Instance.OnStateChanged += HandleStateChanged;
    }

    private void OnDisable()
    {
        if (UIStateManager.Instance != null)
            UIStateManager.Instance.OnStateChanged -= HandleStateChanged;
    }

    private void HandleStateChanged(UIState previous, UIState current)
    {
        DeactivateAll();

        Stack<UIState> stack = UIStateManager.Instance.GetStateStack();
        foreach (var state in stack)
        {
            ActivatePanel(state);
        }

        ActivatePanel(current);
    }

    private void ActivatePanel(UIState state)
    {
        if (_statePanelMap != null && _statePanelMap.TryGetValue(state, out var panel) && panel != null)
            panel.SetActive(true);
    }

    private void DeactivateAll()
    {
        if (_statePanelMap == null) return;
        foreach (var kvp in _statePanelMap)
        {
            if (kvp.Value != null)
                kvp.Value.SetActive(false);
        }
    }
}
