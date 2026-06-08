namespace SpaceCourier.Core
{
    public struct GameEvents
    {
        public struct GameStarted
        {
            public int LevelId;
        }

        public struct GamePaused
        {
            public bool IsPaused;
        }

        public struct GameEnded
        {
            public bool IsVictory;
            public string Reason;
            public int Score;
        }

        public struct TurnStarted
        {
            public int TurnNumber;
        }

        public struct TurnEnded
        {
            public int TurnNumber;
        }

        public struct FuelChanged
        {
            public int CurrentFuel;
            public int MaxFuel;
            public int Delta;
            public string Reason;
        }

        public struct ReputationChanged
        {
            public int CurrentReputation;
            public int Delta;
            public string Reason;
        }

        public struct ContractAccepted
        {
            public int ContractId;
        }

        public struct ContractCompleted
        {
            public int ContractId;
            public bool IsSuccess;
            public int Reward;
        }

        public struct NodeSelected
        {
            public int NodeId;
        }

        public struct RoutePlanned
        {
            public int[] NodePath;
            public int TotalFuelCost;
        }

        public struct ShipMoved
        {
            public int FromNodeId;
            public int ToNodeId;
        }

        public struct EventCardDrawn
        {
            public int EventId;
            public string Title;
        }

        public struct EventResolved
        {
            public int EventId;
            public int ChoiceId;
            public string Outcome;
        }

        public struct UIPanelOpened
        {
            public string PanelName;
        }

        public struct UIPanelClosed
        {
            public string PanelName;
        }

        public struct SettingsChanged
        {
            public float MasterVolume;
            public float MusicVolume;
            public float SfxVolume;
        }

        public struct DataLoaded
        {
            public bool Success;
        }

        public struct SceneLoadStarted
        {
            public string SceneName;
        }

        public struct SceneLoadProgress
        {
            public string SceneName;
            public float Progress;
        }

        public struct SceneLoadCompleted
        {
            public string SceneName;
        }

        public struct CriticalChoiceMade
        {
            public string ChoiceType;
            public string ChoiceValue;
            public int TurnNumber;
        }
    }
}
