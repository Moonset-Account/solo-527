using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

#if UNITY_5_3_OR_NEWER
using UnityEngine;
#endif

namespace BalloonPost.Save
{
    using BalloonPost.Core;

    [Serializable]
    public class SaveData
    {
        public string SaveId;
        public string SaveName;
        public DateTime SaveTime;
        public int PlayTimeSeconds;
        public int LevelIndex;
        public int GameSeed;
        public int MaxTurns;
        public int TurnsElapsed;
        public int GamePhase;

        public PlayerState Player;

        public List<HexCellData> GridCells;
        public int GridRadius;
        public List<AxialCoord> GridTowns;
        public List<AxialCoord> GridPostOffices;

        public List<WindInfo> WindForecast;
        public int WindCurrentTurn;
        public int WindLookAhead;

        public List<ContractData> AllContracts;
        public List<string> PendingContractIds;
        public List<string> ActiveContractIds;
        public List<string> DeliveredContractIds;
        public List<string> FailedContractIds;
        public int ContractCounter;

        public List<RouteStepData> RouteSteps;
        public AxialCoord RouteStartPosition;

        public SettlementReport LastSettlement;
        public List<string> CompletedTutorialSteps;
    }

    [Serializable]
    public class HexCellData
    {
        public int Q;
        public int R;
        public int Terrain;
        public int Elevation;
        public string TownName;
        public bool HasPostOffice;
    }

    [Serializable]
    public class ContractData
    {
        public string Id;
        public int Type;
        public int Status;
        public string FromTown;
        public string ToTown;
        public int FromQ;
        public int FromR;
        public int ToQ;
        public int ToR;
        public int BaseReward;
        public int PriorityWeight;
        public int MaxTurns;
        public int TurnsRemaining;
        public int FragilityLevel;
        public string Description;
        public int AcceptTurn;
        public int? DeliverTurn;
        public int CurrentDamage;
    }

    [Serializable]
    public class RouteStepData
    {
        public int FromQ;
        public int FromR;
        public int ToQ;
        public int ToR;
        public int FuelCost;
        public int TimeCost;
        public int WindModifier;
        public int DamageTaken;
        public int TurnIndex;
        public bool IsLocked;
    }

    public static partial class SaveSystem
    {
        public const string SaveDirectoryName = "BalloonPostSaves";
        public const string FileExtension = ".bpsave";

        static partial void CustomGetSaveDirectory(ref string result);
        static partial void CustomSerialize(object obj, ref string result);
        static partial void CustomDeserialize<T>(string json, ref T result);
        static partial void CustomLogError(string message);

        public static string GetSaveDirectory()
        {
            string dir = null;
            CustomGetSaveDirectory(ref dir);
            if (!string.IsNullOrEmpty(dir))
            {
                if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                return dir;
            }
#if UNITY_5_3_OR_NEWER
            dir = Path.Combine(Application.persistentDataPath, SaveDirectoryName);
#else
            dir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                SaveDirectoryName);
#endif
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
            return dir;
        }

        public static string GetSavePath(string saveId)
        {
            return Path.Combine(GetSaveDirectory(), saveId + FileExtension);
        }

        public static bool SaveGame(GameManager game, string saveName = null)
        {
            try
            {
                var data = ConvertToSaveData(game, saveName);
                string path = GetSavePath(data.SaveId);
                string json = Serialize(data);
                File.WriteAllText(path, json, Encoding.UTF8);
                return true;
            }
            catch (Exception e)
            {
                LogError($"保存失败: {e.Message}\n{e.StackTrace}");
                return false;
            }
        }

        public static SaveData LoadSaveData(string saveId)
        {
            try
            {
                string path = GetSavePath(saveId);
                if (!File.Exists(path)) return null;
                string json = File.ReadAllText(path, Encoding.UTF8);
                return Deserialize<SaveData>(json);
            }
            catch (Exception e)
            {
                LogError($"读取存档失败: {e.Message}");
                return null;
            }
        }

        public static GameManager LoadGame(string saveId)
        {
            var data = LoadSaveData(saveId);
            if (data == null) return null;
            try
            {
                return RestoreGameFromData(data);
            }
            catch (Exception e)
            {
                LogError($"还原存档失败: {e.Message}\n{e.StackTrace}");
                return null;
            }
        }

        public static List<string> ListSaves()
        {
            var ids = new List<string>();
            string dir = GetSaveDirectory();
            if (!Directory.Exists(dir)) return ids;
            var files = Directory.GetFiles(dir, "*" + FileExtension);
            foreach (var file in files)
            {
                try
                {
                    string json = File.ReadAllText(file, Encoding.UTF8);
                    var data = Deserialize<SaveData>(json);
                    if (data != null)
                    {
                        string display = string.IsNullOrEmpty(data.SaveName)
                            ? data.SaveId
                            : $"{data.SaveName} [{data.SaveTime:MM-dd HH:mm}]";
                        ids.Add(display);
                    }
                }
                catch { }
            }
            return ids;
        }

        public static string ExtractSaveIdFromDisplay(string displayName)
        {
            if (string.IsNullOrEmpty(displayName)) return displayName;
            int bracket = displayName.LastIndexOf(" [", StringComparison.Ordinal);
            if (bracket > 0) return displayName.Substring(0, bracket);
            return displayName;
        }

        public static List<SaveData> ListAllSaves()
        {
            var saves = new List<SaveData>();
            string dir = GetSaveDirectory();
            if (!Directory.Exists(dir)) return saves;

            var files = Directory.GetFiles(dir, "*" + FileExtension);
            foreach (var file in files)
            {
                try
                {
                    string json = File.ReadAllText(file, Encoding.UTF8);
                    var data = Deserialize<SaveData>(json);
                    if (data != null) saves.Add(data);
                }
                catch { }
            }
            return saves.OrderByDescending(s => s.SaveTime).ToList();
        }

        public static bool DeleteSave(string saveId)
        {
            try
            {
                string path = GetSavePath(saveId);
                if (File.Exists(path))
                {
                    File.Delete(path);
                    return true;
                }
                return false;
            }
            catch (Exception e)
            {
                LogError($"删除存档失败: {e.Message}");
                return false;
            }
        }

        private static string Serialize(object obj)
        {
            string custom = null;
            CustomSerialize(obj, ref custom);
            if (!string.IsNullOrEmpty(custom)) return custom;

#if UNITY_5_3_OR_NEWER
            return JsonUtility.ToJson(obj, true);
#else
            return System.Text.Json.JsonSerializer.Serialize(obj, new System.Text.Json.JsonSerializerOptions
            {
                WriteIndented = true
            });
#endif
        }

        private static T Deserialize<T>(string json)
        {
            T custom = default(T);
            object boxed = custom;
            CustomDeserialize<T>(json, ref custom);
            if (!EqualityComparer<T>.Default.Equals(custom, default(T))) return custom;

#if UNITY_5_3_OR_NEWER
            return JsonUtility.FromJson<T>(json);
#else
            return System.Text.Json.JsonSerializer.Deserialize<T>(json);
#endif
        }

        private static void LogError(string msg)
        {
            CustomLogError(msg);
#if UNITY_5_3_OR_NEWER
            Debug.LogError(msg);
#else
            Console.Error.WriteLine(msg);
#endif
        }

        private static SaveData ConvertToSaveData(GameManager game, string saveName)
        {
            var data = new SaveData
            {
                SaveId = "save_" + DateTime.Now.ToString("yyyyMMdd_HHmmss_fff"),
                SaveName = saveName ?? $"第{game.LevelIndex + 1}关 T{game.TurnsElapsed}",
                SaveTime = DateTime.Now,
                LevelIndex = game.LevelIndex,
                GameSeed = game.GameSeed,
                MaxTurns = game.MaxTurns,
                TurnsElapsed = game.TurnsElapsed,
                GamePhase = (int)game.Phase,
                Player = game.Player.Clone()
            };

            data.GridRadius = game.Grid.Radius;
            data.GridCells = new List<HexCellData>();
            foreach (var cell in game.Grid.Cells.Values)
            {
                data.GridCells.Add(new HexCellData
                {
                    Q = cell.Coord.Q,
                    R = cell.Coord.R,
                    Terrain = (int)cell.Terrain,
                    Elevation = cell.Elevation,
                    TownName = cell.TownName,
                    HasPostOffice = cell.HasPostOffice
                });
            }
            data.GridTowns = new List<AxialCoord>(game.Grid.Towns);
            data.GridPostOffices = new List<AxialCoord>(game.Grid.PostOffices);

            data.WindForecast = new List<WindInfo>();
            for (int i = 0; i < game.WindManager.LookAheadTurns; i++)
            {
                var w = game.WindManager.Forecast[i];
                if (w != null) data.WindForecast.Add(w);
            }
            data.WindCurrentTurn = game.WindManager.CurrentTurn;
            data.WindLookAhead = game.WindManager.LookAheadTurns;

            data.AllContracts = new List<ContractData>();
            data.PendingContractIds = new List<string>();
            data.ActiveContractIds = new List<string>();
            data.DeliveredContractIds = new List<string>();
            data.FailedContractIds = new List<string>();
            data.ContractCounter = game.ContractManager.ContractCounter;

            foreach (var c in game.ContractManager.AllContracts)
            {
                data.AllContracts.Add(new ContractData
                {
                    Id = c.Id,
                    Type = (int)c.Type,
                    Status = (int)c.Status,
                    FromTown = c.FromTown,
                    ToTown = c.ToTown,
                    FromQ = c.FromCoord.Q,
                    FromR = c.FromCoord.R,
                    ToQ = c.ToCoord.Q,
                    ToR = c.ToCoord.R,
                    BaseReward = c.BaseReward,
                    PriorityWeight = c.PriorityWeight,
                    MaxTurns = c.MaxTurns,
                    TurnsRemaining = c.TurnsRemaining,
                    FragilityLevel = c.FragilityLevel,
                    Description = c.Description,
                    AcceptTurn = c.AcceptTurn,
                    DeliverTurn = c.DeliverTurn,
                    CurrentDamage = c.CurrentDamage
                });
            }
            foreach (var c in game.ContractManager.PendingContracts) data.PendingContractIds.Add(c.Id);
            foreach (var c in game.ContractManager.ActiveContracts) data.ActiveContractIds.Add(c.Id);
            foreach (var c in game.ContractManager.DeliveredContracts) data.DeliveredContractIds.Add(c.Id);
            foreach (var c in game.ContractManager.FailedContracts) data.FailedContractIds.Add(c.Id);

            data.RouteStartPosition = game.Planner.CurrentPlan.StartPosition;
            data.RouteSteps = new List<RouteStepData>();
            foreach (var step in game.Planner.CurrentPlan.Steps)
            {
                data.RouteSteps.Add(new RouteStepData
                {
                    FromQ = step.From.Q,
                    FromR = step.From.R,
                    ToQ = step.To.Q,
                    ToR = step.To.R,
                    FuelCost = step.FuelCost,
                    TimeCost = step.TimeCost,
                    WindModifier = step.WindModifier,
                    DamageTaken = step.DamageTaken,
                    TurnIndex = step.TurnIndex,
                    IsLocked = step.IsLocked
                });
            }

            data.LastSettlement = null;
            data.CompletedTutorialSteps = new List<string>(game.Player.CompletedTutorialSteps);

            return data;
        }

        private static GameManager RestoreGameFromData(SaveData data)
        {
            var game = new GameManager(data.GameSeed, data.MaxTurns, data.LevelIndex)
            {
                TurnsElapsed = data.TurnsElapsed,
                Phase = (GamePhase)data.GamePhase
            };

            game.Grid = new HexGrid(data.GridRadius);
            foreach (var cd in data.GridCells)
            {
                var coord = new AxialCoord(cd.Q, cd.R);
                var cell = new HexCell(coord, (HexTerrain)cd.Terrain, cd.Elevation)
                {
                    TownName = cd.TownName,
                    HasPostOffice = cd.HasPostOffice
                };
                game.Grid.Cells[coord] = cell;
            }
            game.Grid.Towns = new List<AxialCoord>(data.GridTowns ?? new List<AxialCoord>());
            game.Grid.PostOffices = new List<AxialCoord>(data.GridPostOffices ?? new List<AxialCoord>());

            game.WindManager = new WindManager(data.GameSeed, data.WindLookAhead);
            game.WindManager.CurrentTurn = data.WindCurrentTurn;
            for (int i = 0; i < Math.Min(data.WindLookAhead, data.WindForecast.Count); i++)
            {
                game.WindManager.Forecast[i] = data.WindForecast[i];
            }

            game.Player = data.Player;

            game.ContractManager = new ContractManager(game.Grid, 5, data.GameSeed);
            game.ContractManager.ContractCounter = data.ContractCounter;

            var contractMap = new Dictionary<string, Contract>();
            foreach (var cd in data.AllContracts)
            {
                var c = new Contract
                {
                    Id = cd.Id,
                    Type = (ContractType)cd.Type,
                    Status = (ContractStatus)cd.Status,
                    FromTown = cd.FromTown,
                    ToTown = cd.ToTown,
                    FromCoord = new AxialCoord(cd.FromQ, cd.FromR),
                    ToCoord = new AxialCoord(cd.ToQ, cd.ToR),
                    BaseReward = cd.BaseReward,
                    PriorityWeight = cd.PriorityWeight,
                    MaxTurns = cd.MaxTurns,
                    TurnsRemaining = cd.TurnsRemaining,
                    FragilityLevel = cd.FragilityLevel,
                    Description = cd.Description,
                    AcceptTurn = cd.AcceptTurn,
                    DeliverTurn = cd.DeliverTurn,
                    CurrentDamage = cd.CurrentDamage
                };
                game.ContractManager.AllContracts.Add(c);
                contractMap[c.Id] = c;
            }
            foreach (var id in data.PendingContractIds ?? new List<string>())
                if (contractMap.TryGetValue(id, out var c1)) game.ContractManager.PendingContracts.Add(c1);
            foreach (var id in data.ActiveContractIds ?? new List<string>())
                if (contractMap.TryGetValue(id, out var c2)) game.ContractManager.ActiveContracts.Add(c2);
            foreach (var id in data.DeliveredContractIds ?? new List<string>())
                if (contractMap.TryGetValue(id, out var c3)) game.ContractManager.DeliveredContracts.Add(c3);
            foreach (var id in data.FailedContractIds ?? new List<string>())
                if (contractMap.TryGetValue(id, out var c4)) game.ContractManager.FailedContracts.Add(c4);

            game.Planner = new RoutePlanner(game.Grid, game.WindManager, game.ContractManager, game.Player);
            game.Planner.CurrentPlan.StartPosition = data.RouteStartPosition;
            game.Planner.CurrentPlan.Steps.Clear();
            foreach (var sd in data.RouteSteps ?? new List<RouteStepData>())
            {
                game.Planner.CurrentPlan.Steps.Add(new RouteStep
                {
                    From = new AxialCoord(sd.FromQ, sd.FromR),
                    To = new AxialCoord(sd.ToQ, sd.ToR),
                    FuelCost = sd.FuelCost,
                    TimeCost = sd.TimeCost,
                    WindModifier = sd.WindModifier,
                    DamageTaken = sd.DamageTaken,
                    TurnIndex = sd.TurnIndex,
                    IsLocked = sd.IsLocked
                });
            }
            game.Planner.CurrentPlan.RecalculateTotals();
            game.UndoStack = game.Planner.UndoStack;

            return game;
        }
    }
}
