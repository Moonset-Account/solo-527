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
    this._buildRoadSegments();
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

      const size = ROAD_WIDTH * 1.1;
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

    const spawns = ['spawn_n', 'spawn_s', 'spawn_e', 'spawn_w', 'spawn_ne', 'spawn_nw', 'spawn_se', 'spawn_sw'];
    const { gridSize } = this.levelData;
    const halfX = (gridSize.cols / 2) * 40;
    const halfZ = (gridSize.rows / 2) * 40;
    const positions = {
      spawn_n: [0, -halfZ - 30],
      spawn_s: [0, halfZ + 30],
      spawn_e: [halfX + 30, 0],
      spawn_w: [-halfX - 30, 0],
      spawn_ne: [halfX + 30, -halfZ - 30],
      spawn_nw: [-halfX - 30, -halfZ - 30],
      spawn_se: [halfX + 30, halfZ + 30],
      spawn_sw: [-halfX - 30, halfZ + 30]
    };
    spawns.forEach((s) => {
      if (positions[s]) {
        const [x, z] = positions[s];
        this.nodes.set(s, {
          id: s, x, z, name: s, incoming: [], outgoing: [], isSpawn: true
        });
      }
    });
  }

  _buildRoadSegments() {
    const roads = this._generateAllRoads();
    roads.forEach((road) => {
      const from = this.nodes.get(road.from);
      const to = this.nodes.get(road.to);
      if (!from || !to) return;

      const dx = to.x - from.x;
      const dz = to.z - from.z;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz);

      const perpX = Math.sin(angle + Math.PI / 2);
      const perpZ = Math.cos(angle + Math.PI / 2);
      const laneOffset = (road.lanes - 1) * LANE_WIDTH / 2 - ROAD_WIDTH / 2 + 0.5;

      const waypoints = [];
      const steps = Math.max(2, Math.ceil(length / 10));
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
        capacity: Math.floor(length / 6)
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
        dash.position.set(
          from.x + dx * t,
          0.015,
          from.z + dz * t
        );
        this.group.add(dash);
      }

      if (road.lanes > 1 || road.from.startsWith('spawn')) {
        const edgeGeom = new THREE.PlaneGeometry(0.15, length);
        const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const leftEdge = new THREE.Mesh(edgeGeom, edgeMat);
        leftEdge.rotation.x = -Math.PI / 2;
        leftEdge.rotation.y = angle;
        leftEdge.position.set(
          (from.x + to.x) / 2 + perpX * (ROAD_WIDTH / 2 - 0.07),
          0.015,
          (from.z + to.z) / 2 + perpZ * (ROAD_WIDTH / 2 - 0.07)
        );
        this.group.add(leftEdge);

        const rightEdge = new THREE.Mesh(edgeGeom, edgeMat);
        rightEdge.rotation.x = -Math.PI / 2;
        rightEdge.rotation.y = angle;
        rightEdge.position.set(
          (from.x + to.x) / 2 - perpX * (ROAD_WIDTH / 2 - 0.07),
          0.015,
          (from.z + to.z) / 2 - perpZ * (ROAD_WIDTH / 2 - 0.07)
        );
        this.group.add(rightEdge);
      }
    });
  }

  _generateAllRoads() {
    const { intersections, gridSize } = this.levelData;
    const roads = [];
    const halfX = (gridSize.cols / 2) * 40;
    const halfZ = (gridSize.rows / 2) * 40;

    const dirMap = {
      's->s': 's', 's->n': 'n', 'e->w': 'w', 'w->e': 'e',
      'n->s': 's', 'n->n': 'n', 'e->e': 'e', 'w->w': 'w'
    };

    intersections.forEach((a) => {
      intersections.forEach((b) => {
        if (a.id === b.id) return;
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const ad = Math.abs(dx) + Math.abs(dz);
        if (ad === 0 || ad > 60) return;

        if (Math.abs(dz) < 1) {
          if (dx > 0) {
            roads.push({ from: a.id, to: b.id, dir: 'e', lanes: 2 });
            roads.push({ from: b.id, to: a.id, dir: 'w', lanes: 2 });
          }
        } else if (Math.abs(dx) < 1) {
          if (dz > 0) {
            roads.push({ from: a.id, to: b.id, dir: 's', lanes: 2 });
            roads.push({ from: b.id, to: a.id, dir: 'n', lanes: 2 });
          }
        }
      });
    });

    intersections.forEach((int) => {
      const ex = int.x === -halfX + (int.x % 40);
      if (Math.abs(int.x + halfX) < 5) {
        roads.push({ from: 'spawn_w', to: int.id, dir: 'e', lanes: 2 });
        roads.push({ from: int.id, to: 'spawn_w', dir: 'w', lanes: 2 });
      }
      if (Math.abs(int.x - halfX) < 5) {
        roads.push({ from: 'spawn_e', to: int.id, dir: 'w', lanes: 2 });
        roads.push({ from: int.id, to: 'spawn_e', dir: 'e', lanes: 2 });
      }
      if (Math.abs(int.z + halfZ) < 5) {
        roads.push({ from: 'spawn_n', to: int.id, dir: 's', lanes: 2 });
        roads.push({ from: int.id, to: 'spawn_n', dir: 'n', lanes: 2 });
      }
      if (Math.abs(int.z - halfZ) < 5) {
        roads.push({ from: 'spawn_s', to: int.id, dir: 'n', lanes: 2 });
        roads.push({ from: int.id, to: 'spawn_s', dir: 's', lanes: 2 });
      }
    });

    return roads;
  }

  _buildGround() {
    const { gridSize } = this.levelData;
    const size = Math.max(gridSize.cols, gridSize.rows) * 40 + 160;
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
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * size * 0.8;
      const z = (Math.random() - 0.5) * size * 0.8;
      if (this._isOnRoad(x, z)) continue;
      const treeGeom = new THREE.ConeGeometry(0.8, 2.5, 6);
      const trunkGeom = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 6);
      const tree = new THREE.Mesh(treeGeom, new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.9 }));
      const trunk = new THREE.Mesh(trunkGeom, new THREE.MeshStandardMaterial({ color: 0x5a3d2b, roughness: 0.95 }));
      tree.position.set(x, 2.0, z);
      trunk.position.set(x, 0.5, z);
      tree.castShadow = true;
      this.group.add(tree);
      this.group.add(trunk);
    }
  }

  _isOnRoad(x, z) {
    for (const seg of this.segments) {
      const from = this.nodes.get(seg.from);
      const to = this.nodes.get(seg.to);
      const dx = to.x - from.x;
      const dz = to.z - from.z;
      const lenSq = dx * dx + dz * dz;
      if (lenSq < 1) continue;
      const t = Math.max(0, Math.min(1, ((x - from.x) * dx + (z - from.z) * dz) / lenSq));
      const px = from.x + dx * t;
      const pz = from.z + dz * t;
      const dist = Math.sqrt((x - px) ** 2 + (z - pz) ** 2);
      if (dist < ROAD_WIDTH / 2 + 3) return true;
    }
    return false;
  }

  _buildBuildings() {
    const { gridSize } = this.levelData;
    const colors = [0xb8a48a, 0xa8997a, 0x9c886c, 0xc2ab8a, 0x8a7a6a];
    for (let gx = 0; gx < gridSize.cols; gx++) {
      for (let gz = 0; gz < gridSize.rows; gz++) {
        const wx = -((gridSize.cols - 1) * 20) + gx * 40;
        const wz = -((gridSize.rows - 1) * 20) + gz * 40;
        for (let i = 0; i < 4; i++) {
          const ox = ((i % 2) - 0.5) * 18 + (Math.random() - 0.5) * 4;
          const oz = ((Math.floor(i / 2)) - 0.5) * 18 + (Math.random() - 0.5) * 4;
          if (this._isOnRoad(wx + ox, wz + oz)) continue;
          const bw = 4 + Math.random() * 6;
          const bd = 4 + Math.random() * 6;
          const bh = 4 + Math.random() * 16;
          const geom = new THREE.BoxGeometry(bw, bh, bd);
          const mat = new THREE.MeshStandardMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            roughness: 0.85,
            metalness: 0.05
          });
          const building = new THREE.Mesh(geom, mat);
          building.position.set(wx + ox, bh / 2, wz + oz);
          building.castShadow = true;
          building.receiveShadow = true;
          this.group.add(building);

          const winMat = new THREE.MeshStandardMaterial({
            color: 0xfff4d6,
            emissive: 0xffaa44,
            emissiveIntensity: 0.15 + Math.random() * 0.1
          });
          const floors = Math.max(1, Math.floor(bh / 2.5));
          for (let f = 1; f < floors; f++) {
            const winGeom = new THREE.PlaneGeometry(bw * 0.7, 0.8);
            const win1 = new THREE.Mesh(winGeom, winMat);
            win1.position.set(wx + ox, f * 2.5 + 0.3, wz + oz + bd / 2 + 0.01);
            win1.rotation.y = Math.PI;
            this.group.add(win1);
            const win2 = new THREE.Mesh(winGeom, winMat);
            win2.position.set(wx + ox, f * 2.5 + 0.3, wz + oz - bd / 2 - 0.01);
            this.group.add(win2);
          }
        }
      }
    }
  }

  getNode(id) {
    return this.nodes.get(id);
  }

  getIntersection(id) {
    return this.intersections.get(id);
  }

  getIntersections() {
    return Array.from(this.intersections.values());
  }

  getSpawnNodes() {
    return Array.from(this.nodes.values()).filter((n) => n.isSpawn);
  }

  findSegments(fromId, toId) {
    return this.segments.filter(
      (s) => s.from === fromId && s.to === toId
    );
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
