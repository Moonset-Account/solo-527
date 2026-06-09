import * as THREE from 'three';
import { GAME_CONFIG } from '../data/config.js';

export class CityMap {
    constructor(layout) {
        this.layout = layout;
        this.size = layout.size;
        this.tileSize = GAME_CONFIG.TILE_SIZE;
        this.group = new THREE.Group();
        this.tiles = new Map();
        this.buildings = [];
        this.roads = [];
        this.events = new Map();
        this.teams = new Map();
        this.selectedTile = null;
        this.hoverTile = null;
        this._build();
    }

    _build() {
        const { size, tileSize } = this;
        const half = (size * tileSize) / 2;

        const groundGeo = new THREE.PlaneGeometry(size * tileSize, size * tileSize);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x3a5a3a });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.group.add(ground);

        for (const road of this.layout.roads) {
            const geo = new THREE.PlaneGeometry(tileSize * 0.95, tileSize * 0.95);
            const mat = new THREE.MeshStandardMaterial({ color: 0x555555 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(
                road.x * tileSize - half + tileSize / 2,
                0.01,
                road.y * tileSize - half + tileSize / 2
            );
            mesh.receiveShadow = true;
            mesh.userData = { type: 'road', data: road, gridX: road.x, gridY: road.y };
            this.group.add(mesh);
            this.roads.push(mesh);
            this.tiles.set(`${road.x},${road.y}`, mesh);
        }

        for (const b of this.layout.buildings) {
            const building = this._createBuilding(b);
            this.group.add(building.group);
            this.buildings.push(building);
            this.tiles.set(`${b.x},${b.y}`, building.group);
        }

        for (const p of this.layout.parks) {
            const geo = new THREE.PlaneGeometry(tileSize * 0.9, tileSize * 0.9);
            const mat = new THREE.MeshStandardMaterial({ color: 0x2d5a2d });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(
                p.x * tileSize - half + tileSize / 2,
                0.02,
                p.y * tileSize - half + tileSize / 2
            );
            mesh.receiveShadow = true;
            mesh.userData = { type: 'park', data: p, gridX: p.x, gridY: p.y };
            this.group.add(mesh);
            this.tiles.set(`${p.x},${p.y}`, mesh);

            for (let t = 0; t < 3; t++) {
                const trunkGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.3, 6);
                const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e });
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                const leafGeo = new THREE.SphereGeometry(0.2, 6, 6);
                const leafMat = new THREE.MeshStandardMaterial({ color: 0x1e7a1e });
                const leaf = new THREE.Mesh(leafGeo, leafMat);
                leaf.position.y = 0.35;
                trunk.position.set(
                    p.x * tileSize - half + tileSize / 2 + (Math.random() - 0.5) * 0.5,
                    0.15,
                    p.y * tileSize - half + tileSize / 2 + (Math.random() - 0.5) * 0.5
                );
                trunk.add(leaf);
                this.group.add(trunk);
            }
        }

        const baseGeo = new THREE.BoxGeometry(tileSize * 0.8, 0.3, tileSize * 0.8);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xff8800, emissiveIntensity: 0.3 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(
            this.layout.base.x * tileSize - half + tileSize / 2,
            0.15,
            this.layout.base.y * tileSize - half + tileSize / 2
        );
        base.castShadow = true;
        base.userData = { type: 'base' };
        this.group.add(base);
        this.base = base;

        if (GAME_CONFIG.COLORS) {
            const gridHelper = new THREE.GridHelper(size * tileSize, size, 0x444444, 0x222222);
            gridHelper.position.y = 0.005;
            gridHelper.visible = true;
            this.gridHelper = gridHelper;
            this.group.add(gridHelper);
        }

        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.group.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.set(2048, 2048);
        dirLight.shadow.camera.left = -half;
        dirLight.shadow.camera.right = half;
        dirLight.shadow.camera.top = half;
        dirLight.shadow.camera.bottom = -half;
        dirLight.shadow.camera.far = 100;
        this.group.add(dirLight);
        this.dirLight = dirLight;
    }

    _createBuilding(data) {
        const { size, tileSize } = this;
        const half = (size * tileSize) / 2;
        const group = new THREE.Group();
        
        const heightColors = {
            residential: 0x88aacc,
            commercial: 0xccaa88,
            industrial: 0x999988,
            public: 0xaa88aa
        };
        const h = data.height * 0.8 + 0.3;
        const w = tileSize * 0.8;
        const d = tileSize * 0.8;
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({ color: heightColors[data.type] || 0x888888 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = h / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);

        const windowGeo = new THREE.PlaneGeometry(w * 0.8, h * 0.8);
        const windowCanvas = document.createElement('canvas');
        windowCanvas.width = 64;
        windowCanvas.height = 64;
        const ctx = windowCanvas.getContext('2d');
        ctx.fillStyle = '#000011';
        ctx.fillRect(0, 0, 64, 64);
        const rows = Math.floor(data.height * 3) + 2;
        const cols = 4;
        const cellW = 64 / cols;
        const cellH = 64 / rows;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (Math.random() > 0.35) {
                    ctx.fillStyle = Math.random() > 0.5 ? '#ffdd66' : '#88ccff';
                    ctx.fillRect(c * cellW + 3, r * cellH + 3, cellW - 6, cellH - 6);
                }
            }
        }
        const windowTex = new THREE.CanvasTexture(windowCanvas);
        const windowMat = new THREE.MeshStandardMaterial({ map: windowTex, transparent: true });
        
        const sides = [
            { pos: [0, h / 2, d / 2 + 0.01], rot: [0, 0, 0] },
            { pos: [0, h / 2, -d / 2 - 0.01], rot: [0, Math.PI, 0] },
            { pos: [w / 2 + 0.01, h / 2, 0], rot: [0, Math.PI / 2, 0] },
            { pos: [-w / 2 - 0.01, h / 2, 0], rot: [0, -Math.PI / 2, 0] }
        ];
        for (const s of sides) {
            const win = new THREE.Mesh(windowGeo, windowMat.clone());
            win.position.set(...s.pos);
            win.rotation.set(...s.rot);
            group.add(win);
        }

        group.position.set(
            data.x * tileSize - half + tileSize / 2,
            0.01,
            data.y * tileSize - half + tileSize / 2
        );
        group.userData = { type: 'building', data, gridX: data.x, gridY: data.y, mesh, originalColor: mat.color.getHex() };
        return { group, data, mesh, mat };
    }

    gridToWorld(x, y) {
        const half = (this.size * this.tileSize) / 2;
        return new THREE.Vector3(
            x * this.tileSize - half + this.tileSize / 2,
            0.1,
            y * this.tileSize - half + this.tileSize / 2
        );
    }

    worldToGrid(v) {
        const half = (this.size * this.tileSize) / 2;
        return {
            x: Math.floor((v.x + half) / this.tileSize),
            y: Math.floor((v.z + half) / this.tileSize)
        };
    }

    isRoad(x, y) {
        return this.layout.roads.some(r => r.x === x && r.y === y);
    }

    isBuilding(x, y) {
        return this.layout.buildings.some(b => b.x === x && b.y === y);
    }

    getBuildingAt(x, y) {
        return this.layout.buildings.find(b => b.x === x && b.y === y);
    }

    findPath(startX, startY, endX, endY) {
        const openSet = [{ x: startX, y: startY, g: 0, h: 0, f: 0, parent: null }];
        const closed = new Set();
        const key = (x, y) => `${x},${y}`;

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();
            if (current.x === endX && current.y === endY) {
                const path = [];
                let n = current;
                while (n) {
                    path.unshift({ x: n.x, y: n.y });
                    n = n.parent;
                }
                return path;
            }
            closed.add(key(current.x, current.y));

            const neighbors = [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 }
            ];
            for (const nb of neighbors) {
                if (nb.x < 0 || nb.x >= this.size || nb.y < 0 || nb.y >= this.size) continue;
                if (!this.isRoad(nb.x, nb.y) && !(nb.x === endX && nb.y === endY)) continue;
                if (closed.has(key(nb.x, nb.y))) continue;
                const road = this.layout.roads.find(r => r.x === nb.x && r.y === nb.y);
                const stepCost = (road && road.congested) ? 2 : 1;
                const g = current.g + stepCost;
                const h = Math.abs(nb.x - endX) + Math.abs(nb.y - endY);
                const f = g + h;
                const existing = openSet.find(n => n.x === nb.x && n.y === nb.y);
                if (!existing) {
                    openSet.push({ x: nb.x, y: nb.y, g, h, f, parent: current });
                } else if (g < existing.g) {
                    existing.g = g;
                    existing.f = f;
                    existing.parent = current;
                }
            }
        }
        return null;
    }

    setWeather(weather) {
        const fogColors = {
            '多云': 0x8899aa,
            '暴雨': 0x445566,
            '雷暴': 0x222233,
            '高温': 0xffcc88,
            '极端': 0x331133
        };
        const intensities = {
            '多云': 0.8,
            '暴雨': 0.5,
            '雷暴': 0.3,
            '高温': 1.1,
            '极端': 0.4
        };
        const color = fogColors[weather] || 0xffffff;
        this.group.fog = new THREE.Fog(color, 10, 40);
        if (this.dirLight) this.dirLight.intensity = intensities[weather] || 0.8;
    }

    setCongested(x, y, v) {
        const road = this.layout.roads.find(r => r.x === x && r.y === y);
        if (road) {
            road.congested = v;
            const tile = this.tiles.get(`${x},${y}`);
            if (tile && tile.material) {
                tile.material.color.setHex(v ? 0x332222 : 0x555555);
            }
        }
    }

    highlightTile(x, y, color = 0xffff00, duration = 0) {
        const key = `${x},${y}`;
        const old = this.tiles.get(key);
        if (!old) return;
        const world = this.gridToWorld(x, y);
        const geo = new THREE.BoxGeometry(this.tileSize * 0.9, 0.05, this.tileSize * 0.9);
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 });
        const hl = new THREE.Mesh(geo, mat);
        hl.position.copy(world);
        hl.position.y = 0.1;
        this.group.add(hl);
        if (duration > 0) {
            setTimeout(() => this.group.remove(hl), duration);
        }
        return hl;
    }

    showGrid(v) {
        if (this.gridHelper) this.gridHelper.visible = v;
    }
}
