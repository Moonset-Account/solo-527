import { CircuitGraph } from './circuit';
import { CircuitComponent } from './components';
import { ComponentType, APP_CONFIG, BULB_RATED_VOLTAGE } from './config';

interface LoopInfo {
  battery: CircuitComponent;
  path: string[];
  components: CircuitComponent[];
}

export function findCompleteLoops(graph: CircuitGraph): LoopInfo[] {
  const loops: LoopInfo[] = [];
  const batteries: CircuitComponent[] = [];

  for (const [, comp] of graph.components) {
    if (comp.type === ComponentType.Battery) {
      batteries.push(comp);
    }
  }

  for (const battery of batteries) {
    const positivePin = 1;
    const negativePin = 0;

    const visited = new Set<string>();
    const queue: { compId: string; pinIndex: number; path: string[]; components: CircuitComponent[] }[] = [];

    const startConnected = graph.getConnectedPins(battery.id, positivePin);
    for (const conn of startConnected) {
      const key = `${conn.componentId}:${conn.pinIndex}`;
      visited.add(key);
      const comp = graph.components.get(conn.componentId);
      if (comp) {
        queue.push({
          compId: conn.componentId,
          pinIndex: conn.pinIndex,
          path: [battery.id, conn.componentId],
          components: [comp],
        });
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.compId === battery.id && current.pinIndex === negativePin) {
        loops.push({
          battery,
          path: current.path,
          components: current.components.filter(c => c.id !== battery.id),
        });
        continue;
      }

      const comp = graph.components.get(current.compId);
      if (!comp) continue;

      const otherPins: number[] = [];
      for (let i = 0; i < comp.pins.length; i++) {
        if (i !== current.pinIndex) {
          otherPins.push(i);
        }
      }

      for (const otherPin of otherPins) {
        const connected = graph.getConnectedPins(current.compId, otherPin);
        for (const conn of connected) {
          const key = `${conn.componentId}:${conn.pinIndex}`;
          if (visited.has(key)) continue;
          visited.add(key);

          const nextComp = graph.components.get(conn.componentId);
          const newComponents = nextComp && !current.components.includes(nextComp)
            ? [...current.components, nextComp]
            : current.components;

          queue.push({
            compId: conn.componentId,
            pinIndex: conn.pinIndex,
            path: [...current.path, conn.componentId],
            components: newComponents,
          });
        }
      }
    }
  }

  return loops;
}

function getResistance(comp: CircuitComponent): number {
  switch (comp.type) {
    case ComponentType.Resistor:
      return comp.value;
    case ComponentType.Bulb:
      return (BULB_RATED_VOLTAGE * BULB_RATED_VOLTAGE) / Math.max(comp.value || 1, 0.5);
    case ComponentType.Switch:
      return comp.state?.closed ? 0 : Infinity;
    case ComponentType.Capacitor:
      return 0;
    case ComponentType.Battery:
      return 0;
    default:
      return 0;
  }
}

export class Simulator {
  simulate(graph: CircuitGraph, dt: number): void {
    for (const [, comp] of graph.components) {
      switch (comp.type) {
        case ComponentType.Bulb:
          comp.state.brightness = 0;
          break;
        case ComponentType.Capacitor:
          if (!comp.state.charge || comp.state.charge <= 0) {
            comp.state.charge = 0;
          }
          break;
        case ComponentType.Switch:
          break;
        default:
          break;
      }
    }

    for (const [, wire] of graph.wires) {
      wire.current = 0;
    }

    const loops = findCompleteLoops(graph);

    for (const loop of loops) {
      let totalResistance = 0;
      let hasOpenSwitch = false;

      for (const comp of loop.components) {
        const r = getResistance(comp);
        if (r === Infinity) {
          hasOpenSwitch = true;
          break;
        }
        totalResistance += r;
      }

      if (hasOpenSwitch) continue;

      const voltage = loop.battery.value;

      let current: number;
      if (totalResistance < 0.01) {
        current = APP_CONFIG.SHORT_CIRCUIT_CURRENT;
      } else {
        current = voltage / totalResistance;
      }

      const hasLoad = loop.components.some(c => c.type === ComponentType.Bulb || c.type === ComponentType.Resistor);
      const isShortCircuit = !hasLoad && totalResistance < 1;

      for (const comp of loop.components) {
        switch (comp.type) {
          case ComponentType.Bulb: {
            const bulbR = getResistance(comp);
            const voltageAcross = current * bulbR;
            comp.state.brightness = Math.min(1, voltageAcross / BULB_RATED_VOLTAGE);
            if (isShortCircuit) {
              comp.state.brightness = 0;
            }
            break;
          }
          case ComponentType.Resistor: {
            const voltageAcross = current * comp.value;
            if (voltageAcross > BULB_RATED_VOLTAGE && loop.components.some(c => c.type === ComponentType.Bulb)) {
              // voltage divider effect handled by current calculation
            }
            break;
          }
          case ComponentType.Capacitor: {
            const seriesResistors = loop.components.filter(c => c.type === ComponentType.Resistor);
            const R = seriesResistors.length > 0
              ? seriesResistors.reduce((sum, c) => sum + c.value, 0)
              : 1;
            const C = comp.value;
            const tau = R * C * 0.001;

            if (current > 0.001) {
              comp.state.charge = Math.min(1, comp.state.charge + (1 - comp.state.charge) * dt / (tau > 0 ? tau : 1));
            } else {
              comp.state.charge *= Math.exp(-dt / (tau > 0 ? tau : 1));
            }
            break;
          }
        }
      }

      for (const [, wire] of graph.wires) {
        const inLoop =
          loop.path.includes(wire.startPin.componentId) &&
          loop.path.includes(wire.endPin.componentId);
        if (inLoop) {
          wire.current = Math.max(wire.current, current);
        }
      }
    }
  }
}
