using UnityEngine;
using System;
using System.Collections.Generic;

namespace InkMountainBridge
{
    [Serializable]
    public class UITextEntry
    {
        public string key;
        public string value;
    }

    [CreateAssetMenu(fileName = "UITextConfig", menuName = "InkMountainBridge/UI Text Config")]
    public class UITextConfig : ScriptableObject
    {
        public List<UITextEntry> entries = new List<UITextEntry>();

        [NonSerialized] private Dictionary<string, string> _lookup;

        public string GetText(string key)
        {
            if (_lookup == null) BuildLookup();
            return _lookup.TryGetValue(key, out var val) ? val : key;
        }

        private void BuildLookup()
        {
            _lookup = new Dictionary<string, string>();
            foreach (var entry in entries)
                _lookup[entry.key] = entry.value;
        }
    }
}
