using System.Collections.Generic;
using UnityEngine;

namespace SpaceCourier.Data
{
    [CreateAssetMenu(fileName = "LevelData", menuName = "SpaceCourier/Level")]
    public class LevelData : ScriptableObject
    {
        public int LevelId;
        public string LevelName;
        public string Description;
        public Difficulty Difficulty;
        public int StartingFuel;
        public int MaxFuel;
        public int StartingCredits;
        public int StartingReputation;
        public int MaxTurns;
        public int TargetScore;
        public int StartNodeId;

        public List<StarNodeData> StarNodes = new List<StarNodeData>();
        public List<ContractData> AvailableContracts = new List<ContractData>();
        public List<EventCardData> EventCardsPool = new List<EventCardData>();

        public int MainContractId;
        public List<int> MandatoryContractIds = new List<int>();
        public List<int> OptionalContractIds = new List<int>();
    }

    public enum Difficulty
    {
        Tutorial,
        Easy,
        Normal,
        Hard,
        Expert
    }
}
