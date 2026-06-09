using System;
using System.Collections.Generic;
using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Input;
using KitchenChaos.Config;

namespace KitchenChaos.Players
{
    public class PlayerManager : Singleton<PlayerManager>
    {
        [SerializeField] GameObject _playerPrefab;
        [SerializeField] Transform _playerContainer;

        readonly Dictionary<int, PlayerController> _players = new();
        int _singlePlayerActiveSlot = 0;
        readonly List<int> _singlePlayerSlots = new();

        public IReadOnlyDictionary<int, PlayerController> Players => _players;
        public int ActiveCount => _players.Count;

        protected override void OnAwake()
        {
            ServiceLocator.Register(this);
            EventBus.Subscribe<PlayerJoinedEvent>(OnPlayerJoined);
            EventBus.Subscribe<PlayerLeftEvent>(OnPlayerLeft);
        }

        void OnDestroy()
        {
            EventBus.Unsubscribe<PlayerJoinedEvent>(OnPlayerJoined);
            EventBus.Unsubscribe<PlayerLeftEvent>(OnPlayerLeft);
        }

        public void SpawnPlayersForLevel(LevelConfig level, bool singlePlayerMode)
        {
            DespawnAll();
            var inputMgr = ServiceLocator.Get<InputManager>();
            inputMgr.ClearAllPlayers();
            _singlePlayerSlots.Clear();
            _singlePlayerActiveSlot = 0;

            int spawnCount = singlePlayerMode ? Mathf.Min(2, level.MaxPlayersInLevel) : level.MaxPlayersInLevel;
            var spawns = level.PlayerSpawnPoints ?? GetDefaultSpawns(spawnCount);

            if (singlePlayerMode)
            {
                int slot0 = inputMgr.RegisterPlayer(0);
                CreateController(slot0, spawns[0], 0);
                _singlePlayerSlots.Add(slot0);

                for (int i = 1; i < spawnCount; i++)
                {
                    int slotId = -i - 1;
                    CreateController(slotId, spawns[i], i);
                    _players[slotId].ReleaseInput();
                    _singlePlayerSlots.Add(slotId);
                }
            }
            else
            {
                for (int i = 0; i < spawnCount; i++)
                {
                    int pid = inputMgr.RegisterPlayer(i);
                    if (pid > 0) CreateController(pid, spawns[i % spawns.Length], i);
                }
            }
        }

        Vector3[] GetDefaultSpawns(int count)
        {
            var arr = new Vector3[count];
            for (int i = 0; i < count; i++)
                arr[i] = new Vector3((i - count * 0.5f + 0.5f) * 2f, 0, 0);
            return arr;
        }

        PlayerController CreateController(int playerId, Vector3 pos, int index)
        {
            var go = _playerPrefab == null ? new GameObject($"Player_{playerId}") : Instantiate(_playerPrefab, pos, Quaternion.identity);
            go.transform.SetParent(_playerContainer ? _playerContainer : transform, false);
            go.transform.position = pos;

            var pc = go.GetComponent<PlayerController>() ?? go.AddComponent<PlayerController>();
            pc.BindInput(playerId);
            var sr = go.GetComponent<SpriteRenderer>();
            if (sr == null)
            {
                sr = go.AddComponent<SpriteRenderer>();
                sr.sortingOrder = 10;
            }
            if (go.GetComponent<Collider2D>() == null) go.AddComponent<CircleCollider2D>().isTrigger = false;
            if (go.GetComponent<Rigidbody2D>() == null)
            {
                var rb = go.AddComponent<Rigidbody2D>();
                rb.freezeRotation = true;
                rb.gravityScale = 0;
                rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            }

            _players[playerId] = pc;
            return pc;
        }

        void DespawnAll()
        {
            foreach (var kv in _players)
                if (kv.Value != null) Destroy(kv.Value.gameObject);
            _players.Clear();
        }

        void OnPlayerJoined(PlayerJoinedEvent e) { }

        void OnPlayerLeft(PlayerLeftEvent e)
        {
            if (_players.TryGetValue(e.PlayerId, out var pc))
            {
                Destroy(pc.gameObject);
                _players.Remove(e.PlayerId);
            }
        }

        void Update()
        {
            var gm = ServiceLocator.Get<GameManager>();
            if (gm == null || gm.State != GameState.Playing) return;

            var inputMgr = ServiceLocator.Get<InputManager>();
            var singleMode = gm.IsSinglePlayerMode;

            foreach (var kv in _players)
            {
                var pid = kv.Key;
                var pc = kv.Value;
                var input = inputMgr.GetInputFor(pid);
                if (input == null) continue;

                pc.SetMoveInput(input.Move);
                if (input.InteractPressed) pc.TryInteract();
                if (input.SecondaryPressed) pc.TrySecondaryInteract();
                if (input.DropPressed) pc.TryDrop();

                if (singleMode && input.SwitchCharPressed && _singlePlayerSlots.Count > 1)
                    SwitchSinglePlayerCharacter();
            }
        }

        public void SwitchSinglePlayerCharacter()
        {
            if (_singlePlayerSlots.Count < 2) return;
            int currentSlot = _singlePlayerSlots[_singlePlayerActiveSlot];
            _players[currentSlot]?.ReleaseInput();

            _singlePlayerActiveSlot = (_singlePlayerActiveSlot + 1) % _singlePlayerSlots.Count;
            int nextSlot = _singlePlayerSlots[_singlePlayerActiveSlot];
            if (nextSlot <= 0)
            {
                int realInputId = _singlePlayerSlots[0];
                _players[nextSlot]?.BindInput(realInputId);
                _players.Remove(realInputId);
                _players[realInputId] = _players[nextSlot];
                _players.Remove(nextSlot);
                _singlePlayerSlots[_singlePlayerActiveSlot] = realInputId;
            }
            else
            {
                _players[nextSlot]?.BindInput(nextSlot);
            }
            EventBus.Raise(new PlayerSwitchedEvent { NewPlayerId = nextSlot > 0 ? nextSlot : _singlePlayerSlots[0] });
        }

        public PlayerController GetPlayer(int id)
        {
            return _players.TryGetValue(id, out var pc) ? pc : null;
        }

        public IEnumerable<PlayerController> AllPlayers => _players.Values;
    }
}
