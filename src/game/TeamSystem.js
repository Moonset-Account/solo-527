import * as THREE from 'three';

export class TeamSystem {
    constructor(cityMap, eventBus) {
        this.cityMap = cityMap;
        this.eventBus = eventBus;
        this.teams = [];
        this.nextId = 1;
        this.group = new THREE.Group();
        this.pendingPath = null;
    }

    createTeam(type = 'repair') {
        const base = this.cityMap.layout.base;
        const team = {
            id: this.nextId++,
            type,
            name: `维修队-${this.nextId - 1}`,
            status: 'idle',
            x: base.x,
            y: base.y,
            targetX: null,
            targetY: null,
            path: [],
            pathIndex: 0,
            currentTaskId: null,
            speed: 0.08,
            supplies: 0,
            maxSupplies: 20,
            mesh: null
        };
        const color = type === 'repair' ? 0xffd700 : type === 'fire' ? 0xff4444 : 0x44ff44;
        const geo = new THREE.ConeGeometry(0.2, 0.5, 6);
        const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = Math.PI;
        mesh.position.copy(this.cityMap.gridToWorld(base.x, base.y));
        mesh.position.y = 0.3;
        mesh.castShadow = true;
        mesh.userData = { teamId: team.id, type: 'team' };
        team.mesh = mesh;
        this.teams.push(team);
        this.group.add(mesh);
        this.eventBus.emit('team:created', team);
        return team;
    }

    assignTask(teamId, task) {
        const team = this.teams.find(t => t.id === teamId);
        if (!team) return false;
        const startX = team.x;
        const startY = team.y;
        let endX = task.location.x;
        let endY = task.location.y;
        const best = this._findNearestRoad(endX, endY);
        if (best) { endX = best.x; endY = best.y; }
        const path = this.cityMap.findPath(startX, startY, endX, endY);
        if (!path || path.length < 2) return false;
        team.path = path;
        team.pathIndex = 0;
        team.targetX = task.location.x;
        team.targetY = task.location.y;
        team.currentTaskId = task.id;
        team.status = 'moving';
        task.status = 'in_progress';
        this._showPath(path);
        this.eventBus.emit('team:dispatched', { team, task });
        return true;
    }

    _findNearestRoad(x, y) {
        let best = null, bestDist = Infinity;
        for (const r of this.cityMap.layout.roads) {
            const d = Math.abs(r.x - x) + Math.abs(r.y - y);
            if (d < bestDist) { bestDist = d; best = r; }
        }
        return best;
    }

    _showPath(path) {
        if (this.pathLine) this.group.remove(this.pathLine);
        const pts = path.map(p => {
            const w = this.cityMap.gridToWorld(p.x, p.y);
            return new THREE.Vector3(w.x, 0.15, w.z);
        });
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
        this.pathLine = new THREE.Line(geo, mat);
        this.group.add(this.pathLine);
    }

    update(dt) {
        for (const team of this.teams) {
            if (team.status === 'moving' && team.path.length > 0) {
                const target = team.path[Math.min(team.pathIndex + 1, team.path.length - 1)];
                const worldTarget = this.cityMap.gridToWorld(target.x, target.y);
                const current = team.mesh.position;
                const dx = worldTarget.x - current.x;
                const dz = worldTarget.z - current.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                const step = team.speed;
                if (dist < step) {
                    team.x = target.x;
                    team.y = target.y;
                    team.pathIndex++;
                    if (team.pathIndex >= team.path.length - 1) {
                        team.status = 'working';
                        if (this.pathLine) { this.group.remove(this.pathLine); this.pathLine = null; }
                        this.eventBus.emit('team:arrived', { team, taskId: team.currentTaskId });
                    }
                } else {
                    team.mesh.position.x += (dx / dist) * step;
                    team.mesh.position.z += (dz / dist) * step;
                    const angle = Math.atan2(dx, dz);
                    team.mesh.rotation.y = angle;
                }
            }
        }
    }

    releaseTeam(teamId) {
        const team = this.teams.find(t => t.id === teamId);
        if (!team) return;
        team.status = 'returning';
        team.currentTaskId = null;
        const base = this.cityMap.layout.base;
        const path = this.cityMap.findPath(team.x, team.y, base.x, base.y);
        if (path) {
            team.path = path;
            team.pathIndex = 0;
            team.status = 'moving';
            team.targetX = base.x;
            team.targetY = base.y;
            this._showPath(path);
        } else {
            team.status = 'idle';
            team.mesh.position.copy(this.cityMap.gridToWorld(base.x, base.y));
            team.x = base.x;
            team.y = base.y;
        }
    }

    recallAll() {
        for (const t of this.teams) this.releaseTeam(t.id);
    }

    getIdleTeams() {
        return this.teams.filter(t => t.status === 'idle');
    }

    getTeamById(id) {
        return this.teams.find(t => t.id === id);
    }
}
