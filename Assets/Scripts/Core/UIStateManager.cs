using System;
using System.Collections.Generic;
using UnityEngine;

public enum UIState
{
    None,
    MainMenu,
    LevelSelect,
    Gameplay,
    Paused,
    Settings,
    SupplyPanel,
    RoutePlanner,
    MissionResult,
    Collection,
    Map
}

public class UIStateManager : MonoBehaviour
{
    public static UIStateManager Instance { get; private set; }

    public UIState CurrentState { get; private set; } = UIState.None;

    public event Action<UIState, UIState> OnStateChanged;

    public bool IsInGameplay => CurrentState == UIState.Gameplay;

    private Stack<UIState> _stateStack = new Stack<UIState>();

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    public void PushState(UIState state)
    {
        var previous = CurrentState;
        _stateStack.Push(CurrentState);
        CurrentState = state;
        OnStateChanged?.Invoke(previous, CurrentState);
    }

    public void PopState()
    {
        if (_stateStack.Count == 0) return;

        var previous = CurrentState;
        CurrentState = _stateStack.Pop();
        OnStateChanged?.Invoke(previous, CurrentState);
    }

    public void ChangeState(UIState state)
    {
        var previous = CurrentState;
        _stateStack.Clear();
        CurrentState = state;
        OnStateChanged?.Invoke(previous, CurrentState);
    }

    public Stack<UIState> GetStateStack()
    {
        return new Stack<UIState>(_stateStack);
    }
}
