using System;
using System.Collections.Generic;
using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Ingredients;
using KitchenChaos.Players;
using KitchenChaos.OrderSystem;

namespace KitchenChaos.Stations
{
    public class DeliveryStation : BaseStation
    {
        protected override bool HandleInteract(PlayerController player)
        {
            if (!player.HasItem) return false;
            return TryDeliver(player, player.Carrying);
        }

        public bool TryDeliver(PlayerController player, IngredientItem item)
        {
            if (item == null) return false;
            var orderMgr = ServiceLocator.Get<OrderManager>();
            var scoreMgr = ServiceLocator.Get<ScoreManager>();
            if (orderMgr == null || scoreMgr == null) return false;

            var combined = CollectCombinedItems(player, item);

            var result = orderMgr.TryMatchAndComplete(combined, out var order, out var matched);

            if (result == DeliveryMatchResult.Success)
            {
                var scoreGained = scoreMgr.OnOrderDelivered(order, matched, player.PlayerId);
                DestroyConsumed(combined, item, player);
                EventBus.Raise(new OrderDeliveredEvent
                {
                    OrderId = order.Id,
                    ScoreGained = scoreGained,
                    ComboCount = scoreMgr.CurrentCombo,
                    Perfect = matched.PerfectTiming
                });
                return true;
            }

            if (result == DeliveryMatchResult.Wrong)
            {
                scoreMgr.OnWrongDelivery();
                DestroyConsumed(combined, item, player);
                return true;
            }

            return false;
        }

        List<IngredientItem> CollectCombinedItems(PlayerController player, IngredientItem carried)
        {
            var list = new List<IngredientItem>();
            var plateStation = FindObjectsOfType<PlateStation>();
            foreach (var ps in plateStation)
            {
                if (ps.PeekCombined() == carried || ps.CombinedItems.Count == 0) continue;
            }
            list.Add(carried);
            return list;
        }

        void DestroyConsumed(List<IngredientItem> combined, IngredientItem carried, PlayerController player)
        {
            player.ReleaseCarrying();
            if (carried != null) Destroy(carried.gameObject);
            foreach (var ps in FindObjectsOfType<PlateStation>())
                if (ps.HasItem) { ps.ConsumePlate(); break; }
        }
    }
}
