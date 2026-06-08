using UnityEngine;
using System;
using System.Collections;

namespace DecorMatch3
{
    public class DecorationResult
    {
        public float TotalScore;
        public float StyleScore;
        public float ColorScore;
        public float FulfillmentScore;
        public float BudgetScore;
        public int Stars;
        public string Feedback;
        public CustomerData Customer;
    }

    public class DecorationEvaluator : MonoBehaviour
    {
        private Room _currentRoom;
        private CustomerOrder _currentOrder;
        private FurnitureCatalog _catalog;

        public event Action<DecorationResult> OnEvaluationComplete;

        public void StartEvaluation(Room room, CustomerOrder order, FurnitureCatalog catalog)
        {
            _currentRoom = room;
            _currentOrder = order;
            _catalog = catalog;
        }

        public DecorationResult Evaluate()
        {
            if (_currentRoom == null || _currentOrder == null || _catalog == null) return null;
            float styleScore = CustomerPreference.EvaluateStyleMatch(_currentRoom, _currentOrder, _catalog);
            float colorScore = CustomerPreference.EvaluateColorMatch(_currentRoom, _currentOrder);
            float fulfillScore = CustomerPreference.EvaluateFulfillment(_currentRoom, _currentOrder);
            float budgetScore = CustomerPreference.EvaluateBudget(_currentRoom, _currentOrder, _catalog);
            float totalScore = Mathf.Clamp(styleScore + colorScore + fulfillScore + budgetScore, 0f, 100f);
            int stars = CustomerPreference.ScoreToStars(totalScore);
            string feedback = CustomerPreference.GenerateFeedback(styleScore, colorScore, fulfillScore, budgetScore);
            var result = new DecorationResult
            {
                TotalScore = totalScore,
                StyleScore = styleScore,
                ColorScore = colorScore,
                FulfillmentScore = fulfillScore,
                BudgetScore = budgetScore,
                Stars = stars,
                Feedback = feedback,
                Customer = _currentOrder.Customer
            };
            return result;
        }

        public void PlayEvaluationAnimation()
        {
            StartCoroutine(EvaluationAnimationCoroutine());
        }

        private IEnumerator EvaluationAnimationCoroutine()
        {
            var result = Evaluate();
            if (result == null) yield break;
            yield return new WaitForSeconds(0.5f);
            yield return new WaitForSeconds(0.5f);
            yield return new WaitForSeconds(0.5f);
            yield return new WaitForSeconds(0.5f);
            yield return new WaitForSeconds(0.5f);
            GameEvents.TriggerCustomerScored(_currentOrder.Customer.customerId, result.TotalScore);
            if (OnEvaluationComplete != null)
            {
                OnEvaluationComplete(result);
            }
        }
    }
}
