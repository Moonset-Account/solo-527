using System;
using System.Collections.Generic;
using UnityEngine;
using KitchenChaos.Core;

namespace KitchenChaos.Input
{
    public class InputManager : Singleton<InputManager>
    {
        readonly Dictionary<int, IInputMapping> _playerInputs = new();
        readonly Dictionary<int, int> _playerIdToMappingIndex = new();
        readonly List<IInputMapping> _availableMappings = new();
        int _nextPlayerId = 1;

        public IReadOnlyDictionary<int, IInputMapping> PlayerInputs => _playerInputs;
        public IReadOnlyList<IInputMapping> AvailableMappings => _availableMappings;
        public int PlayerCount => _playerInputs.Count;

        protected override void OnAwake()
        {
            BuildDefaultMappings();
        }

        void BuildDefaultMappings()
        {
            _availableMappings.Clear();
            _availableMappings.Add(new KeyboardP1Mapping());
            _availableMappings.Add(new KeyboardP2Mapping());
            int joyCount = UnityEngine.Input.GetJoystickNames().Length;
            for (int i = 0; i < Mathf.Min(joyCount, 4); i++)
                _availableMappings.Add(new GamepadMapping(i));
        }

        void Update()
        {
            foreach (var map in _availableMappings)
                map.Tick();

            if (ServiceLocator.TryGet<GameManager>(out var gm) && gm.State == GameState.Playing)
            {
                if (_availableMappings.Count > 0 && _availableMappings[0].PausePressed)
                    gm.TogglePause();
            }
        }

        public IInputMapping GetInputFor(int playerId)
        {
            return _playerInputs.TryGetValue(playerId, out var map) ? map : null;
        }

        public int RegisterPlayer(int mappingIndex = -1)
        {
            IInputMapping map;
            if (mappingIndex >= 0 && mappingIndex < _availableMappings.Count)
                map = _availableMappings[mappingIndex];
            else
            {
                map = FindFirstUnusedMapping();
                if (map == null) return -1;
            }

            int id = _nextPlayerId++;
            _playerInputs[id] = map;
            _playerIdToMappingIndex[id] = _availableMappings.IndexOf(map);
            EventBus.Raise(new PlayerJoinedEvent { PlayerId = id, ControlScheme = map.Name });
            return id;
        }

        IInputMapping FindFirstUnusedMapping()
        {
            foreach (var m in _availableMappings)
                if (!_playerInputs.ContainsValue(m)) return m;
            return null;
        }

        public void UnregisterPlayer(int playerId)
        {
            if (_playerInputs.Remove(playerId))
            {
                _playerIdToMappingIndex.Remove(playerId);
                EventBus.Raise(new PlayerLeftEvent { PlayerId = playerId });
            }
        }

        public void ClearAllPlayers()
        {
            var ids = new List<int>(_playerInputs.Keys);
            foreach (var id in ids) UnregisterPlayer(id);
            _nextPlayerId = 1;
        }

        public bool IsMappingUsed(int index)
        {
            if (index < 0 || index >= _availableMappings.Count) return false;
            return _playerInputs.ContainsValue(_availableMappings[index]);
        }

        public IEnumerable<int> GetPlayerIds() => _playerInputs.Keys;
    }
}
