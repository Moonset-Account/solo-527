import { ChevronRight, ChevronLeft, Clock, Package, Truck } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { ORDER_TEMPLATES } from "@/config/orders";
import { soundManager } from "@/game/sound";
import type { OrderDifficulty, ActiveOrder } from "@/game/types";

const DIFFICULTY_COLORS: Record<OrderDifficulty, string> = {
  easy: "border-factory-green bg-factory-green/10",
  normal: "border-factory-gold bg-factory-gold/10",
  hard: "border-factory-accent bg-factory-accent/10",
  elite: "border-factory-red bg-factory-red/10",
};

const DIFFICULTY_LABELS: Record<OrderDifficulty, string> = {
  easy: "简单",
  normal: "普通",
  hard: "困难",
  elite: "精英",
};

const DIFFICULTY_BADGE_COLORS: Record<OrderDifficulty, string> = {
  easy: "bg-factory-green text-factory-cream",
  normal: "bg-factory-gold text-factory-dark",
  hard: "bg-factory-accent text-factory-cream",
  elite: "bg-factory-red text-factory-cream",
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getOrderInfo(order: ActiveOrder) {
  return ORDER_TEMPLATES.find((t) => t.id === order.templateId);
}

export default function OrderPanel() {
  const orderPanelOpen = useUIStore((s) => s.orderPanelOpen);
  const toggleOrderPanel = useUIStore((s) => s.toggleOrderPanel);
  const activeOrders = useGameStore((s) => s.activeOrders);
  const availableOrders = useGameStore((s) => s.availableOrders);
  const acceptOrder = useGameStore((s) => s.acceptOrder);
  const deliverOrder = useGameStore((s) => s.deliverOrder);

  return (
    <div className="flex h-full">
      <button
        className="flex-shrink-0 w-6 bg-factory-panel border-y-2 border-l-2 border-factory-border
                   flex items-center justify-center cursor-pointer hover:bg-factory-accent/20 transition-colors"
        onClick={toggleOrderPanel}
      >
        {orderPanelOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {orderPanelOpen && (
        <div className="w-64 industrial-panel overflow-y-auto flex flex-col gap-2 p-2"
             style={{ borderRadius: 0 }}>
          <h3 className="font-pixel text-[10px] text-factory-cream text-center py-1">
            订单面板
          </h3>

          {availableOrders.length > 0 && (
            <div>
              <h4 className="font-terminal text-sm text-factory-cream/70 mb-1 border-b border-factory-border pb-1">
                可接订单
              </h4>
              <div className="flex flex-col gap-2">
                {availableOrders.map((order) => {
                  const info = getOrderInfo(order);
                  if (!info) return null;
                  return (
                    <div
                      key={order.id}
                      className={`note-card border-2 ${DIFFICULTY_COLORS[info.difficulty]}`}
                      style={{ transform: `rotate(${(Math.random() - 0.5) * 2}deg)` }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-terminal text-sm font-bold">{info.name}</span>
                        <span className={`px-1 py-0.5 text-xs font-terminal ${DIFFICULTY_BADGE_COLORS[info.difficulty]}`}>
                          {DIFFICULTY_LABELS[info.difficulty]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-terminal">
                        <span className="flex items-center gap-1">
                          <Package size={12} /> {order.required}件
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {formatTime(info.timeLimit)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-terminal text-factory-gold">⬡{info.coinReward}</span>
                        <button
                          className="rivet-btn-primary px-2 py-0.5 text-xs"
                          onClick={() => { soundManager.play("click"); acceptOrder(order.id); }}
                        >
                          接受
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeOrders.length > 0 && (
            <div>
              <h4 className="font-terminal text-sm text-factory-cream/70 mb-1 border-b border-factory-border pb-1">
                进行中
              </h4>
              <div className="flex flex-col gap-2">
                {activeOrders.map((order) => {
                  const info = getOrderInfo(order);
                  if (!info) return null;
                  const canDeliver = order.delivered >= order.required;
                  const isUrgent = order.timeRemaining < 30;
                  return (
                    <div
                      key={order.id}
                      className={`note-card border-2 ${DIFFICULTY_COLORS[info.difficulty]} ${canDeliver ? "animate-stampIn" : ""}`}
                      style={{ transform: `rotate(${(Math.random() - 0.5) * 1.5}deg)` }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-terminal text-sm font-bold">{info.name}</span>
                        <span className={`px-1 py-0.5 text-xs font-terminal ${DIFFICULTY_BADGE_COLORS[info.difficulty]}`}>
                          {DIFFICULTY_LABELS[info.difficulty]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-terminal mb-1">
                        <span className="flex items-center gap-1">
                          <Package size={12} /> {order.delivered}/{order.required}
                        </span>
                        <span className={`flex items-center gap-1 ${isUrgent ? "text-factory-red animate-pulseBottleneck" : ""}`}>
                          <Clock size={12} /> {formatTime(order.timeRemaining)}
                        </span>
                      </div>
                      <div className="w-full bg-factory-dark h-1.5 mb-1">
                        <div
                          className="h-full bg-factory-green transition-all"
                          style={{ width: `${Math.min(100, (order.delivered / order.required) * 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-terminal text-factory-gold">⬡{info.coinReward}</span>
                        {canDeliver ? (
                          <button
                            className="rivet-btn-gold px-2 py-0.5 text-xs"
                            onClick={() => { soundManager.play("order_complete"); deliverOrder(order.id); }}
                          >
                            <Truck size={12} className="inline mr-1" />
                            交付
                          </button>
                        ) : (
                          <span className="text-xs font-terminal text-factory-cream/50">
                            生产中...
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {availableOrders.length === 0 && activeOrders.length === 0 && (
            <div className="text-center font-terminal text-factory-cream/50 py-4">
              暂无订单
            </div>
          )}
        </div>
      )}
    </div>
  );
}
