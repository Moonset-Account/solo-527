using System;
using System.Collections.Generic;
using UnityEngine;
using SpaceCourier.Core;
using SpaceCourier.Data;
using SpaceCourier.DataModule;

namespace SpaceCourier.Gameplay
{
    public class EventManager : MonoBehaviour, IModule
    {
        public ModuleType Type => ModuleType.EventManager;

        private DataManager dataManager;
        private TurnManager turnManager;
        private FuelManager fuelManager;
        private ReputationManager reputationManager;
        private GameplayController gameplayController;

        private EventCardData currentEvent;
        private List<EventOutcome> resolvedOutcomes = new List<EventOutcome>();
        private bool isEventActive = false;

        public bool IsEventActive => isEventActive;
        public EventCardData CurrentEvent => currentEvent;
        public IReadOnlyList<EventOutcome> ResolvedOutcomes => resolvedOutcomes;

        public event Action<EventCardData> OnEventTriggered;
        public event Action<int, EventOutcome> OnEventResolved;
        public event Action OnEventDismissed;

        [Header("Settings")]
        [Range(0f, 1f)]
        public float eventTriggerChancePerNode = 0.35f;

        public void Initialize()
        {
            dataManager = GameManager.Instance?.GetModule<DataManager>(ModuleType.DataManager);
            turnManager = GameManager.Instance?.GetModule<TurnManager>(ModuleType.TurnManager);
            fuelManager = GameManager.Instance?.GetModule<FuelManager>(ModuleType.FuelManager);
            reputationManager = GameManager.Instance?.GetModule<ReputationManager>(ModuleType.ReputationManager);

            Debug.Log("[EventManager] Initialized.");
        }

        public void SetGameplayController(GameplayController controller)
        {
            gameplayController = controller;
        }

        public EventTriggerResult TriggerEventForNode(int nodeId)
        {
            if (isEventActive) return null;

            var node = dataManager.GetNode(nodeId);
            if (node == null) return null;

            float triggerChance = GetTriggerChanceForDanger(node.DangerLevel);
            if (UnityEngine.Random.value > triggerChance) return null;

            var validEvents = FindValidEvents(node);
            if (validEvents == null || validEvents.Count == 0) return null;

            var selectedEvent = SelectEventByWeight(validEvents);
            if (selectedEvent == null) return null;

            return ActivateEvent(selectedEvent);
        }

        private float GetTriggerChanceForDanger(NodeDangerLevel danger)
        {
            switch (danger)
            {
                case NodeDangerLevel.Safe: return 0.10f;
                case NodeDangerLevel.Low: return 0.20f;
                case NodeDangerLevel.Medium: return eventTriggerChancePerNode;
                case NodeDangerLevel.High: return 0.50f;
                case NodeDangerLevel.Extreme: return 0.75f;
                default: return 0.25f;
            }
        }

        private List<EventCardData> FindValidEvents(StarNodeData node)
        {
            var runtimeData = dataManager.RuntimeData;
            var allEvents = dataManager.CurrentLevel?.EventCardsPool;
            if (allEvents == null) return null;

            var valid = new List<EventCardData>();
            foreach (var evt in allEvents)
            {
                if (evt == null) continue;
                bool allConditionsMet = true;
                foreach (var condition in evt.TriggerConditions)
                {
                    if (!CheckCondition(condition, node, runtimeData))
                    {
                        allConditionsMet = false;
                        break;
                    }
                }
                if (allConditionsMet) valid.Add(evt);
            }
            return valid;
        }

        private bool CheckCondition(EventTriggerCondition condition, StarNodeData node, GameRuntimeData runtime)
        {
            switch (condition.Type)
            {
                case TriggerType.Always: return true;
                case TriggerType.NodeType: return node.Type == condition.NodeType;
                case TriggerType.DangerLevel:
                    int dangerVal = (int)node.DangerLevel;
                    return dangerVal >= condition.MinValue && dangerVal <= condition.MaxValue;
                case TriggerType.FuelRange:
                    return runtime.Ship.CurrentFuel >= condition.MinValue &&
                           runtime.Ship.CurrentFuel <= condition.MaxValue;
                case TriggerType.TurnRange:
                    return turnManager.CurrentTurn >= condition.MinValue &&
                           turnManager.CurrentTurn <= condition.MaxValue;
                case TriggerType.HasActiveContract:
                    return runtime.ActiveContracts.Count > 0;
                case TriggerType.LowReputation:
                    return reputationManager.CurrentReputation < 30;
                case TriggerType.HighReputation:
                    return reputationManager.CurrentReputation > 70;
                default: return true;
            }
        }

        private EventCardData SelectEventByWeight(List<EventCardData> events)
        {
            int totalWeight = 0;
            foreach (var evt in events) totalWeight += evt.Weight;
            int roll = UnityEngine.Random.Range(0, totalWeight);
            int cumulative = 0;
            foreach (var evt in events)
            {
                cumulative += evt.Weight;
                if (roll < cumulative) return evt;
            }
            return events[events.Count - 1];
        }

        public EventTriggerResult ActivateEvent(EventCardData eventData)
        {
            if (eventData == null) return null;

            currentEvent = eventData;
            isEventActive = true;
            resolvedOutcomes.Clear();

            var runtime = dataManager.RuntimeData;
            runtime.EventHistory.Add($"[{turnManager.CurrentTurn}] 触发事件: {eventData.Title}");

            EventBus.Publish(new GameEvents.EventCardDrawn
            {
                EventId = eventData.EventId,
                Title = eventData.Title
            });

            OnEventTriggered?.Invoke(eventData);
            Debug.Log($"[EventManager] Event triggered: {eventData.Title}");

            return new EventTriggerResult
            {
                Event = eventData,
                BlocksProgress = true,
                RemediationAvailable = eventData.GuaranteesRemediation
            };
        }

        public List<EventChoice> GetAvailableChoices()
        {
            if (currentEvent == null) return new List<EventChoice>();

            var available = new List<EventChoice>();
            var runtime = dataManager.RuntimeData;

            foreach (var choice in currentEvent.Choices)
            {
                if (IsChoiceAvailable(choice, runtime))
                {
                    available.Add(choice);
                }
            }

            var hasRemediation = available.Exists(c => c.IsRemediationChoice);

            if (!hasRemediation && currentEvent.GuaranteesRemediation)
            {
                var fallback = CreateFallbackRemediation();
                if (fallback != null) available.Add(fallback);
            }

            if (available.Count == 0)
            {
                available.Add(GetDefaultHardshipChoice());
            }

            return available;
        }

        private EventChoice CreateFallbackRemediation()
        {
            var runtime = dataManager.RuntimeData;
            int fuelNeeded = Mathf.Min(10, Mathf.Max(3, runtime.Ship.CurrentFuel - 5));

            if (runtime.Ship.CurrentFuel >= 15)
            {
                return new EventChoice
                {
                    ChoiceId = 998,
                    Text = $"额外消耗 {fuelNeeded} 燃料紧急规避",
                    Requirement = new ChoiceRequirement { FuelCost = fuelNeeded, MinFuel = fuelNeeded },
                    Outcomes = { new EventOutcome
                    {
                        Weight = 100,
                        OutcomeType = OutcomeType.Neutral,
                        ResultText = "额外的燃料让你安全度过了危机。",
                        FuelDelta = -fuelNeeded
                    }},
                    IsRemediationChoice = true
                };
            }

            if (runtime.Player.Credits >= 200)
            {
                return new EventChoice
                {
                    ChoiceId = 997,
                    Text = "花费 200 星币寻求当地帮助",
                    Requirement = new ChoiceRequirement { CreditCost = 200 },
                    Outcomes = { new EventOutcome
                    {
                        Weight = 100,
                        OutcomeType = OutcomeType.Neutral,
                        ResultText = "当地人帮你搞定了问题。",
                        CreditsDelta = -200
                    }},
                    IsRemediationChoice = true
                };
            }

            return null;
        }

        private EventChoice GetDefaultHardshipChoice()
        {
            return new EventChoice
            {
                ChoiceId = 999,
                Text = "资源不足，只能硬扛...",
                Requirement = new ChoiceRequirement(),
                Outcomes = { new EventOutcome
                {
                    Weight = 100,
                    OutcomeType = OutcomeType.Negative,
                    ResultText = "你勉强维持，但情况变得更糟了。",
                    CargoDamagePercent = 15
                }},
                IsRemediationChoice = true
            };
        }

        public bool IsChoiceAvailable(EventChoice choice, GameRuntimeData runtime)
        {
            if (choice == null) return false;
            if (choice.Requirement == null) return true;

            var req = choice.Requirement;

            if (req.FuelCost > 0 && fuelManager.CurrentFuel < req.FuelCost) return false;
            if (req.MinFuel > 0 && fuelManager.CurrentFuel < req.MinFuel) return false;
            if (req.CreditCost > 0 && runtime.Player.Credits < req.CreditCost) return false;
            if (req.ReputationCost > 0 && reputationManager.CurrentReputation < req.ReputationCost) return false;
            if (req.MinReputation > 0 && reputationManager.CurrentReputation < req.MinReputation) return false;
            if (req.MinTurnsRemaining > 0 && turnManager.TurnsRemaining < req.MinTurnsRemaining) return false;
            if (!string.IsNullOrEmpty(req.RequiredItem) && !runtime.Player.InventoryItems.Contains(req.RequiredItem)) return false;

            return true;
        }

        public EventResolveResult ResolveChoice(int choiceId)
        {
            if (!isEventActive || currentEvent == null)
            {
                return new EventResolveResult { Success = false, Message = "没有激活的事件" };
            }

            var choice = currentEvent.Choices.Find(c => c.ChoiceId == choiceId);
            if (choice == null)
            {
                if (choiceId == 999) choice = GetDefaultHardshipChoice();
                else if (choiceId == 998 || choiceId == 997) choice = CreateFallbackRemediation() ?? GetDefaultHardshipChoice();
                else return new EventResolveResult { Success = false, Message = "未找到选项" };
            }

            if (!IsChoiceAvailable(choice, dataManager.RuntimeData))
            {
                return new EventResolveResult { Success = false, Message = "资源不满足该选项" };
            }

            gameplayController?.RecordCriticalChoice(
                $"事件选择_{currentEvent.Title}",
                choice.Text,
                "");

            ApplyChoiceRequirements(choice);

            var outcome = SelectOutcomeByWeight(choice.Outcomes);
            resolvedOutcomes.Add(outcome);

            ApplyOutcomeEffects(outcome);

            var runtime = dataManager.RuntimeData;
            runtime.EventHistory.Add($"[{turnManager.CurrentTurn}] 事件结果: {currentEvent.Title} - {outcome.ResultText}");

            EventBus.Publish(new GameEvents.EventResolved
            {
                EventId = currentEvent.EventId,
                ChoiceId = choiceId,
                Outcome = outcome.ResultText
            });

            OnEventResolved?.Invoke(choiceId, outcome);
            Debug.Log($"[EventManager] Event resolved: {outcome.ResultText}");

            var result = new EventResolveResult
            {
                Success = true,
                Choice = choice,
                Outcome = outcome,
                Message = outcome.ResultText
            };

            if (outcome.TriggersAnotherEvent && outcome.FollowUpEventId > 0)
            {
                result.FollowUpEventId = outcome.FollowUpEventId;
            }

            return result;
        }

        private void ApplyChoiceRequirements(EventChoice choice)
        {
            if (choice.Requirement == null) return;

            var runtime = dataManager.RuntimeData;
            var req = choice.Requirement;

            if (req.FuelCost > 0)
            {
                fuelManager.ConsumeFuel(req.FuelCost, $"事件消耗: {currentEvent?.Title}");
            }

            if (req.CreditCost > 0)
            {
                runtime.Player.Credits -= req.CreditCost;
                Debug.Log($"[EventManager] Paid {req.CreditCost} credits for event choice");
            }

            if (req.ReputationCost > 0)
            {
                reputationManager.ChangeReputation(-req.ReputationCost, $"事件代价: {currentEvent?.Title}");
            }

            if (!string.IsNullOrEmpty(req.RequiredItem))
            {
                runtime.Player.InventoryItems.Remove(req.RequiredItem);
            }

            dataManager.NotifyDataChanged();
        }

        private EventOutcome SelectOutcomeByWeight(List<EventOutcome> outcomes)
        {
            if (outcomes == null || outcomes.Count == 0)
            {
                return new EventOutcome { ResultText = "什么都没发生。" };
            }

            if (outcomes.Count == 1) return outcomes[0];

            int total = 0;
            foreach (var o in outcomes) total += o.Weight;

            int roll = UnityEngine.Random.Range(0, total);
            int cumulative = 0;

            foreach (var o in outcomes)
            {
                cumulative += o.Weight;
                if (roll < cumulative) return o;
            }

            return outcomes[outcomes.Count - 1];
        }

        private void ApplyOutcomeEffects(EventOutcome outcome)
        {
            if (outcome == null) return;

            var runtime = dataManager.RuntimeData;

            if (outcome.FuelDelta != 0)
            {
                if (outcome.FuelDelta > 0)
                {
                    fuelManager.AddFuel(outcome.FuelDelta, $"事件奖励: {currentEvent?.Title}");
                }
                else
                {
                    fuelManager.ConsumeFuel(-outcome.FuelDelta, $"事件惩罚: {currentEvent?.Title}");
                }
            }

            if (outcome.CreditsDelta != 0)
            {
                runtime.Player.Credits = Mathf.Max(0, runtime.Player.Credits + outcome.CreditsDelta);
                Debug.Log($"[EventManager] Credits {outcome.CreditsDelta:+#;-#} from event outcome");
            }

            if (outcome.ReputationDelta != 0)
            {
                reputationManager.ChangeReputation(outcome.ReputationDelta, $"事件结果: {currentEvent?.Title}");
            }

            if (outcome.TurnDelta != 0)
            {
                turnManager.ApplyTurnDelta(outcome.TurnDelta, $"事件: {currentEvent?.Title}");
            }

            if (outcome.CargoDamagePercent > 0)
            {
                turnManager.DamageCargo(outcome.CargoDamagePercent);
            }

            if (!string.IsNullOrEmpty(outcome.UnlockId))
            {
                if (!runtime.Player.UnlockedUpgrades.Contains(outcome.UnlockId))
                {
                    runtime.Player.UnlockedUpgrades.Add(outcome.UnlockId);
                }
            }

            dataManager.NotifyDataChanged();
        }

        public void DismissEvent()
        {
            currentEvent = null;
            resolvedOutcomes.Clear();
            isEventActive = false;
            OnEventDismissed?.Invoke();
        }

        public int ForceTriggerEvent(int eventId)
        {
            var evt = dataManager.GetEvent(eventId);
            if (evt == null) return -1;
            ActivateEvent(evt);
            return eventId;
        }

        public void Shutdown()
        {
            currentEvent = null;
            resolvedOutcomes.Clear();
            isEventActive = false;
            Debug.Log("[EventManager] Shutdown.");
        }
    }

    public class EventTriggerResult
    {
        public EventCardData Event;
        public bool BlocksProgress;
        public bool RemediationAvailable;
    }

    public class EventResolveResult
    {
        public bool Success;
        public EventChoice Choice;
        public EventOutcome Outcome;
        public string Message;
        public int FollowUpEventId;
    }
}
