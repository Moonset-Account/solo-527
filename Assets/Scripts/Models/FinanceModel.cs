using System;
using System.Collections.Generic;

namespace YouthTrainingManagement.Models
{
    [Serializable]
    public class FinancialTransaction
    {
        public string Id;
        public DateTime TransactionDate;
        public string Description;
        public float Amount;
        public TransactionCategory Category;
        public bool IsIncome;
        public string RelatedMatchId;
        public string RelatedPlayerId;
    }

    [Serializable]
    public enum TransactionCategory
    {
        TicketSales,
        PrizeMoney,
        Sponsorship,
        Merchandise,
        Wages,
        TrainingCosts,
        MedicalCosts,
        FacilityRent,
        TransferFees,
        Other
    }

    [Serializable]
    public class FinanceModel
    {
        public float CurrentBalance;
        public float WeeklyBudget;
        public float WeeklyWages;
        public float WeeklyFacilityCosts;
        public float WeeklyMedicalBudget;
        public float WeeklyTrainingBudget;
        public float SponsorshipIncomePerWeek;
        public List<FinancialTransaction> TransactionHistory = new List<FinancialTransaction>();
        public int WeekOfLastSettlement;

        public float ProjectedWeeklyIncome => SponsorshipIncomePerWeek;
        public float ProjectedWeeklyExpenditure => WeeklyWages + WeeklyFacilityCosts;
        public float ProjectedWeeklyProfit => ProjectedWeeklyIncome - ProjectedWeeklyExpenditure;

        public bool CanAffordTraining(float cost)
        {
            return CurrentBalance >= cost;
        }

        public void AddTransaction(string description, float amount, TransactionCategory category,
            bool isIncome, string matchId = null, string playerId = null)
        {
            var transaction = new FinancialTransaction
            {
                Id = Guid.NewGuid().ToString(),
                TransactionDate = DateTime.Now,
                Description = description,
                Amount = amount,
                Category = category,
                IsIncome = isIncome,
                RelatedMatchId = matchId,
                RelatedPlayerId = playerId
            };
            TransactionHistory.Add(transaction);

            if (isIncome)
                CurrentBalance += amount;
            else
                CurrentBalance -= amount;
        }

        public void ProcessWeeklySettlement(int currentWeek)
        {
            if (WeekOfLastSettlement == currentWeek) return;

            AddTransaction("Weekly Sponsorship", SponsorshipIncomePerWeek,
                TransactionCategory.Sponsorship, true);

            AddTransaction("Player Wages", WeeklyWages,
                TransactionCategory.Wages, false);

            AddTransaction("Facility Rental", WeeklyFacilityCosts,
                TransactionCategory.FacilityRent, false);

            WeekOfLastSettlement = currentWeek;
        }

        public List<FinancialTransaction> GetTransactionsForWeek(int weekNumber)
        {
            var result = new List<FinancialTransaction>();
            foreach (var tx in TransactionHistory)
            {
                result.Add(tx);
            }
            return result;
        }

        public float GetTotalIncome()
        {
            float total = 0;
            foreach (var tx in TransactionHistory)
            {
                if (tx.IsIncome) total += tx.Amount;
            }
            return total;
        }

        public float GetTotalExpenditure()
        {
            float total = 0;
            foreach (var tx in TransactionHistory)
            {
                if (!tx.IsIncome) total += tx.Amount;
            }
            return total;
        }
    }
}
