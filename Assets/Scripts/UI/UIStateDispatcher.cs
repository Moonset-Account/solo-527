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
    private bool _discovered;

    private void Awake()
    {
        DiscoverPanels();
        BuildMap();
    }

    private void DiscoverPanels()
    {
        if (_discovered) return;
        _discovered = true;

        var canvas = GetComponentInParent<Canvas>();
        Transform searchRoot = canvas != null ? canvas.transform : transform;

        if (mainMenuPanel == null)
        {
            var comp = searchRoot.GetComponentInChildren<MainMenuPanel>(true);
            if (comp != null) mainMenuPanel = comp.gameObject;
        }

        if (levelSelectPanel == null)
        {
            var comp = searchRoot.GetComponentInChildren<LevelSelectPanel>(true);
            if (comp != null) levelSelectPanel = comp.gameObject;
        }

        if (hudPanel == null)
        {
            var comp = searchRoot.GetComponentInChildren<HUDPanel>(true);
            if (comp != null) hudPanel = comp.gameObject;
        }

        if (pausePanel == null)
        {
            var comp = searchRoot.GetComponentInChildren<PausePanel>(true);
            if (comp != null) pausePanel = comp.gameObject;
        }

        if (missionResultPanel == null)
        {
            var comp = searchRoot.GetComponentInChildren<MissionResultPanel>(true);
            if (comp != null) missionResultPanel = comp.gameObject;
        }

        if (settingsPanel == null)
        {
            var comp = searchRoot.GetComponentInChildren<SettingsPanel>(true);
            if (comp != null) settingsPanel = comp.gameObject;
        }

        if (supplyPanel == null)
        {
            var comp = searchRoot.GetComponentInChildren<SupplyPanel>(true);
            if (comp != null) supplyPanel = comp.gameObject;
        }

        if (collectionPanel == null)
        {
            var comp = searchRoot.GetComponentInChildren<CollectionPanel>(true);
            if (comp != null) collectionPanel = comp.gameObject;
        }

        if (mapPanel == null)
        {
            var comp = searchRoot.GetComponentInChildren<MapPanel>(true);
            if (comp != null) mapPanel = comp.gameObject;
        }

        if (routePlannerPanel == null)
        {
            var comp = searchRoot.GetComponentInChildren<RoutePlanner>(true);
            if (comp != null) routePlannerPanel = comp.gameObject;
        }
    }

    private void BuildMap()
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
