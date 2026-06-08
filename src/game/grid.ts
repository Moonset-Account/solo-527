import type { GridCell, Direction, Position } from "@/game/types";

export function createGrid(
  width: number,
  height: number,
  entryPoint: Position,
  exitPoint: Position
): GridCell[][] {
  const grid: GridCell[][] = [];
  for (let y = 0; y < height; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < width; x++) {
      let type: GridCell["type"] = "empty";
      if (x === entryPoint.x && y === entryPoint.y) type = "entry";
      if (x === exitPoint.x && y === exitPoint.y) type = "exit";
      row.push({ x, y, type, machine: null, conveyor: null });
    }
    grid.push(row);
  }
  return grid;
}

export function placeMachine(
  grid: GridCell[][],
  x: number,
  y: number,
  machineType: string,
  direction: Direction
): GridCell[][] {
  return grid.map((row, rowIdx) =>
    row.map((cell, colIdx) => {
      if (colIdx === x && rowIdx === y && cell.type === "empty") {
        return {
          ...cell,
          type: machineType === "qa_station" ? "qa_station" : "machine",
          machine: {
            type: machineType,
            gridX: x,
            gridY: y,
            level: 1,
            direction,
            buffer: [],
            processingProduct: null,
            processingTimer: 0,
          },
        };
      }
      return cell;
    })
  );
}

export function placeConveyor(
  grid: GridCell[][],
  x: number,
  y: number,
  direction: Direction
): GridCell[][] {
  return grid.map((row, rowIdx) =>
    row.map((cell, colIdx) => {
      if (colIdx === x && rowIdx === y && cell.type === "empty") {
        return {
          ...cell,
          type: "conveyor",
          conveyor: {
            gridX: x,
            gridY: y,
            direction,
            speed: 0.5,
            products: [],
          },
        };
      }
      return cell;
    })
  );
}

export function removeMachine(
  grid: GridCell[][],
  x: number,
  y: number
): GridCell[][] {
  return grid.map((row, rowIdx) =>
    row.map((cell, colIdx) => {
      if (colIdx === x && rowIdx === y && cell.type !== "empty" && cell.type !== "entry" && cell.type !== "exit") {
        return { ...cell, type: "empty" as const, machine: null, conveyor: null };
      }
      return cell;
    })
  );
}
