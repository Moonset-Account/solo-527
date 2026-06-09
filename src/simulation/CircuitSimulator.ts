import {
  CircuitGraph,
  SimState,
  SimError,
  NodeId,
  ComponentId,
  BaseComponent,
  Loop,
} from './types';
import { buildNodeGroups } from './NodeSolver';
import { findClosedLoops } from './LoopAnalyzer';

const SHORT_CIRCUIT_RESISTANCE_THRESHOLD = 0.05;
const OVERLOAD_CURRENT_THRESHOLD = 50;

export class CircuitSimulator {
  private time: number = 0;
  private running: boolean = true;

  constructor() {}

  step(dt: number, graph: CircuitGraph): SimState {
    if (!this.running) {
      return this.buildInitialState(graph);
    }

    this.time += dt;
    const errors: SimError[] = [];

    const nodeGroups = buildNodeGroups(graph);
    const loops = findClosedLoops(graph, nodeGroups);

    const nodeVoltages = new Map<NodeId, number>();
    const componentStates = new Map<ComponentId, Record<string, number | boolean>>();

    for (const comp of graph.components.values()) {
      componentStates.set(comp.id, { ...comp.state });
    }

    const batteries: BaseComponent[] = [];
    for (const comp of graph.components.values()) {
      if (comp.type === 'battery') batteries.push(comp);
    }

    if (batteries.length === 0) {
      errors.push({
        type: 'no_power',
        severity: 'warn',
        message: '电路中未检测到电源（电池）',
        relatedIds: [],
      });
    }

    if (loops.length === 0 && batteries.length > 0) {
      errors.push({
        type: 'no_power',
        severity: 'warn',
        message: '电路未形成闭合回路',
        relatedIds: batteries.map(b => b.id),
      });
    }

    const componentCurrentMap = new Map<ComponentId, number>();
    const loopVoltageMap = new Map<string, number>();

    for (const loop of loops) {
      let batteryVoltage = 0;
      const batteryIds: ComponentId[] = [];

      for (const compId of loop.pathComponents) {
        const comp = graph.components.get(compId);
        if (!comp) continue;
        if (comp.type === 'battery') {
          batteryVoltage += (comp.params.voltage as number) || 1.5;
          batteryIds.push(comp.id);
        }
      }

      const loopKey = loop.pathComponents.sort().join('|');

      if (loop.totalResistance < SHORT_CIRCUIT_RESISTANCE_THRESHOLD && batteryVoltage > 0) {
        errors.push({
          type: 'short_circuit',
          severity: 'error',
          message: `检测到短路！总电阻 ${loop.totalResistance.toFixed(4)}Ω 过低`,
          relatedIds: [...batteryIds, ...loop.pathComponents.filter(id => !batteryIds.includes(id))],
        });
        const shortCurrent = batteryVoltage / SHORT_CIRCUIT_RESISTANCE_THRESHOLD;
        loopVoltageMap.set(loopKey, batteryVoltage);
        for (const compId of loop.pathComponents) {
          const prev = componentCurrentMap.get(compId) || 0;
          componentCurrentMap.set(compId, prev + shortCurrent);
        }
        continue;
      }

      if (loop.totalResistance === Infinity || loop.totalResistance <= 0) {
        continue;
      }

      const current = batteryVoltage / loop.totalResistance;
      loopVoltageMap.set(loopKey, batteryVoltage);

      if (current > OVERLOAD_CURRENT_THRESHOLD) {
        errors.push({
          type: 'overload',
          severity: 'error',
          message: `电流过载！回路电流 ${current.toFixed(2)}A 超过安全阈值`,
          relatedIds: batteryIds,
        });
      }

      for (const compId of loop.pathComponents) {
        const prev = componentCurrentMap.get(compId) || 0;
        componentCurrentMap.set(compId, prev + current);
      }
    }

    for (const comp of graph.components.values()) {
      const state = componentStates.get(comp.id) || {};
      const current = componentCurrentMap.get(comp.id) || 0;

      switch (comp.type) {
        case 'bulb': {
          const resistance = (comp.params.resistance as number) || 10;
          const power = current * current * resistance;
          const maxPower = (comp.params.maxPower as number) || 10;
          const brightness = Math.min(1, power / maxPower);
          state.brightness = brightness;
          state.current = current;
          state.power = power;
          break;
        }
        case 'resistor': {
          const resistance = (comp.params.resistance as number) || 0;
          state.voltage = current * resistance;
          state.current = current;
          state.power = current * state.voltage;
          break;
        }
        case 'battery': {
          state.current = current;
          state.voltage = comp.params.voltage as number;
          break;
        }
        case 'capacitor': {
          const capacitance = (comp.params.capacitance as number) || 0.001;
          const capacity = (comp.params.capacity as number) || 100;
          const resistance = (comp.params.chargeResistance as number) || 100;
          const targetVoltage = Math.abs(current) * resistance;
          const charge = state.charge as number || 0;
          const currentVoltage = (charge / capacity) * (comp.params.maxVoltage as number || 5);
          const tau = resistance * capacitance;
          const newVoltage = currentVoltage + (targetVoltage - currentVoltage) * (1 - Math.exp(-dt / tau));
          const newCharge = Math.min(capacity, (newVoltage / (comp.params.maxVoltage as number || 5)) * capacity);
          state.charge = newCharge;
          state.voltage = newVoltage;
          state.current = current;
          break;
        }
        case 'switch': {
          state.current = current;
          break;
        }
        case 'wire_joint': {
          state.current = current;
          break;
        }
      }

      componentStates.set(comp.id, state);
    }

    const groupToVoltage = new Map<NodeId, number>();
    for (const battery of batteries) {
      if (battery.pins.length < 2) continue;
      const posPin = battery.pins[0];
      const negPin = battery.pins[1];
      const posGroup = nodeGroups.get(posPin.nodeId);
      const negGroup = nodeGroups.get(negPin.nodeId);
      if (posGroup && negGroup) {
        const bv = (battery.params.voltage as number) || 1.5;
        if (!groupToVoltage.has(negGroup) || groupToVoltage.get(negGroup)! > 0) {
          groupToVoltage.set(negGroup, 0);
        }
        const negV = groupToVoltage.get(negGroup) || 0;
        groupToVoltage.set(posGroup, negV + bv);
      }
    }

    for (const [nodeId, groupId] of nodeGroups.entries()) {
      const v = groupToVoltage.get(groupId);
      nodeVoltages.set(nodeId, v !== undefined ? v : 0);
    }

    for (const nodeId of graph.nodes.keys()) {
      if (!nodeVoltages.has(nodeId)) {
        nodeVoltages.set(nodeId, 0);
      }
    }

    return {
      running: this.running,
      time: this.time,
      nodeVoltages,
      componentStates,
      errors,
    };
  }

  reset(): void {
    this.time = 0;
    this.running = true;
  }

  setRunning(running: boolean): void {
    this.running = running;
  }

  private buildInitialState(graph: CircuitGraph): SimState {
    const nodeVoltages = new Map<NodeId, number>();
    const componentStates = new Map<ComponentId, Record<string, number | boolean>>();

    for (const nodeId of graph.nodes.keys()) {
      nodeVoltages.set(nodeId, 0);
    }

    for (const comp of graph.components.values()) {
      componentStates.set(comp.id, { ...comp.state });
    }

    return {
      running: this.running,
      time: this.time,
      nodeVoltages,
      componentStates,
      errors: [],
    };
  }
}
