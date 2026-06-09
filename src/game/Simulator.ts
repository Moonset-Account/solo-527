import {
  ComponentInstance,
  ComponentState,
  SimulationResult,
  WireInstance,
} from './types';

class UnionFind {
  private parent: Map<string, string>;
  private rank: Map<string, number>;

  constructor() {
    this.parent = new Map();
    this.rank = new Map();
  }

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
      return x;
    }
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)!));
    }
    return this.parent.get(x)!;
  }

  union(x: string, y: string): void {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return;

    const rankX = this.rank.get(rootX) || 0;
    const rankY = this.rank.get(rootY) || 0;

    if (rankX < rankY) {
      this.parent.set(rootX, rootY);
    } else if (rankX > rankY) {
      this.parent.set(rootY, rootX);
    } else {
      this.parent.set(rootY, rootX);
      this.rank.set(rootX, rankX + 1);
    }
  }

  connected(x: string, y: string): boolean {
    return this.find(x) === this.find(y);
  }
}

function getPortId(componentId: string, portIndex: number): string {
  return `${componentId}:${portIndex}`;
}

const ITERATIONS = 5;

export class Simulator {
  solve(
    components: ComponentInstance[],
    wires: WireInstance[]
  ): SimulationResult {
    const emptyResult: SimulationResult = {
      hasShortCircuit: false,
      nodeVoltages: {},
      wireCurrents: {},
      componentStates: {},
    };

    components.forEach((c) => {
      emptyResult.componentStates[c.id] = {
        voltage: 0,
        current: 0,
        power: 0,
        lit: c.type === 'bulb' ? false : undefined,
        closed: c.type === 'switch' ? (c.properties as { closed: boolean }).closed : undefined,
      };
    });

    const batteries = components.filter((c) => c.type === 'battery');
    if (batteries.length === 0) {
      return emptyResult;
    }

    const uf = new UnionFind();

    components.forEach((c) => {
      uf.find(getPortId(c.id, 0));
      uf.find(getPortId(c.id, 1));
    });

    wires.forEach((w) => {
      uf.union(w.fromPortId, w.toPortId);
    });

    const switchComponents = components.filter((c) => c.type === 'switch');
    switchComponents.forEach((sw) => {
      if ((sw.properties as { closed: boolean }).closed) {
        uf.union(getPortId(sw.id, 0), getPortId(sw.id, 1));
      }
    });

    let hasShortCircuit = false;
    const shortCircuitWires: string[] = [];

    for (const battery of batteries) {
      const port0 = getPortId(battery.id, 0);
      const port1 = getPortId(battery.id, 1);
      if (uf.connected(port0, port1)) {
        hasShortCircuit = true;
        shortCircuitWires.push(battery.id);
        break;
      }
    }

    const nodeToGroup: Map<string, string> = new Map();
    const groupToPorts: Map<string, string[]> = new Map();

    components.forEach((c) => {
      for (let i = 0; i < 2; i++) {
        const portId = getPortId(c.id, i);
        const root = uf.find(portId);
        nodeToGroup.set(portId, root);
        if (!groupToPorts.has(root)) {
          groupToPorts.set(root, []);
        }
        groupToPorts.get(root)!.push(portId);
      }
    });

    const allGroups = Array.from(groupToPorts.keys());
    const groupVoltages: Map<string, number> = new Map();

    const refBattery = batteries[0];
    const refNegPort = getPortId(refBattery.id, 0);
    const refPosPort = getPortId(refBattery.id, 1);
    const refNegGroup = uf.find(refNegPort);
    const refPosGroup = uf.find(refPosPort);

    groupVoltages.set(refNegGroup, 0);
    groupVoltages.set(
      refPosGroup,
      (refBattery.properties as { voltage: number }).voltage || 9
    );

    allGroups.forEach((g) => {
      if (!groupVoltages.has(g)) {
        groupVoltages.set(g, 0);
      }
    });

    const resistiveComponents: ComponentInstance[] = [];
    components.forEach((c) => {
      if (c.type === 'resistor' || c.type === 'bulb') {
        resistiveComponents.push(c);
      } else if (c.type === 'switch' && (c.properties as { closed: boolean }).closed) {
        resistiveComponents.push(c);
      }
    });

    for (let iter = 0; iter < ITERATIONS; iter++) {
      const newVoltages = new Map(groupVoltages);

      const groupCurrentSum: Map<string, number> = new Map();
      const groupConductanceSum: Map<string, number> = new Map();

      allGroups.forEach((g) => {
        groupCurrentSum.set(g, 0);
        groupConductanceSum.set(g, 0);
      });

      resistiveComponents.forEach((comp) => {
        const port0 = getPortId(comp.id, 0);
        const port1 = getPortId(comp.id, 1);
        const group0 = nodeToGroup.get(port0)!;
        const group1 = nodeToGroup.get(port1)!;

        if (group0 === group1) return;

        let resistance: number;
        if (comp.type === 'switch') {
          resistance = 0.001;
        } else {
          resistance = (comp.properties as { resistance?: number })
            .resistance || 100;
        }
        const conductance = 1 / resistance;

        const v0 = groupVoltages.get(group0) || 0;
        const v1 = groupVoltages.get(group1) || 0;

        groupCurrentSum.set(
          group0,
          (groupCurrentSum.get(group0) || 0) + v1 * conductance
        );
        groupConductanceSum.set(
          group0,
          (groupConductanceSum.get(group0) || 0) + conductance
        );

        groupCurrentSum.set(
          group1,
          (groupCurrentSum.get(group1) || 0) + v0 * conductance
        );
        groupConductanceSum.set(
          group1,
          (groupConductanceSum.get(group1) || 0) + conductance
        );
      });

      batteries.forEach((batt) => {
        const negPort = getPortId(batt.id, 0);
        const posPort = getPortId(batt.id, 1);
        const negGroup = nodeToGroup.get(negPort)!;
        const posGroup = nodeToGroup.get(posPort)!;
        const voltage = (batt.properties as { voltage?: number }).voltage || 9;

        if (batt.id === refBattery.id) {
          newVoltages.set(negGroup, 0);
          newVoltages.set(posGroup, voltage);
        } else {
          newVoltages.set(posGroup, (newVoltages.get(negGroup) || 0) + voltage);
        }
      });

      allGroups.forEach((g) => {
        if (g === refNegGroup || g === refPosGroup) return;

        let isFixed = false;
        for (const batt of batteries) {
          const negGroup = nodeToGroup.get(getPortId(batt.id, 0));
          const posGroup = nodeToGroup.get(getPortId(batt.id, 1));
          if (g === negGroup || g === posGroup) {
            isFixed = true;
            break;
          }
        }
        if (isFixed) return;

        const totalCond = groupConductanceSum.get(g) || 0;
        const totalCurr = groupCurrentSum.get(g) || 0;

        if (totalCond > 0) {
          const oldV = groupVoltages.get(g) || 0;
          const newV = totalCurr / totalCond;
          newVoltages.set(g, oldV * 0.3 + newV * 0.7);
        }
      });

      groupVoltages.clear();
      newVoltages.forEach((v, k) => groupVoltages.set(k, v));
    }

    const resultComponentStates: Record<string, ComponentState> = {};

    components.forEach((comp) => {
      const port0 = getPortId(comp.id, 0);
      const port1 = getPortId(comp.id, 1);
      const group0 = nodeToGroup.get(port0)!;
      const group1 = nodeToGroup.get(port1)!;

      const v0 = groupVoltages.get(group0) || 0;
      const v1 = groupVoltages.get(group1) || 0;
      const voltage = Math.abs(v1 - v0);

      let current = 0;
      let power = 0;
      let lit: boolean | undefined;
      let closed: boolean | undefined;

      switch (comp.type) {
        case 'resistor':
        case 'bulb': {
          const props = comp.properties as { resistance?: number };
          const r = props.resistance || 100;
          if (r > 0) {
            current = voltage / r;
            power = voltage * current;
          }
          if (comp.type === 'bulb') {
            const bulbProps = comp.properties as {
              thresholdPower?: number;
            };
            const threshold = bulbProps.thresholdPower || 0.5;
            lit = power >= threshold && !hasShortCircuit;
          }
          break;
        }
        case 'battery': {
          power = 0;
          break;
        }
        case 'switch': {
          closed = (comp.properties as { closed: boolean }).closed;
          if (closed) {
            current = voltage / 0.001;
            power = voltage * current;
          }
          break;
        }
        case 'capacitor': {
          current = 0;
          power = 0;
          break;
        }
      }

      resultComponentStates[comp.id] = {
        voltage,
        current,
        power,
        lit,
        closed,
      };
    });

    const nodeVoltages: Record<string, number> = {};
    groupVoltages.forEach((v, g) => {
      const ports = groupToPorts.get(g) || [];
      ports.forEach((p) => {
        nodeVoltages[p] = v;
      });
    });

    const wireCurrents: Record<string, number> = {};
    wires.forEach((w) => {
      wireCurrents[w.id] = 0;
    });

    return {
      hasShortCircuit,
      shortCircuitWires: hasShortCircuit ? shortCircuitWires : undefined,
      nodeVoltages,
      wireCurrents,
      componentStates: resultComponentStates,
    };
  }
}
