using System;
using System.Collections.Generic;
using UnityEngine;

namespace YouthTrainingManagement.Models
{
    [Serializable]
    public class InputBinding
    {
        public string ActionId;
        public string DisplayName;
        public KeyCode PrimaryKey;
        public KeyCode SecondaryKey;
        public bool CanBeRemapped;
        public string Category;
    }

    [Serializable]
    public class InputBindings
    {
        public List<InputBinding> Bindings = new List<InputBinding>();
    }

    [Serializable]
    public struct KeyBinding
    {
        public KeyCode PrimaryKey;
        public KeyCode SecondaryKey;
    }
}
