using System;
using System.Collections.Generic;
using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Core.Abstractions;
using KitchenChaos.Ingredients;

namespace KitchenChaos.Stations
{
    public class DeliveryStation : BaseStation
    {
        protected override bool HandleInteract(IPlayer player)
        {
            if (!PlayerHasIngredient(player)) return false;
            return TryDeliver(player, PlayerCarryAsIngredient(player));
        }

        public bool TryDeliver(IPlayer player, IngredientItem item)
        {
            if (item == null) return false;
            var om = FindObjectOfType<OrderSystem.OrderManager>();
            var sm = FindObjectOfType<Scoring.ScoreManager>();
            if (om == null || sm == null) return false;

            var combined = CollectCombinedItems(item);
            var result = om.TryMatchAndComplete(combined, out var order, out var matched);

            if (result == OrderSystem.DeliveryMatchResult.Success)
            {
                var delta = sm.OnOrderDelivered(order, matched, player.PlayerId);
                DestroyConsumed(combined, item, player);
                EventBus.Raise(new OrderDeliveredEvent
                {
                    OrderId = order.Id,
                    ScoreGained = delta,
                    ComboCount = sm.CurrentCombo,
                    Perfect = matched.PerfectTiming
                });
                return true;
            }

            if (result == OrderSystem.DeliveryMatchResult.Wrong)
            {
                sm.OnWrongDelivery();
                DestroyConsumed(combined, item, player);
                return true;
            }

            return false;
        }

        List<IngredientItem> CollectCombinedItems(IngredientItem carried)
        {
            var list = new List<IngredientItem> { carried };
            foreach (var ps in FindObjectsOfType<PlateStation>())
            {
                foreach (var c in ps.CombinedItems) list.Add(c);
            }
            return list;
        }

        static void DestroyConsumed(List<IngredientItem> combined, IngredientItem carried, IPlayer player)
        {
            player.ReleaseCarryingRaw();
            if (carried != null) Destroy(carried.gameObject);
            foreach (var ps in FindObjectsOfType<PlateStation>())
                if (ps.HasItem) { ps.ConsumePlate(); break; }
        }
    }
}
