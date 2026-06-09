using System;
using System.Collections.Generic;
using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Core.Abstractions;
using KitchenChaos.Input;
using KitchenChaos.Config;
using KitchenChaos.Ingredients;

namespace KitchenChaos.Players
{
    public class PlayerManager : MonoBehaviour
    {
        [SerializeField] GameObject _playerPrefab;
        [SerializeField] Transform _container;

        readonly Dictionary<int, PlayerController> _players = new();
        int _singleActiveSlot;
        readonly List<int> _singleSlots = new();
        readonly List<int> _singleSlotRealIds = new();

        public IReadOnlyDictionary<int, PlayerController> Players => _players;
        public int ActiveCount => _players.Count;
        public IEnumerable<PlayerController> All => _players.Values;
        public IEnumerable<PlayerController> AllPlayers => _players.Values;
        public static PlayerManager Instance { get; private set; }

        void Awake()
        {
            Instance = this;
            ServiceLocator.Register(this);
        }

        public void SpawnPlayersForLevel(LevelConfig level, bool singleMode)
        {
            DespawnAll();
            var input = ServiceLocator.Get<InputManager>();
            input.ClearAllPlayers();
            _singleSlots.Clear();
            _singleSlotRealIds.Clear();
            _singleActiveSlot = 0;

            int count = singleMode ? Mathf.Min(2, level.MaxPlayersInLevel) : level.MaxPlayersInLevel;
            var spawns = level.PlayerSpawnPoints ?? DefaultSpawns(count);

            if (singleMode)
            {
                int real0 = input.RegisterPlayer(0);
                CreateController(real0, spawns[0], 0);
                _singleSlots.Add(real0);
                _singleSlotRealIds.Add(real0);
                for (int i = 1; i < count; i++)
                {
                    int fake = -i - 1;
                    _singleSlots.Add(fake);
                    _singleSlotRealIds.Add(real0);
                    CreateController(fake, spawns[i % spawns.Length], i);
                    _players[fake].ReleaseInput();
                }
            }
            else
            {
                for (int i = 0; i < count; i++)
                {
                    int id = input.RegisterPlayer(i);
                    if (id > 0) CreateController(id, spawns[i % spawns.Length], i);
                }
            }
        }

        static Vector3[] DefaultSpawns(int count)
        {
            var arr = new Vector3[count];
            for (int i = 0; i < count; i++)
                arr[i] = new Vector3((i - count * 0.5f + 0.5f) * 2f, 0, 0);
            return arr;
        }

        PlayerController CreateController(int id, Vector3 pos, int index)
        {
            GameObject go;
            if (_playerPrefab != null)
            {
                go = Instantiate(_playerPrefab, pos, Quaternion.identity);
            }
            else
            {
                go = new GameObject($"Player_{id}");
                go.transform.position = pos;
                go.transform.localScale = Vector3.one * 0.9f;
                go.layer = 0;
                var col = go.AddComponent<CircleCollider2D>();
                col.radius = 0.38f;
                col.isTrigger = false;
                var rb = go.AddComponent<Rigidbody2D>();
                rb.freezeRotation = true;
                rb.gravityScale = 0;
                rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
                var sr = go.AddComponent<SpriteRenderer>();
                sr.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 64, 96), new Vector2(0.5f, 0.5f), 64);
                sr.sortingOrder = 10;
                var carry = new GameObject("Carry");
                carry.transform.SetParent(go.transform, false);
                carry.transform.localPosition = new Vector3(0, 0.6f, 0);
            }
            if (_container != null) go.transform.SetParent(_container, false);
            var pc = go.GetComponent<PlayerController>() ?? go.AddComponent<PlayerController>();

            var colors = new[] { Color.red, Color.cyan, Color.yellow, Color.magenta };
            var srBody = go.GetComponent<SpriteRenderer>();
            if (srBody != null) srBody.color = colors[index % colors.Length];

            var cfg = ServiceLocator.Get<GameConfig>();
            pc.BindInput(id, cfg?.PlayerMoveSpeed ?? 4f, cfg?.PlayerInteractionRange ?? 1.5f);
            if (id <= 0) pc.ReleaseInput();
            _players[id] = pc;
            return pc;
        }

        void DespawnAll()
        {
            foreach (var kv in _players) if (kv.Value) Destroy(kv.Value.gameObject);
            _players.Clear();
        }

        void Update()
        {
            var gm = ServiceLocator.Get<Core.GameManager>();
            if (gm == null || gm.State != GameState.Playing) return;

            var inputMgr = ServiceLocator.Get<InputManager>();

            foreach (var kv in _players)
            {
                var pid = kv.Key;
                var pc = kv.Value;
                if (pc == null) continue;
                int effectiveId = pid;
                if (pid <= 0)
                {
                    int slotIdx = _singleSlots.IndexOf(pid);
                    if (slotIdx == _singleActiveSlot && _singleSlotRealIds.Count > slotIdx)
                        effectiveId = _singleSlotRealIds[slotIdx];
                    else continue;
                }
                var map = inputMgr.GetInputFor(effectiveId);
                if (map == null) continue;
                pc.ConsumeInputFrame(ref map);
            }

            if (gm.IsSinglePlayerMode && inputMgr.AvailableMappings.Count > 0)
            {
                var map0 = inputMgr.GetInputFor(_singleSlotRealIds.Count > 0 ? _singleSlotRealIds[0] : 1);
                if (map0 != null && map0.SwitchCharPressed && _singleSlots.Count > 1)
                    SwitchSingle();
            }
        }

        void LateUpdate()
        {
            var gm = ServiceLocator.Get<Core.GameManager>();
            if (gm == null || gm.State != GameState.Playing) return;
            foreach (var pc in _players.Values) pc?.LateTickInput();
        }

        public void SwitchSingle()
        {
            if (_singleSlots.Count < 2) return;
            _singleActiveSlot = (_singleActiveSlot + 1) % _singleSlots.Count;
            int newId = _singleSlots[_singleActiveSlot] > 0
                ? _singleSlots[_singleActiveSlot]
                : _singleSlotRealIds[_singleActiveSlot];
            EventBus.Raise(new PlayerSwitchedEvent { NewPlayerId = Mathf.Abs(newId) });
        }

        public void SwitchSinglePlayerCharacter() => SwitchSingle();

        public PlayerController Get(int id) => _players.TryGetValue(id, out var pc) ? pc : null;
    }
}
