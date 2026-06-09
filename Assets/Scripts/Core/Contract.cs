using System;
using System.Collections.Generic;

namespace BalloonPost.Core
{
    public enum ContractType
    {
        Normal,
        Fragile,
        TimeSensitive
    }

    public enum ContractStatus
    {
        Pending,
        Accepted,
        InTransit,
        Delivered,
        Expired,
        Cancelled
    }

    [Serializable]
    public class Contract : IEquatable<Contract>
    {
        public string Id;
        public ContractType Type;
        public ContractStatus Status;
        public string FromTown;
        public string ToTown;
        public AxialCoord FromCoord;
        public AxialCoord ToCoord;
        public int BaseReward;
        public int PriorityWeight;
        public int MaxTurns;
        public int TurnsRemaining;
        public int FragilityLevel;
        public string Description;
        public int AcceptTurn;
        public int? DeliverTurn;
        public int CurrentDamage;

        public Contract() { }

        public static Contract CreateNormal(string id, string from, string to, AxialCoord fromCoord, AxialCoord toCoord, int reward)
        {
            return new Contract
            {
                Id = id,
                Type = ContractType.Normal,
                Status = ContractStatus.Pending,
                FromTown = from,
                ToTown = to,
                FromCoord = fromCoord,
                ToCoord = toCoord,
                BaseReward = reward,
                PriorityWeight = 1,
                MaxTurns = int.MaxValue,
                TurnsRemaining = int.MaxValue,
                FragilityLevel = 0,
                Description = $"普通邮件：{from} → {to}"
            };
        }

        public static Contract CreateFragile(string id, string from, string to, AxialCoord fromCoord, AxialCoord toCoord, int reward, int fragility = 2)
        {
            return new Contract
            {
                Id = id,
                Type = ContractType.Fragile,
                Status = ContractStatus.Pending,
                FromTown = from,
                ToTown = to,
                FromCoord = fromCoord,
                ToCoord = toCoord,
                BaseReward = reward,
                PriorityWeight = 2,
                MaxTurns = int.MaxValue,
                TurnsRemaining = int.MaxValue,
                FragilityLevel = fragility,
                Description = $"易碎包裹：{from} → {to} (等级{fragility})"
            };
        }

        public static Contract CreateTimeSensitive(string id, string from, string to, AxialCoord fromCoord, AxialCoord toCoord, int reward, int maxTurns)
        {
            return new Contract
            {
                Id = id,
                Type = ContractType.TimeSensitive,
                Status = ContractStatus.Pending,
                FromTown = from,
                ToTown = to,
                FromCoord = fromCoord,
                ToCoord = toCoord,
                BaseReward = reward,
                PriorityWeight = 3,
                MaxTurns = maxTurns,
                TurnsRemaining = maxTurns,
                FragilityLevel = 0,
                Description = $"限时快递：{from} → {to} ({maxTurns}回合内送达)"
            };
        }

        public int CalculateReward(int turnsTaken, int damage)
        {
            int reward = BaseReward;

            if (Type == ContractType.TimeSensitive)
            {
                int lateTurns = turnsTaken - MaxTurns;
                if (lateTurns > 0)
                {
                    reward = Math.Max(0, reward - lateTurns * BaseReward / 4);
                }
                else if (turnsTaken <= MaxTurns * 3 / 4)
                {
                    reward += BaseReward / 4;
                }
            }

            if (Type == ContractType.Fragile)
            {
                if (damage >= FragilityLevel * 2)
                {
                    reward = 0;
                }
                else if (damage > 0)
                {
                    reward = Math.Max(0, reward - damage * BaseReward / (FragilityLevel * 2));
                }
                else
                {
                    reward += BaseReward / 5;
                }
            }

            if (Type == ContractType.Normal && turnsTaken <= FromCoord.DistanceTo(ToCoord) * 2)
            {
                reward += BaseReward / 10;
            }

            return reward;
        }

        public int CalculatePenalty()
        {
            if (Type == ContractType.TimeSensitive && TurnsRemaining <= 0)
            {
                return BaseReward;
            }
            if (Type == ContractType.Fragile && CurrentDamage >= FragilityLevel * 3)
            {
                return BaseReward / 2;
            }
            return 0;
        }

        public void AdvanceTurn()
        {
            if (Status == ContractStatus.InTransit && TurnsRemaining != int.MaxValue)
            {
                TurnsRemaining--;
                if (TurnsRemaining <= 0)
                {
                    Status = ContractStatus.Expired;
                }
            }
        }

        public void AddDamage(int amount)
        {
            if (Type == ContractType.Fragile)
            {
                CurrentDamage += amount;
            }
        }

        public bool Equals(Contract other)
        {
            return other != null && Id == other.Id;
        }

        public override bool Equals(object obj)
        {
            return obj is Contract other && Equals(other);
        }

        public override int GetHashCode()
        {
            return Id?.GetHashCode() ?? 0;
        }
    }
}
