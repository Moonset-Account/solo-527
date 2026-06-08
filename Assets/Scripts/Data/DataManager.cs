using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using SpaceCourier.Core;

namespace SpaceCourier.DataModule
{
    public class DataManager : MonoBehaviour, IModule
    {
        public ModuleType Type => ModuleType.DataManager;

        [Header("Data Configuration")]
        public List<LevelData> AllLevels = new List<LevelData>();

        private Dictionary<int, LevelData> levelLookup = new Dictionary<int, LevelData>();
        private Dictionary<int, StarNodeData> currentNodeLookup = new Dictionary<int, StarNodeData>();
        private Dictionary<int, ContractData> currentContractLookup = new Dictionary<int, ContractData>();
        private Dictionary<int, EventCardData> currentEventLookup = new Dictionary<int, EventCardData>();

        private LevelData currentLevel;
        private GameRuntimeData runtimeData;

        public LevelData CurrentLevel => currentLevel;
        public GameRuntimeData RuntimeData => runtimeData;
        public IReadOnlyDictionary<int, StarNodeData> NodeLookup => currentNodeLookup;
        public IReadOnlyDictionary<int, ContractData> ContractLookup => currentContractLookup;
        public IReadOnlyDictionary<int, EventCardData> EventLookup => currentEventLookup;

        public event Action<bool> OnDataLoaded;
        public event Action OnRuntimeDataChanged;

        public void Initialize()
        {
            LoadAllLevelData();
            runtimeData = new GameRuntimeData();
            Debug.Log("[DataManager] Initialized.");
        }

        private void LoadAllLevelData()
        {
            if (AllLevels == null || AllLevels.Count == 0)
            {
                Debug.LogWarning("[DataManager] No levels configured. Creating default level data.");
                CreateDefaultLevelData();
            }

            foreach (var level in AllLevels)
            {
                if (!levelLookup.ContainsKey(level.LevelId))
                {
                    levelLookup[level.LevelId] = level;
                }
            }

            OnDataLoaded?.Invoke(levelLookup.Count > 0);
            EventBus.Publish(new GameEvents.DataLoaded { Success = levelLookup.Count > 0 });
        }

        private void CreateDefaultLevelData()
        {
            var defaultLevel = ScriptableObject.CreateInstance<LevelData>();
            defaultLevel.LevelId = 1;
            defaultLevel.LevelName = "The Trade Corridor";
            defaultLevel.Description = "Tutorial level - Navigate the safe trade corridor between major stations.";
            defaultLevel.Difficulty = Difficulty.Tutorial;
            defaultLevel.StartingFuel = 50;
            defaultLevel.MaxFuel = 100;
            defaultLevel.StartingCredits = 500;
            defaultLevel.StartingReputation = 50;
            defaultLevel.MaxTurns = 30;
            defaultLevel.TargetScore = 2000;
            defaultLevel.StartNodeId = 1;
            defaultLevel.MainContractId = 101;

            defaultLevel.StarNodes = CreateDefaultNodes();
            defaultLevel.AvailableContracts = CreateDefaultContracts();
            defaultLevel.EventCardsPool = CreateDefaultEvents();

            AllLevels.Add(defaultLevel);
            levelLookup[1] = defaultLevel;
        }

        private List<StarNodeData> CreateDefaultNodes()
        {
            var nodes = new List<StarNodeData>();

            nodes.Add(CreateNode(1, "Alpha Station", "Central trading hub", NodeType.Station,
                NodeDangerLevel.Safe, new Vector2(0, 0), true, new List<int> { 2, 3 }, 2));

            nodes.Add(CreateNode(2, "Beta Outpost", "Border outpost", NodeType.Outpost,
                NodeDangerLevel.Low, new Vector2(200, 150), true, new List<int> { 1, 4, 5 }, 3));

            nodes.Add(CreateNode(3, "Gamma Asteroid", "Mining asteroid field", NodeType.Asteroid,
                NodeDangerLevel.Medium, new Vector2(-180, -100), false, new List<int> { 1, 6 }, 4));

            nodes.Add(CreateNode(4, "Delta Planet", "Agricultural world", NodeType.Planet,
                NodeDangerLevel.Low, new Vector2(400, 50), true, new List<int> { 2, 7 }, 2));

            nodes.Add(CreateNode(5, "Wormhole Alpha", "Unstable wormhole", NodeType.Wormhole,
                NodeDangerLevel.High, new Vector2(350, -150), false, new List<int> { 2, 6, 8 }, 6));

            nodes.Add(CreateNode(6, "Epsilon Derelict", "Abandoned research ship", NodeType.Derelict,
                NodeDangerLevel.Medium, new Vector2(100, -200), false, new List<int> { 3, 5, 9 }, 3));

            nodes.Add(CreateNode(7, "Zeta Station", "Advanced research hub", NodeType.Station,
                NodeDangerLevel.Safe, new Vector2(600, 100), true, new List<int> { 4, 8, 10 }, 3));

            nodes.Add(CreateNode(8, "Eta Colony", "New colony world", NodeType.Planet,
                NodeDangerLevel.Medium, new Vector2(550, -100), true, new List<int> { 5, 7, 9 }, 4));

            nodes.Add(CreateNode(9, "Theta Outpost", "Remote waystation", NodeType.Outpost,
                NodeDangerLevel.High, new Vector2(300, -300), true, new List<int> { 6, 8, 10 }, 3));

            nodes.Add(CreateNode(10, "Omega Station", "Destination hub", NodeType.Station,
                NodeDangerLevel.Safe, new Vector2(700, -150), true, new List<int> { 7, 9 }, 2));

            return nodes;
        }

        private StarNodeData CreateNode(int id, string name, string desc, NodeType type,
            NodeDangerLevel danger, Vector2 pos, bool hasFuel, List<int> connections, int refuelCost)
        {
            var node = ScriptableObject.CreateInstance<StarNodeData>();
            node.NodeId = id;
            node.NodeName = name;
            node.Description = desc;
            node.Type = type;
            node.DangerLevel = danger;
            node.Position = pos;
            node.HasFuelStation = hasFuel;
            node.ConnectedNodeIds = connections;
            node.RefuelCost = refuelCost;
            node.NodeColor = GetNodeColor(type);
            return node;
        }

        private Color GetNodeColor(NodeType type)
        {
            switch (type)
            {
                case NodeType.Station: return new Color(0.3f, 0.7f, 1f);
                case NodeType.Planet: return new Color(0.4f, 0.9f, 0.4f);
                case NodeType.Outpost: return new Color(1f, 0.8f, 0.3f);
                case NodeType.Wormhole: return new Color(0.8f, 0.3f, 0.9f);
                case NodeType.Asteroid: return new Color(0.7f, 0.5f, 0.3f);
                case NodeType.Derelict: return new Color(0.5f, 0.5f, 0.5f);
                default: return Color.white;
            }
        }

        private List<ContractData> CreateDefaultContracts()
        {
            var contracts = new List<ContractData>();

            contracts.Add(CreateContract(101, "Emergency Medical Supplies",
                "Urgent vaccine shipment needed at Omega Station", CargoType.MedicalSupplies,
                1, 10, 15, 1500, 30, 20, CargoRiskLevel.High, true, true));

            contracts.Add(CreateContract(102, "Colony Food Rations",
                "Supply fresh produce to Eta Colony", CargoType.PerishableFood,
                4, 8, 12, 800, 15, 10, CargoRiskLevel.Medium, false, false));

            contracts.Add(CreateContract(103, "Research Equipment",
                "Delicate lab equipment to Zeta Station", CargoType.HighValueTech,
                1, 7, 14, 1200, 20, 15, CargoRiskLevel.Critical, false, false));

            contracts.Add(CreateContract(104, "Mail Delivery",
                "Standard mail to Beta Outpost", CargoType.Mail,
                1, 2, 8, 200, 5, 3, CargoRiskLevel.Low, false, false));

            contracts.Add(CreateContract(105, "Rare Minerals",
                "Mined ores from Gamma Asteroid", CargoType.GeneralGoods,
                3, 7, 10, 600, 12, 8, CargoRiskLevel.Medium, false, false));

            return contracts;
        }

        private ContractData CreateContract(int id, string title, string desc, CargoType cargo,
            int start, int end, int timeLimit, int credits, int rep, int failRep,
            CargoRiskLevel risk, bool urgent, bool mainContract)
        {
            var contract = ScriptableObject.CreateInstance<ContractData>();
            contract.ContractId = id;
            contract.Title = title;
            contract.Description = desc;
            contract.Cargo = cargo;
            contract.StartNodeId = start;
            contract.EndNodeId = end;
            contract.TimeLimit = timeLimit;
            contract.RewardCredits = credits;
            contract.RewardReputation = rep;
            contract.FailureReputationPenalty = failRep;
            contract.RiskLevel = risk;
            contract.IsUrgent = urgent;
            contract.IsMainContract = mainContract;
            return contract;
        }

        private List<EventCardData> CreateDefaultEvents()
        {
            var events = new List<EventCardData>();

            events.Add(CreateSpaceWeatherEvent());
            events.Add(CreatePiracyEvent());
            events.Add(CreateMechanicalEvent());
            events.Add(CreateTradeEvent());
            events.Add(CreateDiscoveryEvent());
            events.Add(CreateNPCEvent());
            events.Add(CreateEmergencyEvent());

            return events;
        }

        private EventCardData CreateSpaceWeatherEvent()
        {
            var evt = ScriptableObject.CreateInstance<EventCardData>();
            evt.EventId = 201;
            evt.Title = "Solar Flare";
            evt.Description = "A massive solar flare is heading towards your position. Navigation systems are glitching.";
            evt.Category = EventCategory.SpaceWeather;
            evt.Severity = EventSeverity.Moderate;
            evt.Weight = 15;
            evt.GuaranteesRemediation = true;
            evt.TriggerConditions.Add(new EventTriggerCondition { Type = TriggerType.Always });

            evt.Choices.Add(new EventChoice
            {
                ChoiceId = 1,
                Text = "Divert around - costs extra fuel but safe",
                Requirement = new ChoiceRequirement { FuelCost = 8, MinFuel = 8 },
                Outcomes = { new EventOutcome
                {
                    Weight = 100, OutcomeType = OutcomeType.Neutral,
                    ResultText = "You safely navigate around the solar flare.",
                    FuelDelta = -8
                }},
                IsRemediationChoice = true
            });

            evt.Choices.Add(new EventChoice
            {
                ChoiceId = 2,
                Text = "Power through - risk cargo damage",
                Requirement = new ChoiceRequirement(),
                Outcomes = {
                    new EventOutcome
                    {
                        Weight = 60, OutcomeType = OutcomeType.Positive,
                        ResultText = "You make it through safely! No damage.",
                        FuelDelta = -2
                    },
                    new EventOutcome
                    {
                        Weight = 40, OutcomeType = OutcomeType.Negative,
                        ResultText = "Cargo sustains minor damage from radiation.",
                        FuelDelta = -2, CargoDamagePercent = 15
                    }
                }
            });

            return evt;
        }

        private EventCardData CreatePiracyEvent()
        {
            var evt = ScriptableObject.CreateInstance<EventCardData>();
            evt.EventId = 202;
            evt.Title = "Pirate Ambush!";
            evt.Description = "Pirates have intercepted your route. They demand payment or they'll board the ship.";
            evt.Category = EventCategory.Piracy;
            evt.Severity = EventSeverity.Severe;
            evt.Weight = 10;
            evt.GuaranteesRemediation = true;
            evt.TriggerConditions.Add(new EventTriggerCondition
            {
                Type = TriggerType.DangerLevel,
                MinValue = (int)NodeDangerLevel.Medium,
                MaxValue = (int)NodeDangerLevel.Extreme
            });

            evt.Choices.Add(new EventChoice
            {
                ChoiceId = 1,
                Text = "Pay the ransom (300 credits)",
                Requirement = new ChoiceRequirement { CreditCost = 300 },
                Outcomes = { new EventOutcome
                {
                    Weight = 100, OutcomeType = OutcomeType.Negative,
                    ResultText = "Pirates take the credits and let you pass. Cowardly but effective.",
                    CreditsDelta = -300, ReputationDelta = -5
                }},
                IsRemediationChoice = true
            });

            evt.Choices.Add(new EventChoice
            {
                ChoiceId = 2,
                Text = "Attempt to evade (requires fuel)",
                Requirement = new ChoiceRequirement { FuelCost = 15, MinFuel = 15 },
                Outcomes = {
                    new EventOutcome
                    {
                        Weight = 70, OutcomeType = OutcomeType.Positive,
                        ResultText = "You outmaneuver the pirates! Word spreads of your skill.",
                        FuelDelta = -15, ReputationDelta = 10
                    },
                    new EventOutcome
                    {
                        Weight = 30, OutcomeType = OutcomeType.Negative,
                        ResultText = "They catch you briefly, stealing some cargo before you escape.",
                        FuelDelta = -15, CargoDamagePercent = 25, ReputationDelta = 2
                    }
                }
            });

            evt.Choices.Add(new EventChoice
            {
                ChoiceId = 3,
                Text = "Stand and fight (high risk)",
                Requirement = new ChoiceRequirement { MinReputation = 40 },
                Outcomes = {
                    new EventOutcome
                    {
                        Weight = 40, OutcomeType = OutcomeType.Positive,
                        ResultText = "Victory! You defeat the pirates and claim their loot!",
                        CreditsDelta = 500, ReputationDelta = 20
                    },
                    new EventOutcome
                    {
                        Weight = 40, OutcomeType = OutcomeType.Negative,
                        ResultText = "Close battle. You repel them but take damage.",
                        CargoDamagePercent = 30, ReputationDelta = 8
                    },
                    new EventOutcome
                    {
                        Weight = 20, OutcomeType = OutcomeType.Critical,
                        ResultText = "Defeat. Ship heavily damaged, cargo seized.",
                        CargoDamagePercent = 60, ReputationDelta = -10
                    }
                }
            });

            return evt;
        }

        private EventCardData CreateMechanicalEvent()
        {
            var evt = ScriptableObject.CreateInstance<EventCardData>();
            evt.EventId = 203;
            evt.Title = "Engine Trouble";
            evt.Description = "Your ship's engine is making strange noises. A technician would fix it quickly.";
            evt.Category = EventCategory.Mechanical;
            evt.Severity = EventSeverity.Minor;
            evt.Weight = 12;
            evt.GuaranteesRemediation = true;
            evt.TriggerConditions.Add(new EventTriggerCondition { Type = TriggerType.Always });

            evt.Choices.Add(new EventChoice
            {
                ChoiceId = 1,
                Text = "Hire a mechanic (150 credits)",
                Requirement = new ChoiceRequirement { CreditCost = 150 },
                Outcomes = { new EventOutcome
                {
                    Weight = 100, OutcomeType = OutcomeType.Positive,
                    ResultText = "Engine is fixed and running better than ever! Fuel efficiency improved.",
                    CreditsDelta = -150, FuelDelta = 5
                }},
                IsRemediationChoice = true
            });

            evt.Choices.Add(new EventChoice
            {
                ChoiceId = 2,
                Text = "Fix it yourself (loses a turn)",
                Requirement = new ChoiceRequirement { MinTurnsRemaining = 2 },
                Outcomes = {
                    new EventOutcome
                    {
                        Weight = 80, OutcomeType = OutcomeType.Neutral,
                        ResultText = "After a long night, you fix the engine.",
                        TurnDelta = -1
                    },
                    new EventOutcome
                    {
                        Weight = 20, OutcomeType = OutcomeType.Negative,
                        ResultText = "It holds... for now. May cause issues later.",
                        TurnDelta = -1, FuelDelta = -5
                    }
                }
            });

            return evt;
        }

        private EventCardData CreateTradeEvent()
        {
            var evt = ScriptableObject.CreateInstance<EventCardData>();
            evt.EventId = 204;
            evt.Title = "Trader Encounter";
            evt.Description = "A rogue trader offers you a deal on high-grade fuel, but it's pricey.";
            evt.Category = EventCategory.Trade;
            evt.Severity = EventSeverity.Trivial;
            evt.Weight = 10;
            evt.GuaranteesRemediation = true;
            evt.AllowSkip = true;
            evt.TriggerConditions.Add(new EventTriggerCondition { Type = TriggerType.Always });

            evt.Choices.Add(new EventChoice
            {
                ChoiceId = 1,
                Text = "Buy premium fuel (200 credits for 30 fuel)",
                Requirement = new ChoiceRequirement { CreditCost = 200 },
                Outcomes = { new EventOutcome
                {
                    Weight = 100, OutcomeType = OutcomeType.Positive,
                    ResultText = "Premium fuel loaded! It burns cleaner and lasts longer.",
                    CreditsDelta = -200, FuelDelta = 30
                }}
            });

            evt.Choices.Add(new EventChoice
            {
                ChoiceId = 2,
                Text = "Trade info for supplies (10 rep for fuel)",
                Requirement = new ChoiceRequirement { MinReputation = 20, ReputationCost = 10 },
                Outcomes = { new EventOutcome
                {
                    Weight = 100, OutcomeType = OutcomeType.Neutral,
                    ResultText = "You trade trade route intel. Fair exchange.",
                    ReputationDelta = -10, FuelDelta = 15
                }},
                IsRemediationChoice = true
            });

            evt.Choices.Add(new EventChoice
            {
                ChoiceId = 3,
                Text = "Pass on this offer",
                Requirement = new ChoiceRequirement(),
                Outcomes = { new EventOutcome
                {
                    Weight = 100, OutcomeType = OutcomeType.Neutral,
                    ResultText = "You decline politely and continue on your way."
                }}
            });

            return evt;
        }

        private EventCardData CreateDiscoveryEvent()
        {
            var evt = ScriptableObject.CreateInstance<EventCardData>();
            evt.EventId = 205;
            evt.Title = "Ancient Signal";
            evt.Description = "You pick up a faint signal from an uncharted region. Could be treasure, could be trouble.";
            evt.Category = EventCategory.Discovery;
            evt.Severity = EventSeverity.Moderate;
            evt.Weight = 8;
            evt.GuaranteesRemediation = true;
            evt.AllowSkip = true;
            evt.TriggerConditions.Add(new EventTriggerCondition { Type = TriggerType.Always });

            evt.Choices.Add(new EventChoice
            {
                ChoiceId = 1,
                Text = "Investigate (10 fuel detour)",
                Requirement = new ChoiceRequirement { FuelCost = 10, MinFuel = 10 },
                Outcomes = {
                    new EventOutcome
                    {
                        Weight = 40, OutcomeType = OutcomeType.Positive,
                        ResultText = "You find a derelict ship with salvageable cargo!",
                        CreditsDelta = 400, FuelDelta = -10, ReputationDelta = 5
                    },
                    new EventOutcome
                    {
                        Weight = 30, OutcomeType = OutcomeType.Positive,
                        ResultText = "Ancient data cores! Worth a fortune to researchers.",
                        CreditsDelta = 250, FuelDelta = -10
                    },
                    new EventOutcome
                    {
                        Weight = 30, OutcomeType = OutcomeType.Negative,
                        ResultText = "It's a pirate trap! You barely escape.",
                        FuelDelta = -18, CargoDamagePercent = 10
                    }
                }
            });

            evt.Choices.Add(new EventChoice
            {
                ChoiceId = 2,
                Text = "Log and ignore",
                Requirement = new ChoiceRequirement(),
                Outcomes = { new EventOutcome
                {
                    Weight = 100, OutcomeType = OutcomeType.Neutral,
                    ResultText = "You mark it on your map. Maybe next time.",
                    FuelDelta = 0
                }},
                IsRemediationChoice = true
            });

            return evt;
        }

        private EventCardData CreateNPCEvent()
        {
            var evt = ScriptableObject.CreateInstance<EventCardData>();
            evt.EventId = 206;
            evt.Title = "Stranded Pilot";
            evt.Description = "A fellow pilot is stranded with a dead ship. They need fuel to get home.";
            evt.Category = EventCategory.NPCEncounter;
            evt.Severity = EventSeverity.Minor;
            evt.Weight = 8;
            evt.GuaranteesRemediation = true;
            evt.AllowSkip = true;
            evt.TriggerConditions.Add(new EventTriggerCondition { Type = TriggerType.Always });

            evt.Choices.Add(new EventChoice
            {
                ChoiceId = 1,
                Text = "Help them out (give 15 fuel)",
                Requirement = new ChoiceRequirement { FuelCost = 15, MinFuel = 20 },
                Outcomes = { new EventOutcome
                {
                    Weight = 100, OutcomeType = OutcomeType.Positive,
                    ResultText = "They're incredibly grateful! Word of your kindness spreads.",
                    FuelDelta = -15, ReputationDelta = 20, CreditsDelta = 100
                }}
            });

            evt.Choices.Add(new EventChoice
            {
                ChoiceId = 2,
                Text = "Radio for help (no cost)",
                Requirement = new ChoiceRequirement(),
                Outcomes = { new EventOutcome
                {
                    Weight = 100, OutcomeType = OutcomeType.Neutral,
                    ResultText = "A rescue team is dispatched. Good citizen points!",
                    ReputationDelta = 5
                }},
                IsRemediationChoice = true
            });

            evt.Choices.Add(new EventChoice
            {
                ChoiceId = 3,
                Text = "Ignore the signal",
                Requirement = new ChoiceRequirement(),
                Outcomes = { new EventOutcome
                {
                    Weight = 100, OutcomeType = OutcomeType.Negative,
                    ResultText = "Another pilot notices your callous disregard.",
                    ReputationDelta = -8
                }}
            });

            return evt;
        }

        private EventCardData CreateEmergencyEvent()
        {
            var evt = ScriptableObject.CreateInstance<EventCardData>();
            evt.EventId = 207;
            evt.Title = "Hull Breach!";
            evt.Description = "Micro-meteoroids! A small hole has breached your hull. Quick action needed!";
            evt.Category = EventCategory.Emergency;
            evt.Severity = EventSeverity.Severe;
            evt.Weight = 6;
            evt.GuaranteesRemediation = true;
            evt.TriggerConditions.Add(new EventTriggerCondition
            {
                Type = TriggerType.DangerLevel,
                MinValue = (int)NodeDangerLevel.Medium
            });

            evt.Choices.Add(new EventChoice
            {
                ChoiceId = 1,
                Text = "Use emergency patch kit (if available)",
                Requirement = new ChoiceRequirement { RequiredItem = "PatchKit" },
                Outcomes = { new EventOutcome
                {
                    Weight = 100, OutcomeType = OutcomeType.Positive,
                    ResultText = "Kit deployed perfectly! Crisis averted with minimal losses.",
                    CargoDamagePercent = 5
                }},
                IsRemediationChoice = true
            });

            evt.Choices.Add(new EventChoice
            {
                ChoiceId = 2,
                Text = "Seal compartment - sacrifice some cargo",
                Requirement = new ChoiceRequirement(),
                Outcomes = { new EventOutcome
                {
                    Weight = 100, OutcomeType = OutcomeType.Negative,
                    ResultText = "You seal the section. Cargo is lost but crew is safe.",
                    CargoDamagePercent = 30
                }}
            });

            evt.Choices.Add(new EventChoice
            {
                ChoiceId = 3,
                Text = "Emergency divert to nearest station (25 fuel)",
                Requirement = new ChoiceRequirement { FuelCost = 25, MinFuel = 25 },
                Outcomes = { new EventOutcome
                {
                    Weight = 100, OutcomeType = OutcomeType.Neutral,
                    ResultText = "Emergency divert successful. Repairs at station are covered by insurance.",
                    FuelDelta = -25, TurnDelta = -1
                }},
                IsRemediationChoice = true
            });

            return evt;
        }

        public bool LoadLevel(int levelId)
        {
            if (!levelLookup.TryGetValue(levelId, out var level))
            {
                Debug.LogError($"[DataManager] Level {levelId} not found!");
                return false;
            }

            currentLevel = level;

            currentNodeLookup.Clear();
            currentContractLookup.Clear();
            currentEventLookup.Clear();

            foreach (var node in level.StarNodes)
            {
                currentNodeLookup[node.NodeId] = node;
            }

            foreach (var contract in level.AvailableContracts)
            {
                currentContractLookup[contract.ContractId] = contract;
            }

            foreach (var evt in level.EventCardsPool)
            {
                currentEventLookup[evt.EventId] = evt;
            }

            InitializeRuntimeData();
            Debug.Log($"[DataManager] Level {level.LevelName} loaded. Nodes: {currentNodeLookup.Count}");
            return true;
        }

        private void InitializeRuntimeData()
        {
            runtimeData = new GameRuntimeData
            {
                CurrentLevelId = currentLevel.LevelId,
                CurrentTurn = 1,
                TotalScore = 0,
                Ship =
                {
                    CurrentNodeId = currentLevel.StartNodeId,
                    CurrentFuel = currentLevel.StartingFuel,
                    MaxFuel = currentLevel.MaxFuel,
                    ShipHealth = 100,
                    CargoIntegrity = 100
                },
                Player =
                {
                    Credits = currentLevel.StartingCredits,
                    Reputation = currentLevel.StartingReputation
                }
            };
        }

        public StarNodeData GetNode(int nodeId)
        {
            currentNodeLookup.TryGetValue(nodeId, out var node);
            return node;
        }

        public ContractData GetContract(int contractId)
        {
            currentContractLookup.TryGetValue(contractId, out var contract);
            return contract;
        }

        public EventCardData GetEvent(int eventId)
        {
            currentEventLookup.TryGetValue(eventId, out var evt);
            return evt;
        }

        public void SetRuntimeData(GameRuntimeData data)
        {
            runtimeData = data;
            OnRuntimeDataChanged?.Invoke();
        }

        public void NotifyDataChanged()
        {
            OnRuntimeDataChanged?.Invoke();
        }

        public int CalculateFuelCost(int fromNodeId, int toNodeId)
        {
            var fromNode = GetNode(fromNodeId);
            var toNode = GetNode(toNodeId);
            if (fromNode == null || toNode == null) return int.MaxValue;

            var distance = Vector2.Distance(fromNode.Position, toNode.Position);
            var baseCost = Mathf.CeilToInt(distance / 50f);

            var dangerMultiplier = GetDangerFuelMultiplier(toNode.DangerLevel);
            baseCost = Mathf.CeilToInt(baseCost * dangerMultiplier);

            return Mathf.Max(1, baseCost);
        }

        private float GetDangerFuelMultiplier(NodeDangerLevel danger)
        {
            switch (danger)
            {
                case NodeDangerLevel.Safe: return 1.0f;
                case NodeDangerLevel.Low: return 1.1f;
                case NodeDangerLevel.Medium: return 1.25f;
                case NodeDangerLevel.High: return 1.5f;
                case NodeDangerLevel.Extreme: return 2.0f;
                default: return 1.0f;
            }
        }

        public int CalculatePathFuelCost(List<int> pathNodes)
        {
            if (pathNodes == null || pathNodes.Count < 2) return 0;
            int total = 0;
            for (int i = 0; i < pathNodes.Count - 1; i++)
            {
                total += CalculateFuelCost(pathNodes[i], pathNodes[i + 1]);
            }
            return total;
        }

        public List<int> FindOptimalPath(int startNodeId, int endNodeId)
        {
            return DijkstraPathfinding(startNodeId, endNodeId, out _);
        }

        public List<int> FindOptimalPath(int startNodeId, int endNodeId, out int totalFuelCost)
        {
            return DijkstraPathfinding(startNodeId, endNodeId, out totalFuelCost);
        }

        private List<int> DijkstraPathfinding(int start, int end, out int totalCost)
        {
            totalCost = 0;
            if (!currentNodeLookup.ContainsKey(start) || !currentNodeLookup.ContainsKey(end))
                return new List<int>();

            var distances = new Dictionary<int, int>();
            var previous = new Dictionary<int, int>();
            var unvisited = new HashSet<int>();

            foreach (var nodeId in currentNodeLookup.Keys)
            {
                distances[nodeId] = int.MaxValue;
                unvisited.Add(nodeId);
            }
            distances[start] = 0;

            while (unvisited.Count > 0)
            {
                int current = -1;
                int minDist = int.MaxValue;
                foreach (var nodeId in unvisited)
                {
                    if (distances[nodeId] < minDist)
                    {
                        minDist = distances[nodeId];
                        current = nodeId;
                    }
                }

                if (current == -1 || current == end) break;
                unvisited.Remove(current);

                var currentNode = GetNode(current);
                foreach (var neighborId in currentNode.ConnectedNodeIds)
                {
                    if (!unvisited.Contains(neighborId)) continue;
                    var cost = CalculateFuelCost(current, neighborId);
                    var alt = distances[current] + cost;
                    if (alt < distances[neighborId])
                    {
                        distances[neighborId] = alt;
                        previous[neighborId] = current;
                    }
                }
            }

            if (!distances.ContainsKey(end) || distances[end] == int.MaxValue)
                return new List<int>();

            var path = new List<int>();
            int current2 = end;
            while (current2 != start)
            {
                path.Insert(0, current2);
                if (!previous.ContainsKey(current2)) return new List<int>();
                current2 = previous[current2];
            }
            path.Insert(0, start);

            totalCost = distances[end];
            return path;
        }

        public List<StarNodeData> GetConnectedNodes(int nodeId)
        {
            var node = GetNode(nodeId);
            if (node == null) return new List<StarNodeData>();
            var result = new List<StarNodeData>();
            foreach (var connectedId in node.ConnectedNodeIds)
            {
                var connected = GetNode(connectedId);
                if (connected != null) result.Add(connected);
            }
            return result;
        }

        public bool AreNodesConnected(int fromNodeId, int toNodeId)
        {
            var node = GetNode(fromNodeId);
            return node != null && node.ConnectedNodeIds.Contains(toNodeId);
        }

        public List<ContractData> GetAvailableContractsAtNode(int nodeId)
        {
            var result = new List<ContractData>();
            var acceptedIds = runtimeData.ActiveContracts.Select(c => c.ContractId).ToHashSet();
            var completedIds = runtimeData.CompletedContracts.Select(c => c.ContractId).ToHashSet();

            foreach (var contract in currentContractLookup.Values)
            {
                if (contract.StartNodeId == nodeId &&
                    !acceptedIds.Contains(contract.ContractId) &&
                    !completedIds.Contains(contract.ContractId))
                {
                    result.Add(contract);
                }
            }
            return result;
        }

        public List<ContractState> GetContractsToDeliver(int nodeId)
        {
            return runtimeData.ActiveContracts
                .Where(c => c.EndNodeId == nodeId && c.Status == ContractStatus.CargoPickedUp)
                .ToList();
        }

        public void Shutdown()
        {
            levelLookup.Clear();
            currentNodeLookup.Clear();
            currentContractLookup.Clear();
            currentEventLookup.Clear();
            currentLevel = null;
            runtimeData = null;
            Debug.Log("[DataManager] Shutdown.");
        }
    }
}
