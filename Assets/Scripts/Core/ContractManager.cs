using System;
using System.Collections.Generic;
using System.Linq;

namespace BalloonPost.Core
{
    public class ContractManager
    {
        public List<Contract> AllContracts;
        public List<Contract> PendingContracts;
        public List<Contract> ActiveContracts;
        public List<Contract> DeliveredContracts;
        public List<Contract> FailedContracts;
        public int MaxActiveContracts;
        public int ContractCounter;

        private Random _random;
        private HexGrid _grid;

        public ContractManager(HexGrid grid, int maxActive = 5, int seed = 42)
        {
            _grid = grid;
            _random = new Random(seed);
            MaxActiveContracts = maxActive;
            AllContracts = new List<Contract>();
            PendingContracts = new List<Contract>();
            ActiveContracts = new List<Contract>();
            DeliveredContracts = new List<Contract>();
            FailedContracts = new List<Contract>();
            ContractCounter = 0;
        }

        public Contract GenerateRandomContract(int minReward = 50, int maxReward = 200)
        {
            ContractCounter++;
            string id = $"CTR-{ContractCounter:0000}";

            if (_grid.Towns.Count < 2) return null;

            int fromIdx = _random.Next(_grid.Towns.Count);
            int toIdx;
            do
            {
                toIdx = _random.Next(_grid.Towns.Count);
            } while (toIdx == fromIdx);

            var fromCoord = _grid.Towns[fromIdx];
            var toCoord = _grid.Towns[toIdx];
            string fromName = _grid.GetCell(fromCoord)?.TownName ?? "未知";
            string toName = _grid.GetCell(toCoord)?.TownName ?? "未知";

            int distance = fromCoord.DistanceTo(toCoord);
            int baseReward = minReward + distance * _random.Next(15, 25);
            baseReward = Math.Min(maxReward, baseReward);

            int typeRoll = _random.Next(0, 100);
            Contract contract;

            if (typeRoll < 15)
            {
                int maxTurns = Math.Max(5, distance * 2 + _random.Next(0, 4));
                contract = Contract.CreateTimeSensitive(id, fromName, toName, fromCoord, toCoord,
                    baseReward + 50, maxTurns);
            }
            else if (typeRoll < 40)
            {
                int fragility = _random.Next(1, 4);
                contract = Contract.CreateFragile(id, fromName, toName, fromCoord, toCoord,
                    baseReward + 30, fragility);
            }
            else
            {
                contract = Contract.CreateNormal(id, fromName, toName, fromCoord, toCoord, baseReward);
            }

            AllContracts.Add(contract);
            PendingContracts.Add(contract);
            return contract;
        }

        public List<Contract> GenerateInitialContracts(int count)
        {
            var contracts = new List<Contract>();
            for (int i = 0; i < count; i++)
            {
                var c = GenerateRandomContract();
                if (c != null) contracts.Add(c);
            }
            return contracts;
        }

        public Contract CreateTutorialContract1(HexGrid grid)
        {
            ContractCounter++;
            string id = $"TUT-0001";
            var fromCoord = AxialCoord.Zero;
            var toCoord = new AxialCoord(2, 0);
            string fromName = grid.GetCell(fromCoord)?.TownName ?? "邮局总站";
            string toName = grid.GetCell(toCoord)?.TownName ?? "云顶镇";

            var contract = Contract.CreateNormal(id, fromName, toName, fromCoord, toCoord, 80);
            contract.Description = "【教程1】完成你的第一次准时投递！从邮局到云顶镇，任何时候到达都可以。";

            AllContracts.Add(contract);
            PendingContracts.Add(contract);
            return contract;
        }

        public Contract CreateTutorialContract2(HexGrid grid)
        {
            ContractCounter++;
            string id = $"TUT-0002";
            var fromCoord = AxialCoord.Zero;
            var toCoord = new AxialCoord(3, 0);
            string fromName = grid.GetCell(fromCoord)?.TownName ?? "邮局总站";
            string toName = grid.GetCell(toCoord)?.TownName ?? "云顶镇";

            var contract = Contract.CreateFragile(id, fromName, toName, fromCoord, toCoord, 120, 2);
            contract.Description = "【教程2】易碎包裹需要小心！逆风、山地和风暴都会造成损坏。";

            AllContracts.Add(contract);
            PendingContracts.Add(contract);
            return contract;
        }

        public Contract CreateTutorialContract3(HexGrid grid)
        {
            ContractCounter++;
            string id = $"TUT-0003";
            var fromCoord = AxialCoord.Zero;
            var toCoord = new AxialCoord(4, -1);
            string fromName = grid.GetCell(fromCoord)?.TownName ?? "邮局总站";
            string toName = grid.GetCell(toCoord)?.TownName ?? "风车村";

            var contract = Contract.CreateTimeSensitive(id, fromName, toName, fromCoord, toCoord, 150, 8);
            contract.Description = "【教程3】限时快递！必须在8回合内送达，否则全额赔偿。";

            AllContracts.Add(contract);
            PendingContracts.Add(contract);
            return contract;
        }

        public bool AcceptContract(string contractId)
        {
            var contract = PendingContracts.Find(c => c.Id == contractId);
            if (contract == null) return false;
            if (ActiveContracts.Count >= MaxActiveContracts) return false;

            PendingContracts.Remove(contract);
            ActiveContracts.Add(contract);
            contract.Status = ContractStatus.Accepted;
            return true;
        }

        public bool CancelContract(string contractId)
        {
            var contract = ActiveContracts.Find(c => c.Id == contractId);
            if (contract == null) return false;

            ActiveContracts.Remove(contract);
            PendingContracts.Add(contract);
            contract.Status = ContractStatus.Pending;
            return true;
        }

        public void MarkContractsInTransit()
        {
            foreach (var contract in ActiveContracts)
            {
                if (contract.Status == ContractStatus.Accepted)
                {
                    contract.Status = ContractStatus.InTransit;
                }
            }
        }

        public void AdvanceTurn()
        {
            foreach (var contract in ActiveContracts)
            {
                contract.AdvanceTurn();
            }

            var expired = ActiveContracts.Where(c => c.Status == ContractStatus.Expired).ToList();
            foreach (var c in expired)
            {
                ActiveContracts.Remove(c);
                FailedContracts.Add(c);
            }
        }

        public List<Contract> CheckPickups(AxialCoord position)
        {
            var result = new List<Contract>();
            foreach (var contract in ActiveContracts)
            {
                if (contract.Status == ContractStatus.Accepted && contract.FromCoord == position)
                {
                    contract.Status = ContractStatus.InTransit;
                    contract.AcceptTurn = contract.AcceptTurn == 0 ? 1 : contract.AcceptTurn;
                    result.Add(contract);
                }
            }
            return result;
        }

        public List<Contract> CheckDeliveries(AxialCoord position, int currentTurn)
        {
            var result = new List<Contract>();
            var toRemove = new List<Contract>();

            foreach (var contract in ActiveContracts)
            {
                if (contract.Status == ContractStatus.InTransit && contract.ToCoord == position)
                {
                    contract.Status = ContractStatus.Delivered;
                    contract.DeliverTurn = currentTurn;
                    result.Add(contract);
                    toRemove.Add(contract);
                }
            }

            foreach (var c in toRemove)
            {
                ActiveContracts.Remove(c);
                DeliveredContracts.Add(c);
            }

            return result;
        }

        public void ApplyDamage(int amount)
        {
            foreach (var contract in ActiveContracts)
            {
                if (contract.Status == ContractStatus.InTransit)
                {
                    contract.AddDamage(amount);
                }
            }
        }

        public SettlementReport GenerateSettlementReport(int turnsPlayed)
        {
            var report = new SettlementReport();

            foreach (var contract in DeliveredContracts)
            {
                int turnsTaken = (contract.DeliverTurn ?? turnsPlayed) - (contract.AcceptTurn);
                turnsTaken = Math.Max(1, turnsTaken);
                int reward = contract.CalculateReward(turnsTaken, contract.CurrentDamage);
                int penalty = contract.CalculatePenalty();

                bool onTime = contract.Type != ContractType.TimeSensitive || turnsTaken <= contract.MaxTurns;
                bool intact = contract.Type != ContractType.Fragile || contract.CurrentDamage < contract.FragilityLevel * 2;

                report.DeliveryRecords.Add(new DeliveryRecord
                {
                    ContractId = contract.Id,
                    RewardEarned = reward,
                    TurnsTaken = turnsTaken,
                    DamageTaken = contract.CurrentDamage,
                    OnTime = onTime,
                    Intact = intact,
                    Complaints = (!onTime ? 1 : 0) + (!intact ? 1 : 0)
                });

                report.TotalEarnings += reward;
                report.BaseContractValue += contract.BaseReward;
                report.DeliveredCount++;

                if (reward > contract.BaseReward)
                {
                    int bonus = reward - contract.BaseReward;
                    if (contract.Type == ContractType.TimeSensitive && onTime)
                    {
                        report.OnTimeBonus += bonus;
                        report.Highlights.Add($"准时投递 {contract.FromTown}→{contract.ToTown}: +{bonus}金");
                    }
                    else if (contract.Type == ContractType.Fragile && intact && contract.CurrentDamage == 0)
                    {
                        report.FragileBonus += bonus;
                        report.Highlights.Add($"完美无瑕 {contract.FromTown}→{contract.ToTown}: +{bonus}金");
                    }
                    else
                    {
                        report.PriorityBonus += bonus;
                    }
                }
                else if (reward < contract.BaseReward)
                {
                    int ded = contract.BaseReward - reward;
                    report.Deductions += ded;
                    if (!onTime)
                    {
                        report.LatePenalties += ded;
                        report.ComplaintCount++;
                        report.ComplaintDetails.Add($"{contract.Id} {contract.FromTown}→{contract.ToTown} 超时 {turnsTaken - contract.MaxTurns} 回合");
                    }
                    else if (!intact)
                    {
                        report.DamagePenalties += ded;
                        report.ComplaintCount++;
                        report.ComplaintDetails.Add($"{contract.Id} {contract.FromTown}→{contract.ToTown} 损坏度 {contract.CurrentDamage}");
                    }
                }
            }

            report.UndeliveredCount = ActiveContracts.Count;
            foreach (var c in ActiveContracts)
            {
                report.UndeliveredContractIds.Add(c.Id);
                if (c.Type == ContractType.TimeSensitive && c.TurnsRemaining <= 0)
                {
                    report.ExpiredCount++;
                    report.ComplaintCount++;
                    report.LatePenalties += c.BaseReward / 2;
                    report.Deductions += c.BaseReward / 2;
                    report.ComplaintDetails.Add($"{c.Id} {c.FromTown}→{c.ToTown} 合同作废");
                }
            }

            foreach (var c in FailedContracts)
            {
                report.ExpiredCount++;
                report.ComplaintCount++;
                int pen = c.BaseReward;
                report.LatePenalties += pen;
                report.Deductions += pen;
                report.ComplaintDetails.Add($"{c.Id} {c.FromTown}→{c.ToTown} 已过期");
            }

            report.TotalEarnings -= report.LatePenalties + report.DamagePenalties;
            report.FinalReputationChange = report.DeliveredCount * 5 - report.ComplaintCount * 10;
            report.FinalScore = report.TotalEarnings + report.DeliveredCount * 100 - report.ComplaintCount * 50;

            return report;
        }

        public List<Contract> GetSortedPending()
        {
            return PendingContracts
                .OrderByDescending(c => c.PriorityWeight)
                .ThenBy(c => c.Type)
                .ToList();
        }

        public List<Contract> GetSortedActive()
        {
            return ActiveContracts
                .OrderByDescending(c => c.PriorityWeight)
                .ThenBy(c => c.TurnsRemaining)
                .ToList();
        }
    }
}
