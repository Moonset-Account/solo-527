using System;
using System.Collections.Generic;
using System.Linq;
using PuppetTheater.Data;
using UnityEngine;

namespace PuppetTheater.Story
{
    [Serializable]
    public class StoryNode
    {
        public string nodeId;
        public string displayName;
        public string description;
        public LightColor requiredLightChoice;
        public PuppetActionType requiredAction;
        public StoryBranch branch;
        public List<string> nextNodeIds = new List<string>();
        public AudienceEmotion minEmotionToUnlock;
        public bool isCheckpoint;
    }

    [CreateAssetMenu(fileName = "StoryScriptData", menuName = "PuppetTheater/StoryScriptData")]
    public class StoryScriptData : ScriptableObject
    {
        public List<StoryNode> nodes = new List<StoryNode>();
        public string startNodeId;
    }

    public class StoryNodeSystem : MonoBehaviour
    {
        private StoryNode _currentNode;
        private readonly List<StoryNode> _visitedNodes = new List<StoryNode>();
        private readonly List<(LightColor light, PuppetActionType action, string nodeId)> _choiceHistory
            = new List<(LightColor, PuppetActionType, string)>();
        private readonly Dictionary<string, StoryNode> _nodeMap = new Dictionary<string, StoryNode>();
        private readonly HashSet<string> _reachedCheckpoints = new HashSet<string>();

        private AudienceEmotion _audienceEmotion = AudienceEmotion.Neutral;
        private int _audienceEmotionValue = 2;

        public event Action<StoryNode, StoryNode> OnNodeChanged;
        public event Action<StoryBranch> OnBranchDetermined;
        public event Action<AudienceEmotion, AudienceEmotion> OnAudienceEmotionChanged;

        public AudienceEmotion CurrentAudienceEmotion => _audienceEmotion;

        public void LoadStoryScript(StoryScriptData script)
        {
            _nodeMap.Clear();
            _visitedNodes.Clear();
            _choiceHistory.Clear();
            _reachedCheckpoints.Clear();
            _audienceEmotion = AudienceEmotion.Neutral;
            _audienceEmotionValue = 2;
            _currentNode = null;

            foreach (var node in script.nodes)
            {
                _nodeMap[node.nodeId] = node;
            }

            if (!string.IsNullOrEmpty(script.startNodeId) && _nodeMap.ContainsKey(script.startNodeId))
            {
                AdvanceToNode(script.startNodeId);
            }
        }

        public StoryNode GetCurrentNode()
        {
            return _currentNode;
        }

        public void AdvanceToNode(string nodeId)
        {
            if (!_nodeMap.TryGetValue(nodeId, out var targetNode))
                return;

            if (_audienceEmotionValue > (int)targetNode.minEmotionToUnlock)
                return;

            var previousNode = _currentNode;
            _currentNode = targetNode;
            _visitedNodes.Add(_currentNode);

            if (_currentNode.isCheckpoint)
                _reachedCheckpoints.Add(_currentNode.nodeId);

            OnNodeChanged?.Invoke(previousNode, _currentNode);
        }

        public void RecordChoice(LightColor chosenLight, PuppetActionType action)
        {
            if (_currentNode == null)
                return;

            _choiceHistory.Add((chosenLight, action, _currentNode.nodeId));

            bool lightMatch = chosenLight == _currentNode.requiredLightChoice;
            bool actionMatch = action == _currentNode.requiredAction;

            if (lightMatch && actionMatch && _currentNode.nextNodeIds != null && _currentNode.nextNodeIds.Count > 0)
            {
                AdvanceToNode(_currentNode.nextNodeIds[0]);
            }
            else if (_currentNode.nextNodeIds != null && _currentNode.nextNodeIds.Count > 1)
            {
                AdvanceToNode(_currentNode.nextNodeIds[1]);
            }
        }

        public StoryBranch EvaluateBranch()
        {
            if (_choiceHistory.Count == 0)
                return StoryBranch.Default;

            var branchCounts = new Dictionary<StoryBranch, int>();
            foreach (var branch in Enum.GetValues(typeof(StoryBranch)).Cast<StoryBranch>())
            {
                branchCounts[branch] = 0;
            }

            foreach (var node in _visitedNodes)
            {
                branchCounts[node.branch]++;
            }

            StoryBranch dominant = StoryBranch.Default;
            int maxCount = 0;
            foreach (var kvp in branchCounts)
            {
                if (kvp.Key == StoryBranch.Default)
                    continue;
                if (kvp.Value > maxCount)
                {
                    maxCount = kvp.Value;
                    dominant = kvp.Key;
                }
            }

            if (maxCount == 0)
                dominant = StoryBranch.Default;

            OnBranchDetermined?.Invoke(dominant);
            return dominant;
        }

        public void UpdateAudienceEmotion(JudgmentGrade grade)
        {
            int delta = grade switch
            {
                JudgmentGrade.Perfect => -2,
                JudgmentGrade.Great => -1,
                JudgmentGrade.Good => 0,
                JudgmentGrade.Early => 1,
                JudgmentGrade.Late => 1,
                JudgmentGrade.Miss => 2,
                _ => 0
            };

            int previousValue = _audienceEmotionValue;
            _audienceEmotionValue = Mathf.Clamp(_audienceEmotionValue + delta, 0, 4);

            if (_audienceEmotionValue != previousValue)
            {
                var previousEmotion = _audienceEmotion;
                _audienceEmotion = (AudienceEmotion)_audienceEmotionValue;
                OnAudienceEmotionChanged?.Invoke(previousEmotion, _audienceEmotion);
            }
        }

        public int GetAudienceEmotionValue()
        {
            return _audienceEmotionValue;
        }

        public IReadOnlyList<(LightColor light, PuppetActionType action, string nodeId)> GetChoiceHistory()
        {
            return _choiceHistory.AsReadOnly();
        }

        public bool IsCheckpointReached(string checkpointId)
        {
            return _reachedCheckpoints.Contains(checkpointId);
        }
    }
}
