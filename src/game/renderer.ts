import type { GridCell, Product, BottleneckInfo, Direction } from "@/game/types";

const MACHINE_LABELS: Record<string, string> = {
  press: "冲压",
  cutter: "切割",
  welder: "焊接",
  painter: "喷涂",
  qa_station: "质检",
};

const MACHINE_COLORS: Record<string, string> = {
  press: "#8B6914",
  cutter: "#6B8E23",
  welder: "#CD853F",
  painter: "#9370DB",
  qa_station: "#2E8B57",
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class FactoryRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize = 64;
  private grid: GridCell[][] = [];
  private products: Product[] = [];
  private bottlenecks: BottleneckInfo[] = [];
  private particles: Particle[] = [];
  private time: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
  }

  setGrid(grid: GridCell[][]) {
    this.grid = grid;
  }

  setProducts(products: Product[]) {
    this.products = products;
  }

  setBottlenecks(bottlenecks: BottleneckInfo[]) {
    this.bottlenecks = bottlenecks;
  }

  setCellSize(size: number) {
    this.cellSize = size;
  }

  addDeliveryParticles(gridX: number, gridY: number) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.particles.push({
        x: (gridX + 0.5) * this.cellSize,
        y: (gridY + 0.5) * this.cellSize,
        vx: Math.cos(angle) * 60 + (Math.random() - 0.5) * 30,
        vy: Math.sin(angle) * 60 + (Math.random() - 0.5) * 30,
        life: 0.6,
        maxLife: 0.6,
        color: "#D4A84B",
        size: 4,
      });
    }
  }

  addRejectParticles(gridX: number, gridY: number) {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      this.particles.push({
        x: (gridX + 0.5) * this.cellSize,
        y: (gridY + 0.5) * this.cellSize,
        vx: Math.cos(angle) * 40,
        vy: Math.sin(angle) * 40 - 20,
        life: 0.4,
        maxLife: 0.4,
        color: "#C44B4B",
        size: 3,
      });
    }
  }

  render() {
    const { ctx, canvas, grid, cellSize } = this;
    this.time += 0.016;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#1a1008";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (grid.length === 0) return;

    this.drawGrid(ctx, grid, cellSize);
    this.drawProducts(ctx, cellSize);
    this.drawBottleneckHighlights(ctx, cellSize);
    this.updateAndDrawParticles(ctx);
  }

  private drawGrid(ctx: CanvasRenderingContext2D, grid: GridCell[][], cellSize: number) {
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        const px = x * cellSize;
        const py = y * cellSize;

        ctx.strokeStyle = "#3d2b1a";
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, cellSize, cellSize);

        switch (cell.type) {
          case "empty":
            ctx.fillStyle = "#2D1B0E";
            ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
            break;
          case "entry":
            this.drawEntry(ctx, px, py, cellSize);
            break;
          case "exit":
            this.drawExit(ctx, px, py, cellSize);
            break;
          case "machine":
            this.drawMachine(ctx, px, py, cellSize, cell);
            break;
          case "qa_station":
            this.drawQAStation(ctx, px, py, cellSize, cell);
            break;
          case "conveyor":
            this.drawConveyor(ctx, px, py, cellSize, cell);
            break;
        }
      }
    }
  }

  private drawEntry(ctx: CanvasRenderingContext2D, px: number, py: number, cs: number) {
    ctx.fillStyle = "#4A7C59";
    ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
    const pulse = Math.sin(this.time * 3) * 0.15 + 0.85;
    ctx.fillStyle = `rgba(74, 124, 89, ${pulse})`;
    ctx.fillRect(px + 3, py + 3, cs - 6, cs - 6);
    ctx.fillStyle = "#E8DCC8";
    ctx.font = `bold ${cs * 0.35}px "VT323", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("IN", px + cs / 2, py + cs / 2);
    ctx.strokeStyle = "#2D5A3A";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 3, py + 3, cs - 6, cs - 6);
  }

  private drawExit(ctx: CanvasRenderingContext2D, px: number, py: number, cs: number) {
    ctx.fillStyle = "#C45D2C";
    ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
    const pulse = Math.sin(this.time * 2.5) * 0.15 + 0.85;
    ctx.fillStyle = `rgba(196, 93, 44, ${pulse})`;
    ctx.fillRect(px + 3, py + 3, cs - 6, cs - 6);
    ctx.fillStyle = "#E8DCC8";
    ctx.font = `bold ${cs * 0.3}px "VT323", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("OUT", px + cs / 2, py + cs / 2);
    ctx.strokeStyle = "#8B3A1A";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 3, py + 3, cs - 6, cs - 6);
  }

  private drawMachine(ctx: CanvasRenderingContext2D, px: number, py: number, cs: number, cell: GridCell) {
    const mType = cell.machine?.type || "press";
    const mLevel = cell.machine?.level || 1;
    const color = MACHINE_COLORS[mType] || "#4a3825";

    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);

    ctx.strokeStyle = "#8B7355";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 3, py + 3, cs - 6, cs - 6);

    this.drawRivet(ctx, px + 5, py + 5);
    this.drawRivet(ctx, px + cs - 5, py + 5);
    this.drawRivet(ctx, px + 5, py + cs - 5);
    this.drawRivet(ctx, px + cs - 5, py + cs - 5);

    if (cell.machine) {
      const isProcessing = cell.machine.processingProduct !== null;
      if (isProcessing) {
        const glow = Math.sin(this.time * 6) * 0.2 + 0.3;
        ctx.fillStyle = `rgba(212, 168, 75, ${glow})`;
        ctx.fillRect(px + 5, py + 5, cs - 10, cs - 10);
      }

      const label = MACHINE_LABELS[mType] || mType;
      ctx.fillStyle = "#E8DCC8";
      ctx.font = `bold ${cs * 0.22}px "VT323", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, px + cs / 2, py + cs * 0.4);

      ctx.fillStyle = "#D4A84B";
      ctx.font = `${cs * 0.18}px "VT323", monospace`;
      ctx.fillText(`Lv${mLevel}`, px + cs / 2, py + cs * 0.7);

      this.drawDirectionArrow(ctx, px, py, cs, cell.machine.direction);
    }
  }

  private drawQAStation(ctx: CanvasRenderingContext2D, px: number, py: number, cs: number, cell: GridCell) {
    ctx.fillStyle = "#2a3825";
    ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);

    ctx.strokeStyle = "#4A7C59";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 3, py + 3, cs - 6, cs - 6);

    this.drawRivet(ctx, px + 5, py + 5);
    this.drawRivet(ctx, px + cs - 5, py + 5);
    this.drawRivet(ctx, px + 5, py + cs - 5);
    this.drawRivet(ctx, px + cs - 5, py + cs - 5);

    if (cell.machine) {
      const isProcessing = cell.machine.processingProduct !== null;
      if (isProcessing) {
        const glow = Math.sin(this.time * 4) * 0.3 + 0.3;
        ctx.fillStyle = `rgba(46, 139, 87, ${glow})`;
        ctx.fillRect(px + 5, py + 5, cs - 10, cs - 10);
      }

      ctx.fillStyle = "#4A7C59";
      ctx.font = `bold ${cs * 0.28}px "VT323", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("QA", px + cs / 2, py + cs * 0.4);

      ctx.fillStyle = "#D4A84B";
      ctx.font = `${cs * 0.18}px "VT323", monospace`;
      ctx.fillText(`Lv${cell.machine.level}`, px + cs / 2, py + cs * 0.7);

      this.drawDirectionArrow(ctx, px, py, cs, cell.machine.direction);
    }
  }

  private drawConveyor(ctx: CanvasRenderingContext2D, px: number, py: number, cs: number, cell: GridCell) {
    ctx.fillStyle = "#3a2a18";
    ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);

    ctx.strokeStyle = "#6B5B3A";
    ctx.lineWidth = 1;
    const dir: Direction = cell.conveyor?.direction || "right";

    const beltCount = 4;
    for (let i = 0; i < beltCount; i++) {
      const offset = ((this.time * 2 + i) % beltCount) * (cs / beltCount);
      if (dir === "right" || dir === "left") {
        const lineX = dir === "right" ? px + offset : px + cs - offset;
        ctx.beginPath();
        ctx.moveTo(lineX, py + 4);
        ctx.lineTo(lineX, py + cs - 4);
        ctx.stroke();
      } else {
        const lineY = dir === "down" ? py + offset : py + cs - offset;
        ctx.beginPath();
        ctx.moveTo(px + 4, lineY);
        ctx.lineTo(px + cs - 4, lineY);
        ctx.stroke();
      }
    }

    this.drawDirectionArrow(ctx, px, py, cs, dir);
  }

  private drawDirectionArrow(ctx: CanvasRenderingContext2D, px: number, py: number, cs: number, dir: Direction) {
    ctx.fillStyle = "rgba(232, 220, 200, 0.3)";
    const cx = px + cs / 2;
    const cy = py + cs / 2;
    const arrowSize = cs * 0.12;

    ctx.save();
    ctx.translate(cx, cy);
    let angle = 0;
    switch (dir) {
      case "right": angle = 0; break;
      case "down": angle = Math.PI / 2; break;
      case "left": angle = Math.PI; break;
      case "up": angle = -Math.PI / 2; break;
    }
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(arrowSize, 0);
    ctx.lineTo(-arrowSize, -arrowSize * 0.7);
    ctx.lineTo(-arrowSize, arrowSize * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawProducts(ctx: CanvasRenderingContext2D, cellSize: number) {
    for (const product of this.products) {
      const px = product.position.x * cellSize + cellSize / 2;
      const py = product.position.y * cellSize + cellSize / 2;
      const radius = cellSize * 0.14;

      ctx.fillStyle = product.color || "#D4A84B";
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (product.state === "processing" || product.state === "qa_check") {
        const glow = Math.sin(this.time * 8) * 0.3 + 0.5;
        ctx.strokeStyle = product.state === "qa_check"
          ? `rgba(74, 124, 89, ${glow})`
          : `rgba(212, 168, 75, ${glow})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (product.stage > 0) {
        ctx.fillStyle = "#1a1008";
        ctx.font = `bold ${cellSize * 0.12}px "VT323", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${product.stage}`, px, py + 1);
      }
    }
  }

  private drawBottleneckHighlights(ctx: CanvasRenderingContext2D, cellSize: number) {
    for (const bn of this.bottlenecks) {
      const px = bn.x * cellSize;
      const py = bn.y * cellSize;
      const pulse = Math.sin(this.time * 4) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(212, 168, 75, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);

      ctx.fillStyle = `rgba(212, 168, 75, ${pulse * 0.15})`;
      ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);

      ctx.fillStyle = "#C44B4B";
      ctx.font = `bold ${cellSize * 0.18}px "VT323", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("⚠", px + cellSize / 2, py + 2);
    }
  }

  private updateAndDrawParticles(ctx: CanvasRenderingContext2D) {
    const dt = 0.016;
    const alive: Particle[] = [];
    for (const p of this.particles) {
      p.life -= dt;
      if (p.life <= 0) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt;

      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.globalAlpha = 1;

      alive.push(p);
    }
    this.particles = alive;
  }

  private drawRivet(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = "#8B7355";
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6B5B3A";
    ctx.beginPath();
    ctx.arc(x + 0.5, y + 0.5, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  getCellAt(clientX: number, clientY: number): { x: number; y: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / this.cellSize);
    const y = Math.floor((clientY - rect.top) / this.cellSize);
    if (y >= 0 && y < this.grid.length && x >= 0 && x < (this.grid[y]?.length || 0)) {
      return { x, y };
    }
    return null;
  }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    if (this.grid.length > 0 && this.grid[0].length > 0) {
      const cols = this.grid[0].length;
      const rows = this.grid.length;
      const cellW = Math.floor(width / cols);
      const cellH = Math.floor(height / rows);
      this.cellSize = Math.min(cellW, cellH, 80);
    }
  }

  destroy() {
    this.particles = [];
  }
}
