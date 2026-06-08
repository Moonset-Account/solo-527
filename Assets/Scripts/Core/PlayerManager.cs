using System;
using System.Collections.Generic;
using UnityEngine;

namespace Kitchen.Core
{
    public class PlayerManager : MonoBehaviour
    {
        public static PlayerManager Instance { get; private set; }

        [Header("Player Setup")]
        public GameObject playerPrefab;
        public Transform[] spawnPoints;
        public Color[] playerColors = new Color[]
        {
            new Color(1f, 0.3f, 0.3f),
            new Color(0.3f, 0.6f, 1f),
            new Color(0.3f, 1f, 0.4f),
            new Color(1f, 0.8f, 0.2f)
        };

        [Header("Runtime")]
        [SerializeField] private List<PlayerController> players = new List<PlayerController>();
        [SerializeField] private int activePlayerIndex = 0;
        [SerializeField] private int maxPlayers = 4;

        public IReadOnlyList<PlayerController> Players => players;
        public int PlayerCount => players.Count;
        public event Action<int> OnPlayerJoined;
        public event Action<int> OnPlayerLeft;
        public event Action<int> OnActivePlayerChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public PlayerController CreatePlayer(int playerId, int spawnIndex = 0)
        {
            if (players.Count >= maxPlayers) return null;
            if (spawnPoints == null || spawnPoints.Length == 0) return null;

            int actualIndex = Mathf.Min(spawnIndex, spawnPoints.Length - 1);
            GameObject playerObj = Instantiate(playerPrefab, spawnPoints[actualIndex].position, spawnPoints[actualIndex].rotation);
            PlayerController controller = playerObj.GetComponent<PlayerController>();

            controller.Initialize(playerId, playerColors[playerId % playerColors.Length]);
            players.Add(controller);
            OnPlayerJoined?.Invoke(playerId);

            if (players.Count == 1)
            {
                activePlayerIndex = 0;
            }

            return controller;
        }

        public void RemovePlayer(int playerId)
        {
            PlayerController pc = players.Find(p => p.PlayerId == playerId);
            if (pc != null)
            {
                players.Remove(pc);
                Destroy(pc.gameObject);
                OnPlayerLeft?.Invoke(playerId);
            }
        }

        public PlayerController GetPlayer(int playerId)
        {
            return players.Find(p => p.PlayerId == playerId);
        }

        public PlayerController GetActivePlayer()
        {
            if (players.Count == 0) return null;
            return players[activePlayerIndex % players.Count];
        }

        public void SwitchActivePlayer(bool forward = true)
        {
            if (players.Count <= 1) return;

            activePlayerIndex = (activePlayerIndex + (forward ? 1 : -1) + players.Count) % players.Count;

            for (int i = 0; i < players.Count; i++)
            {
                players[i].SetControllable(i == activePlayerIndex);
            }

            OnActivePlayerChanged?.Invoke(activePlayerIndex);
        }

        public void SetActivePlayer(int index)
        {
            if (index < 0 || index >= players.Count) return;
            activePlayerIndex = index;

            for (int i = 0; i < players.Count; i++)
            {
                players[i].SetControllable(i == activePlayerIndex);
            }

            OnActivePlayerChanged?.Invoke(activePlayerIndex);
        }

        public void ClearAllPlayers()
        {
            foreach (var pc in players)
            {
                if (pc != null) Destroy(pc.gameObject);
            }
            players.Clear();
            activePlayerIndex = 0;
        }
    }
}
