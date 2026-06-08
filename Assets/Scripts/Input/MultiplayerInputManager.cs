using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.PlayerInput;

public class MultiplayerInputManager : Singleton<MultiplayerInputManager>
{
    public event Action<int> OnPlayerJoined;
    public event Action<int> OnPlayerLeft;

    private readonly Dictionary<int, PlayerInput> _playerInputs = new Dictionary<int, PlayerInput>();
    private PlayerInputManager _playerInputManager;

    protected override void Awake()
    {
        base.Awake();
        _playerInputManager = GetComponent<PlayerInputManager>();
        if (_playerInputManager != null)
        {
            _playerInputManager.onPlayerJoined += HandlePlayerJoined;
            _playerInputManager.onPlayerLeft += HandlePlayerLeft;
        }
    }

    private void HandlePlayerJoined(PlayerInput playerInput)
    {
        int index = playerInput.playerIndex;
        _playerInputs[index] = playerInput;
        OnPlayerJoined?.Invoke(index);
    }

    private void HandlePlayerLeft(PlayerInput playerInput)
    {
        int index = playerInput.playerIndex;
        _playerInputs.Remove(index);
        OnPlayerLeft?.Invoke(index);
    }

    public PlayerInput GetPlayerInput(int playerIndex)
    {
        _playerInputs.TryGetValue(playerIndex, out PlayerInput input);
        return input;
    }

    public int GetActivePlayerCount()
    {
        return _playerInputs.Count;
    }

    public void EnablePlayer(int playerIndex)
    {
        if (_playerInputs.TryGetValue(playerIndex, out PlayerInput input))
            input.enabled = true;
    }

    public void DisablePlayer(int playerIndex)
    {
        if (_playerInputs.TryGetValue(playerIndex, out PlayerInput input))
            input.enabled = false;
    }

    protected override void OnDestroy()
    {
        if (_playerInputManager != null)
        {
            _playerInputManager.onPlayerJoined -= HandlePlayerJoined;
            _playerInputManager.onPlayerLeft -= HandlePlayerLeft;
        }
        base.OnDestroy();
    }
}
