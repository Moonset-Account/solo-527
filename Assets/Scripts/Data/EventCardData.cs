using System.Collections.Generic;
using UnityEngine;

namespace SpaceCourier.Data
{
    [CreateAssetMenu(fileName = "EventCardData", menuName = "SpaceCourier/EventCard")]
    public class EventCardData : ScriptableObject
    {
        public int EventId;
        public string Title;
        public string Description;
        public EventCategory Category;
        public EventSeverity Severity;
        public Sprite EventImage;
        public Color CardColor = Color.white;
        public int Weight = 10;
        public List<EventTriggerCondition> TriggerConditions = new List<EventTriggerCondition>();
        public List<EventChoice> Choices = new List<EventChoice>();
        public bool AllowSkip;
        public bool GuaranteesRemediation = true;
    }

    [System.Serializable]
    public class EventTriggerCondition
    {
        public TriggerType Type;
        public int MinValue;
        public int MaxValue;
        public string StringValue;
        public NodeType NodeType;
        public NodeDangerLevel DangerLevel;
    }

    [System.Serializable]
    public class EventChoice
    {
        public int ChoiceId;
        public string Text;
        public ChoiceRequirement Requirement;
        public List<EventOutcome> Outcomes = new List<EventOutcome>();
        public bool IsRemediationChoice = false;
    }

    [System.Serializable]
    public class ChoiceRequirement
    {
        public int FuelCost;
        public int CreditCost;
        public int ReputationCost;
        public int MinReputation;
        public int MinFuel;
        public int MinTurnsRemaining;
        public string RequiredItem;
    }

    [System.Serializable]
    public class EventOutcome
    {
        public int Weight = 100;
        public string ResultText;
        public int FuelDelta;
        public int CreditsDelta;
        public int ReputationDelta;
        public int TurnDelta;
        public int CargoDamagePercent;
        public OutcomeType OutcomeType;
        public string UnlockId;
        public bool TriggersAnotherEvent;
        public int FollowUpEventId;
    }

    public enum EventCategory
    {
        SpaceWeather,
        Piracy,
        Mechanical,
        Trade,
        Discovery,
        NPCEncounter,
        Emergency,
        Government
    }

    public enum EventSeverity
    {
        Trivial,
        Minor,
        Moderate,
        Severe,
        Catastrophic
    }

    public enum TriggerType
    {
        Always,
        NodeType,
        DangerLevel,
        FuelRange,
        TurnRange,
        HasActiveContract,
        LowReputation,
        HighReputation,
        CargoType,
        PreviousChoice
    }

    public enum OutcomeType
    {
        Neutral,
        Positive,
        Negative,
        Critical
    }
}
