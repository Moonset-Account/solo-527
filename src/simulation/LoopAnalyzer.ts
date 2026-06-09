import { NodeId, ComponentId, CircuitGraph, Loop, BaseComponent } from './types';

interface Adjacency {
  nodeGroup: NodeId;
  component: BaseComponent;
  pinIndex: number;
}

function buildAdjacency(
  graph: CircuitGraph,
  nodeGroups: Map<NodeId, NodeId>
): Map<NodeId, Adjacency[]> {
  const adj = new Map<NodeId, Adjacency[]>();

  for (const component of graph.components.values()) {
    for (let i = 0; i < component.pins.length; i++) {
      const pin = component.pins[i];
      const groupId = nodeGroups.get(pin.nodeId);
      if (!groupId) continue;
      if (!adj.has(groupId)) adj.set(groupId, []);
      adj.get(groupId)!.push({
        nodeGroup: groupId,
        component,
        pinIndex: i,
      });
    }
  }

  return adj;
}

function getComponentResistance(component: BaseComponent): number {
  switch (component.type) {
    case 'resistor':
      return (component.params.resistance as number) || 0;
    case 'bulb':
      return (component.params.resistance as number) || 10;
    case 'battery':
      return 0.01;
    case 'capacitor':
      if ((component.state.charge as number) >= (component.params.capacity as number) * 0.99) {
        return Infinity;
      }
      return 0.1;
    case 'switch':
      return component.state.closed ? 0.001 : Infinity;
    case 'wire_joint':
      return 0.001;
    default:
      return 0;
  }
}

export function findClosedLoops(
  graph: CircuitGraph,
  nodeGroups: Map<NodeId, NodeId>
): Loop[] {
  const loops: Loop[] = [];
  const adjacency = buildAdjacency(graph, nodeGroups);

  const batteries: BaseComponent[] = [];
  for (const comp of graph.components.values()) {
    if (comp.type === 'battery') batteries.push(comp);
  }

  if (batteries.length === 0) return loops;

  const visitedLoops = new Set<string>();

  for (const battery of batteries) {
    if (battery.pins.length < 2) continue;

    const posPin = battery.pins[0];
    const negPin = battery.pins[1];
    const posGroup = nodeGroups.get(posPin.nodeId);
    const negGroup = nodeGroups.get(negPin.nodeId);

    if (!posGroup || !negGroup) continue;

    const queue: {
      currentGroup: NodeId;
      path: Adjacency[];
      visitedGroups: Set<NodeId>;
      visitedComponents: Set<ComponentId>;
      totalResistance: number;
    }[] = [];

    const initialAdjs = adjacency.get(posGroup) || [];
    for (const adj of initialAdjs) {
      if (adj.component.id === battery.id) continue;
      queue.push({
        currentGroup: posGroup,
        path: [adj],
        visitedGroups: new Set([posGroup]),
        visitedComponents: new Set([adj.component.id]),
        totalResistance: 0,
      });
    }

    const maxDepth = graph.components.size * 2;

    while (queue.length > 0) {
      const state = queue.shift()!;
      if (state.path.length > maxDepth) continue;

      const lastAdj = state.path[state.path.length - 1];
      const comp = lastAdj.component;
      const compResistance = getComponentResistance(comp);
      const newResistance = state.totalResistance + compResistance;

      const otherPinIndex = lastAdj.pinIndex === 0 ? 1 : 0;
      if (otherPinIndex >= comp.pins.length) continue;

      const otherNodeId = comp.pins[otherPinIndex].nodeId;
      const otherGroup = nodeGroups.get(otherNodeId);
      if (!otherGroup) continue;

      if (otherGroup === negGroup && state.visitedComponents.size > 0) {
        const componentIds = state.path.map(a => a.component.id);
        const sortedIds = [...componentIds].sort().join('|');
        if (!visitedLoops.has(sortedIds)) {
          visitedLoops.add(sortedIds);
          loops.push({
            pathComponents: [battery.id, ...componentIds],
            totalResistance: newResistance,
          });
        }
        continue;
      }

      if (state.visitedGroups.has(otherGroup)) continue;

      const nextVisitedGroups = new Set(state.visitedGroups);
      nextVisitedGroups.add(otherGroup);

      const nextAdjs = adjacency.get(otherGroup) || [];
      for (const nextAdj of nextAdjs) {
        if (state.visitedComponents.has(nextAdj.component.id)) continue;
        queue.push({
          currentGroup: otherGroup,
          path: [...state.path, nextAdj],
          visitedGroups: nextVisitedGroups,
          visitedComponents: new Set([...state.visitedComponents, nextAdj.component.id]),
          totalResistance: newResistance,
        });
      }
    }
  }

  loops.sort((a, b) => b.totalResistance - a.totalResistance);
  return loops;
}
