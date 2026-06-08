import * as THREE from 'three';

const ROAD_WIDTH = 8;
const LANE_WIDTH = 3.5;
const DASH_LENGTH = 2;
const DASH_GAP = 1.5;

export class RoadNetwork {
  constructor(scene, levelData) {
    this.scene = scene;
    this.levelData = levelData;
    this.group = new THREE.Group();
    this.group.name = 'RoadNetwork';
    this.nodes = new Map();
    this.segments = [];
    this.intersections = new Map();
    this._build();
    this.scene.add(this.group);
  }

  _build() {
    this._buildIntersections();
    this._buildSpawnPoints();
    const roads = this._collectRoads();
    this._buildRoadSegments(roads);
    this._buildGround();
    this._buildBuildings();
  }

  _buildIntersections() {
    const { intersections } = this.levelData;
    intersections.forEach((int) => {
      const node = {
        id: int.id,
        x: int.x,
        z: int.z,
        name: int.name,
        incoming: [],
        outgoing: []
      };
      this.nodes.set(int.id, node);
      this.intersections.set(int.id, node);

      const size = ROAD_WIDTH * 1.2;
      const geom = new THREE.PlaneGeometry(size, size);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x3a3f4a,
        roughness: 0.95,
        metalness: 0.0
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(int.x, 0.02, int.z);
      mesh.receiveShadow = true;
      mesh.userData = { type: 'intersection', id: int.id };
      this.group.add(mesh);

      const border = new THREE.LineSegments(
        new THREE.EdgesGeometry(geom),
        new THREE.LineBasicMaterial({ color: 0x5a6577, linewidth: 2 })
      );
      border.rotation.x = -Math.PI / 2;
      border.position.set(int.x, 0.03, int.z);
      this.group.add(border);

      node.mesh = mesh;
    });
  }

  _buildSpawnPoints() {
    const ints = this.levelData.intersections;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    ints.forEach((i) => {
      if (i.x < minX) minX = i.x;
      if (i.x > maxX) maxX = i.x;
      if (i.z < minZ) minZ = i.z;
      if (i.z > maxZ) maxZ = i.z;
    });

    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const rangeX = Math.max(20, maxX - minX);
    const rangeZ = Math.max(20, maxZ - minZ);
    const spawnDist = 45;

    const positions = {
      spawn_n: [centerX, minZ - spawnDist],
      spawn_s: [centerX, maxZ + spawnDist],
      spawn_e: [maxX + spawnDist, centerZ],
      spawn_w: [minX - spawnDist, centerZ],
      spawn_ne: [maxX + spawnDist, minZ - spawnDist],
      spawn_nw: [minX - spawnDist, minZ - spawnDist],
      spawn_se: [maxX + spawnDist, maxZ + spawnDist],
      spawn_sw: [minX - spawnDist, maxZ + spawnDist]
    };

    const spawnIds = ['spawn_n', 'spawn_s', 'spawn_e', 'spawn_w', 'spawn_ne', 'spawn_nw', 'spawn_se', 'spawn_sw'];
    spawnIds.forEach((s) => {
      const [x, z] = positions[s];
      this.nodes.set(s, {
        id: s, x, z, name: s, incoming: [], outgoing: [], isSpawn: true
      });
    });

    this._range = { centerX, centerZ, minX, maxX, minZ, maxZ, rangeX, rangeZ };
  }

  _collectRoads() {
    let roads = [];
    if (this.levelData.roads && this.levelData.roads.length > 0) {
      roads = roads.concat(this.levelData.roads);
    }
    roads = roads.concat(this._generateIntersectionRoads());
    roads = roads.concat(this._generateSpawnRoads());
    return this._dedupeRoads(roads);
  }

  _dedupeRoads(roads) {
    const seen = new Set();
    const out = [];
    roads.forEach((r) => {
      const key = `${r.from}->${r.to}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(r);
      }
    });
    return out;
  }

  _generateIntersectionRoads() {
    const { intersections } = this.levelData;
    const roads = [];
    intersections.forEach((a) => {
      intersections.forEach((b) => {
        if (a.id === b.id) return;
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const tol = 3;

        if (Math.abs(dz) < tol && dx > 0 && dx <= 55) {
          roads.push({ from: a.id, to: b.id, dir: 'e', lanes: 2 });
          roads.push({ from: b.id, to: a.id, dir: 'w', lanes: 2 });
        }
        if (Math.abs(dx) < tol && dz > 0 && dz <= 55) {
          roads.push({ from: a.id, to: b.id, dir: 's', lanes: 2 });
          roads.push({ from: b.id, to: a.id, dir: 'n', lanes: 2 });
        }
      });
    });
    return roads;
  }

  _generateSpawnRoads() {
    const roads = [];
    const r = this._range;
    const ints = this.levelData.intersections;

    const gates = [
      { spawnId: 'spawn_n',  fromDir: 's', toDir: 'n',  gate: this._findNearestIntersection(r.centerX, r.minZ, ints, 'n') },
      { spawnId: 'spawn_s',  fromDir: 'n', toDir: 's',  gate: this._findNearestIntersection(r.centerX, r.maxZ, ints, 's') },
      { spawnId: 'spawn_e',  fromDir: 'w', toDir: 'e',  gate: this._findNearestIntersection(r.maxX, r.centerZ, ints, 'e') },
      { spawnId: 'spawn_w',  fromDir: 'e', toDir: 'w',  gate: this._findNearestIntersection(r.minX, r.centerZ, ints, 'w') },
      { spawnId: 'spawn_ne', fromDir: 'sw', toDir: 'ne', gate: this._findNearestIntersection(r.maxX, r.minZ, ints, 'ne') },
      { spawnId: 'spawn_sw', fromDir: 'ne', toDir: 'sw', gate: this._findNearestIntersection(r.minX, r.maxZ, ints, 'sw') },
      { spawnId: 'spawn_nw', fromDir: 'se', toDir: 'nw', gate: this._findNearestIntersection(r.minX, r.minZ, ints, 'nw') },
      { spawnId: 'spawn_se', fromDir: 'nw', toDir: 'se', gate: this._findNearestIntersection(r.maxX, r.maxZ, ints, 'se') }
    ];

    gates.forEach(({ spawnId, fromDir, toDir, gate }) => {
      if (!gate) return;
      roads.push({ from: spawnId, to: gate.id, dir: fromDir, lanes: 2 });
      roads.push({ from: gate.id, to: spawnId, dir: toDir, lanes: 2 });
    });
    return roads;
  }

  _findNearestIntersection(tx, tz, ints, dir) {
    let best = null;
    let bestScore = -Infinity;
    const xs = ints.map(i => i.x);
    const zs = ints.map(i => i.z);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);
    const rangeX = Math.max(1, maxX - minX);
    const rangeZ = Math.max(1, maxZ - minZ);

    ints.forEach((i) => {
      const dx = tx - i.x;
      const dz = tz - i.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const absDx = Math.abs(dx);
      const absDz = Math.abs(dz);
      let score = 0;
      const normX = (i.x - minX) / rangeX;
      const normZ = (i.z - minZ) / rangeZ;
      let dirPref = 0;

      switch (dir) {
        case 'n':
          if (absDx > Math.max(45, rangeX * 1.2)) return;
          dirPref = -normZ;
          score = -absDx * 1.2 - dz * 0.6 + dirPref * rangeZ * 1.0;
          break;
        case 's':
          if (absDx > Math.max(45, rangeX * 1.2)) return;
          dirPref = normZ;
          score = -absDx * 1.2 + dz * 0.6 + dirPref * rangeZ * 1.0;
          break;
        case 'e':
          if (absDz > Math.max(45, rangeZ * 1.2)) return;
          dirPref = normX;
          score = -absDz * 1.2 + dx * 0.6 + dirPref * rangeX * 1.0;
          break;
        case 'w':
          if (absDz > Math.max(45, rangeZ * 1.2)) return;
          dirPref = -normX;
          score = -absDz * 1.2 - dx * 0.6 + dirPref * rangeX * 1.0;
          break;
        case 'ne':
          dirPref = normX + normZ;
          score = dirPref * Math.max(rangeX, rangeZ) * 2.5 - dist * 0.6;
          break;
        case 'sw':
          dirPref = -normX + -normZ;
          score = dirPref * Math.max(rangeX, rangeZ) * 2.5 - dist * 0.6;
          break;
        case 'nw':
          dirPref = -normX + normZ;
          score = dirPref * Math.max(rangeX, rangeZ) * 2.5 - dist * 0.6;
          break;
        case 'se':
          dirPref = normX + -normZ;
          score = dirPref * Math.max(rangeX, rangeZ) * 2.5 - dist * 0.6;
          break;
        default:
          score = -dist;
      }
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    });
    if (!best && ints.length > 0) {
      let minDist = Infinity;
      ints.forEach((i) => {
        const d = (tx - i.x) ** 2 + (tz - i.z) ** 2;
        if (d < minDist) { minDist = d; best = i; }
      });
    }
    return best;
  }

  _buildRoadSegments(roads) {
    roads.forEach((road) => {
      const from = this.nodes.get(road.from);
      const to = this.nodes.get(road.to);
      if (!from || !to) return;

      const dx = to.x - from.x;
      const dz = to.z - from.z;
      const length = Math.sqrt(dx * dx + dz * dz);
      if (length < 1) return;
      const angle = Math.atan2(dx, dz);

      const perpX = Math.sin(angle + Math.PI / 2);
      const perpZ = Math.cos(angle + Math.PI / 2);
      const laneOffset = (road.lanes - 1) * LANE_WIDTH / 2 - ROAD_WIDTH / 2 + 0.5;

      const waypoints = [];
      const steps = Math.max(2, Math.ceil(length / 8));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        waypoints.push({
          x: from.x + dx * t + perpX * laneOffset,
          z: from.z + dz * t + perpZ * laneOffset
        });
      }

      const segment = {
        id: `${road.from}_${road.to}`,
        from: road.from,
        to: road.to,
        dir: road.dir,
        lanes: road.lanes,
        length,
        angle,
        waypoints,
        queue: [],
        capacity: Math.max(3, Math.floor(length / 6))
      };

      from.outgoing.push(segment);
      to.incoming.push(segment);
      this.segments.push(segment);

      const roadGeom = new THREE.PlaneGeometry(ROAD_WIDTH, length);
      const roadMat = new THREE.MeshStandardMaterial({
        color: 0x2e333e,
        roughness: 0.92,
        metalness: 0.0
      });
      const roadMesh = new THREE.Mesh(roadGeom, roadMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.rotation.y = angle;
      roadMesh.position.set((from.x + to.x) / 2, 0.01, (from.z + to.z) / 2);
      roadMesh.receiveShadow = true;
      this.group.add(roadMesh);

      const dashMat = new THREE.MeshBasicMaterial({ color: 0xd0d0d0 });
      const dashGeom = new THREE.PlaneGeometry(0.2, DASH_LENGTH);
      const dashCount = Math.floor(length / (DASH_LENGTH + DASH_GAP));
      for (let i = 0; i < dashCount; i++) {
        const t = (i + 0.5) / dashCount;
        const dash = new THREE.Mesh(dashGeom, dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.rotation.y = angle;
        dash.position.set(from.x + dx * t, 0.015, from.z + dz * t);
        this.group.add(dash);
      }

      const edgeGeom = new THREE.PlaneGeometry(0.12, length);
      const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      [-1, 1].forEach((side) => {
        const edge = new THREE.Mesh(edgeGeom, edgeMat);
        edge.rotation.x = -Math.PI / 2;
        edge.rotation.y = angle;
        edge.position.set(
          (from.x + to.x) / 2 + perpX * side * (ROAD_WIDTH / 2 - 0.06),
          0.015,
          (from.z + to.z) / 2 + perpZ * side * (ROAD_WIDTH / 2 - 0.06)
        );
        this.group.add(edge);
      });
    });

    console.log('[RoadNetwork] 构建完成:', {
      nodes: this.nodes.size,
      segments: this.segments.length,
      intersections: this.intersections.size,
      spawns: this.getSpawnNodes().length
    });
    this.segments.forEach((s) => {
      console.log(`  ─ ${s.from} -> ${s.to} [${s.dir}] len=${s.length.toFixed(0)}m cap=${s.capacity}`);
    });
  }

  _buildGround() {
    const r = this._range;
    const size = Math.max(r.rangeX, r.rangeZ) * 2 + 200;
    const groundGeom = new THREE.PlaneGeometry(size, size);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2d4a3e,
      roughness: 1.0,
      metalness: 0.0
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.group.add(ground);

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x3d5a4a,
      roughness: 1.0
    });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d2b, roughness: 0.95 });
    for (let i = 0; i < 50; i++) {
      const x = (Math.random() - 0.5) * size * 0.85;
      const z = (Math.random() - 0.5) * size * 0.85;
      if (this._isOnRoad(x, z)) continue;
      const treeGeom = new THREE.ConeGeometry(0.9, 2.8, 6);
      const trunkGeom = new THREE.CylinderGeometry(0.15, 0.2, 0.9, 6);
      const tree = new THREE.Mesh(treeGeom, new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.9 }));
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      tree.position.set(x, 2.2, z);
      trunk.position.set(x, 0.55, z);
      tree.castShadow = true;
      this.group.add(tree);
      this.group.add(trunk);
    }
  }

  _isOnRoad(x, z) {
    for (const seg of this.segments) {
      const from = this.nodes.get(seg.from);
      const to = this.nodes.get(seg.to);
      if (!from || !to) continue;
      const dx = to.x - from.x;
      const dz = to.z - from.z;
      const lenSq = dx * dx + dz * dz;
      if (lenSq < 1) continue;
      const t = Math.max(0, Math.min(1, ((x - from.x) * dx + (z - from.z) * dz) / lenSq));
      const px = from.x + dx * t;
      const pz = from.z + dz * t;
      const dist = Math.sqrt((x - px) ** 2 + (z - pz) ** 2);
      if (dist < ROAD_WIDTH / 2 + 4) return true;
    }
    for (const int of this.levelData.intersections) {
      const dx = x - int.x;
      const dz = z - int.z;
      if (dx * dx + dz * dz < 40) return true;
    }
    return false;
  }

  _buildBuildings() {
    const r = this._range;
    const colors = [0xb8a48a, 0xa8997a, 0x9c886c, 0xc2ab8a, 0x8a7a6a, 0xc9b89c, 0xb09478];
    const spacing = 16;
    const minX = r.centerX - r.rangeX - 30;
    const maxX = r.centerX + r.rangeX + 30;
    const minZ = r.centerZ - r.rangeZ - 30;
    const maxZ = r.centerZ + r.rangeZ + 30;

    for (let gx = minX; gx <= maxX; gx += spacing) {
      for (let gz = minZ; gz <= maxZ; gz += spacing) {
        if (this._isOnRoad(gx, gz)) continue;
        if (Math.random() < 0.35) continue;
        const jx = (Math.random() - 0.5) * 6;
        const jz = (Math.random() - 0.5) * 6;
        const bw = 3.5 + Math.random() * 5;
        const bd = 3.5 + Math.random() * 5;
        const bh = 3 + Math.random() * 18;
        const geom = new THREE.BoxGeometry(bw, bh, bd);
        const mat = new THREE.MeshStandardMaterial({
          color: colors[Math.floor(Math.random() * colors.length)],
          roughness: 0.85,
          metalness: 0.05
        });
        const building = new THREE.Mesh(geom, mat);
        building.position.set(gx + jx, bh / 2, gz + jz);
        building.castShadow = true;
        building.receiveShadow = true;
        this.group.add(building);

        const winMat = new THREE.MeshStandardMaterial({
          color: 0xfff4d6,
          emissive: 0xffaa44,
          emissiveIntensity: 0.15 + Math.random() * 0.1
        });
        const floors = Math.max(1, Math.floor(bh / 2.8));
        for (let f = 1; f < floors; f++) {
          const ww = bw * 0.65;
          const winGeom = new THREE.PlaneGeometry(ww, 0.85);
          const w1 = new THREE.Mesh(winGeom, winMat);
          w1.position.set(gx + jx, f * 2.8 + 0.3, gz + jz + bd / 2 + 0.01);
          w1.rotation.y = Math.PI;
          this.group.add(w1);
          const w2 = new THREE.Mesh(winGeom, winMat);
          w2.position.set(gx + jx, f * 2.8 + 0.3, gz + jz - bd / 2 - 0.01);
          this.group.add(w2);
          const wl = Math.min(bd * 0.6, 4);
          const sideGeom = new THREE.PlaneGeometry(wl, 0.85);
          const w3 = new THREE.Mesh(sideGeom, winMat);
          w3.position.set(gx + jx + bw / 2 + 0.01, f * 2.8 + 0.3, gz + jz);
          w3.rotation.y = Math.PI / 2;
          this.group.add(w3);
          const w4 = new THREE.Mesh(sideGeom, winMat);
          w4.position.set(gx + jx - bw / 2 - 0.01, f * 2.8 + 0.3, gz + jz);
          w4.rotation.y = -Math.PI / 2;
          this.group.add(w4);
        }
      }
    }
  }

  getNode(id) { return this.nodes.get(id); }
  getIntersection(id) { return this.intersections.get(id); }
  getIntersections() { return Array.from(this.intersections.values()); }
  getSpawnNodes() { return Array.from(this.nodes.values()).filter((n) => n.isSpawn); }

  findSegments(fromId, toId) {
    return this.segments.filter((s) => s.from === fromId && s.to === toId);
  }

  findOutgoingSegments(nodeId, preferredDir = null) {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    return node.outgoing;
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
