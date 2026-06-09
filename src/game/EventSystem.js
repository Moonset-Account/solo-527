import * as THREE from 'three';
import { GAME_CONFIG } from '../data/config.js';

export class EventSystem {
    constructor(cityMap, eventBus) {
        this.cityMap = cityMap;
        this.eventBus = eventBus;
        this.events = [];
        this.nextId = 1;
        this.spawnRate = 0.03;
        this.maxActive = 5;
        this.eventBias = null;
        this.group = new THREE.Group();
        this.effectMeshes = new Map();
    }

    configure(levelConfig) {
        this.spawnRate = levelConfig.eventSpawnRate || 0.03;
        this.maxActive = levelConfig.maxActiveEvents || 5;
        this.eventBias = levelConfig.eventBias || null;
    }

    spawnEvent(x, y, type = null) {
        if (this.events.length >= this.maxActive) return null;
        if (!type) type = this._chooseEventType();
        const info = GAME_CONFIG.EVENT_TYPES[type];
        if (!info) return null;
        const building = this.cityMap.getBuildingAt(x, y);
        const event = {
            id: this.nextId++,
            type,
            x, y,
            severity: Math.random() * 0.5 + 0.5,
            timeActive: 0,
            timeLimit: Math.max(40, info.repairTime * (2 - (this.eventBias ? 0.5 : 0))),
            resolved: false,
            failed: false,
            damage: 0,
            buildingName: building ? building.name : '未知地点',
            buildingCapacity: building ? building.capacity : 30,
            baseRepairTime: info.repairTime,
            baseCost: info.cost
        };
        this.events.push(event);
        this._spawnVisual(event);
        this._damageBuilding(x, y, true);
        this.eventBus.emit('event:created', event);
        return event;
    }

    _chooseEventType() {
        const types = Object.keys(GAME_CONFIG.EVENT_TYPES);
        if (this.eventBias) {
            const pool = [];
            for (const [t, w] of Object.entries(this.eventBias)) {
                for (let i = 0; i < w; i++) pool.push(t);
            }
            return pool[Math.floor(Math.random() * pool.length)];
        }
        return types[Math.floor(Math.random() * types.length)];
    }

    _spawnVisual(event) {
        const info = GAME_CONFIG.EVENT_TYPES[event.type];
        const world = this.cityMap.gridToWorld(event.x, event.y);
        const group = new THREE.Group();
        group.position.copy(world);
        group.position.y = 0.3;

        if (event.type === 'FIRE') {
            for (let i = 0; i < 5; i++) {
                const geo = new THREE.ConeGeometry(0.15 + Math.random() * 0.1, 0.4 + Math.random() * 0.3, 6);
                const mat = new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setHSL(0.05 + Math.random() * 0.05, 1, 0.5),
                    transparent: true, opacity: 0.8
                });
                const m = new THREE.Mesh(geo, mat);
                m.position.set((Math.random() - 0.5) * 0.3, Math.random() * 0.2, (Math.random() - 0.5) * 0.3);
                m.userData = { baseY: m.position.y, phase: Math.random() * Math.PI * 2 };
                group.add(m);
            }
        } else if (event.type === 'FLOOD') {
            const geo = new THREE.CylinderGeometry(0.4, 0.45, 0.05, 16);
            const mat = new THREE.MeshStandardMaterial({ color: 0x1e90ff, transparent: true, opacity: 0.7 });
            const m = new THREE.Mesh(geo, mat);
            m.userData = { phase: 0 };
            group.add(m);
            for (let i = 0; i < 3; i++) {
                const ring = new THREE.Mesh(
                    new THREE.RingGeometry(0.2 + i * 0.1, 0.25 + i * 0.1, 16),
                    new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
                );
                ring.rotation.x = -Math.PI / 2;
                ring.position.y = 0.03 + i * 0.02;
                ring.userData = { phase: i * 0.5 };
                group.add(ring);
            }
        } else if (event.type === 'BLACKOUT') {
            const geo = new THREE.OctahedronGeometry(0.2, 0);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.9 });
            const m = new THREE.Mesh(geo, mat);
            m.userData = { phase: 0, type: 'bolt' };
            group.add(m);
            const warning = new THREE.Mesh(
                new THREE.RingGeometry(0.35, 0.4, 16),
                new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
            );
            warning.rotation.x = -Math.PI / 2;
            warning.position.y = 0.02;
            warning.userData = { pulse: 0 };
            group.add(warning);
        } else if (event.type === 'ACCIDENT') {
            const geo = new THREE.BoxGeometry(0.4, 0.15, 0.2);
            const mat = new THREE.MeshStandardMaterial({ color: 0xaa2222 });
            const car = new THREE.Mesh(geo, mat);
            car.rotation.y = Math.random() * Math.PI;
            car.position.y = 0.05;
            group.add(car);
            const warn = new THREE.Mesh(
                new THREE.TorusGeometry(0.25, 0.02, 4, 16),
                new THREE.MeshBasicMaterial({ color: 0xffaa00 })
            );
            warn.rotation.x = -Math.PI / 2;
            warn.position.y = 0.02;
            warn.userData = { phase: 0 };
            group.add(warn);
        } else if (event.type === 'LANDSLIDE') {
            for (let i = 0; i < 6; i++) {
                const geo = new THREE.DodecahedronGeometry(0.1 + Math.random() * 0.1, 0);
                const mat = new THREE.MeshStandardMaterial({ color: 0x6b5344 });
                const rock = new THREE.Mesh(geo, mat);
                rock.position.set(
                    (Math.random() - 0.5) * 0.5,
                    Math.random() * 0.1,
                    (Math.random() - 0.5) * 0.5
                );
                rock.userData = { baseY: rock.position.y, phase: Math.random() * 6.28 };
                group.add(rock);
            }
        }

        const labelGeo = new THREE.CircleGeometry(0.08, 8);
        const labelTex = this._createIconTexture(info.icon);
        const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });
        const label = new THREE.Mesh(labelGeo, labelMat);
        label.position.y = 1.0;
        label.userData = { isLabel: true };
        label.billboard = true;
        group.add(label);

        this.group.add(group);
        this.effectMeshes.set(event.id, group);
    }

    _createIconTexture(icon) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, 32, 34);
        return new THREE.CanvasTexture(canvas);
    }

    _damageBuilding(x, y, damaged) {
        const tile = this.cityMap.tiles.get(`${x},${y}`);
        if (tile && tile.userData && tile.userData.type === 'building') {
            const mesh = tile.userData.mesh;
            if (mesh) {
                if (damaged) {
                    mesh.material.emissive = new THREE.Color(0x883300);
                    mesh.material.emissiveIntensity = 0.4;
                } else {
                    mesh.material.emissive = new THREE.Color(0x000000);
                    mesh.material.emissiveIntensity = 0;
                }
            }
        }
    }

    update(dt, currentTime) {
        for (let i = this.events.length - 1; i >= 0; i--) {
            const ev = this.events[i];
            if (ev.resolved || ev.failed) continue;
            ev.timeActive += dt;
            ev.damage += (GAME_CONFIG.EVENT_TYPES[ev.type].baseDamage * ev.severity * dt) / 10;
            if (ev.timeActive >= ev.timeLimit) {
                ev.failed = true;
                this.eventBus.emit('event:failed', ev);
            }
        }
        for (const [id, group] of this.effectMeshes) {
            const ev = this.events.find(e => e.id === id);
            if (!ev) continue;
            const time = currentTime;
            group.traverse((child) => {
                if (child.billboard && child.userData.isLabel) {
                    child.lookAt(child.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 1, 5)));
                }
                if (child.userData.phase !== undefined) {
                    child.userData.phase += dt * 2;
                    if (ev.type === 'FIRE') {
                        child.position.y = child.userData.baseY + Math.sin(child.userData.phase) * 0.1;
                        child.scale.setScalar(1 + Math.sin(child.userData.phase * 2) * 0.1);
                    } else if (ev.type === 'FLOOD' && child.geometry && child.geometry.type === 'RingGeometry') {
                        const s = 1 + (child.userData.phase % 2) * 0.5;
                        child.scale.setScalar(s);
                        child.material.opacity = 0.5 * (1 - (child.userData.phase % 2) / 2);
                    } else if (ev.type === 'BLACKOUT' && child.userData.type === 'bolt') {
                        child.visible = Math.sin(time * 20) > 0.3;
                        child.rotation.y = time * 5;
                    } else if (ev.type === 'ACCIDENT') {
                        child.rotation.z = Math.sin(child.userData.phase * 3) * 0.2;
                    } else if (ev.type === 'LANDSLIDE') {
                        child.position.y = child.userData.baseY + Math.abs(Math.sin(child.userData.phase * 4)) * 0.05;
                    }
                }
                if (child.userData.pulse !== undefined) {
                    child.userData.pulse += dt;
                    const s = 1 + Math.sin(child.userData.pulse * 4) * 0.15;
                    child.scale.setScalar(s);
                }
            });
            ev.visual = group;
        }
    }

    tickSpawn() {
        if (this.events.filter(e => !e.resolved && !e.failed).length >= this.maxActive) return;
        if (Math.random() > this.spawnRate) return;
        const buildings = this.cityMap.layout.buildings;
        const candidates = buildings.filter(b => {
            const hasEvent = this.events.some(e => !e.resolved && !e.failed && e.x === b.x && e.y === b.y);
            return !hasEvent;
        });
        if (candidates.length === 0) return;
        const b = candidates[Math.floor(Math.random() * candidates.length)];
        this.spawnEvent(b.x, b.y);
    }

    resolveEvent(eventId) {
        const ev = this.events.find(e => e.id === eventId);
        if (!ev) return null;
        ev.resolved = true;
        this._damageBuilding(ev.x, ev.y, false);
        const mesh = this.effectMeshes.get(eventId);
        if (mesh) {
            this.group.remove(mesh);
            this.effectMeshes.delete(eventId);
        }
        const idx = this.events.indexOf(ev);
        if (idx >= 0) this.events.splice(idx, 1);
        this.eventBus.emit('event:resolved', ev);
        return ev;
    }

    getActiveEvents() {
        return this.events.filter(e => !e.resolved && !e.failed);
    }

    getEventAt(x, y) {
        return this.events.find(e => e.x === x && e.y === y && !e.resolved && !e.failed);
    }

    clear() {
        this.events = [];
        for (const [_, group] of this.effectMeshes) this.group.remove(group);
        this.effectMeshes.clear();
    }
}
