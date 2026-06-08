using UnityEngine;
using System.Collections.Generic;
using System;

public class PlayerManager : Singleton<PlayerManager>
{
    public List<PlayerController> players = new List<PlayerController>();
    public int activePlayerCount;
    public bool isSoloMode;
    public int controlledPlayerIndex;

    public void RegisterPlayer(PlayerController player)
    {
        if (players.Count >= GameConstants.MAX_PLAYERS) return;

        players.Add(player);
        player.playerIndex = players.Count - 1;

        if (isSoloMode)
        {
            player.isControlled = player.playerIndex == controlledPlayerIndex;
        }
        else
        {
            player.isControlled = true;
        }

        activePlayerCount = players.Count;
    }

    public PlayerController GetPlayer(int index)
    {
        if (index < 0 || index >= players.Count) return null;
        return players[index];
    }

    public void SwitchControlledPlayer(int newIndex)
    {
        if (!isSoloMode) return;
        if (players.Count == 0) return;

        controlledPlayerIndex = newIndex % players.Count;
        if (controlledPlayerIndex < 0) controlledPlayerIndex += players.Count;

        foreach (var player in players)
        {
            player.isControlled = false;
        }

        players[controlledPlayerIndex].isControlled = true;
    }

    public PlayerController GetControlledPlayer()
    {
        if (players.Count == 0) return null;
        if (isSoloMode)
        {
            if (controlledPlayerIndex >= 0 && controlledPlayerIndex < players.Count)
            {
                return players[controlledPlayerIndex];
            }
            return null;
        }
        return players.Count > 0 ? players[0] : null;
    }

    public void SetSoloMode(bool solo)
    {
        isSoloMode = solo;
        controlledPlayerIndex = 0;

        if (solo)
        {
            foreach (var player in players)
            {
                player.isControlled = false;
            }
            if (players.Count > 0)
            {
                players[0].isControlled = true;
            }
        }
        else
        {
            foreach (var player in players)
            {
                player.isControlled = true;
            }
        }

        activePlayerCount = isSoloMode ? 1 : players.Count;
    }

    public void SetMultiplayerMode(int playerCount)
    {
        isSoloMode = false;
        activePlayerCount = Mathf.Min(playerCount, GameConstants.MAX_PLAYERS);

        foreach (var player in players)
        {
            player.isControlled = player.playerIndex < activePlayerCount;
        }
    }
}
