import * as THREE from 'three';

const VEHICLE_TYPES = {
  car: { length: 3.8, width: 1.7, height: 1.3, color: 0x4488ff, mass: 1 },
  taxi: { length: 3.8, width: 1.7, height: 1.3, color: 0xffcc00, mass: 1 },
  truck: { length: 6.5, width: 2.2, height: 2.5, color: 0x886644, mass: 2 },
  bus: { length: 10.5, width: 2.5, height: 3.0, color: 0xff4444, mass: 3 },
  suv: { length: 4.5, width: 1.9, height: 1.7, color: 0x226688, mass: 1.2 }
};

const CAR_COLORS = [
  0xff4444, 0x4488ff, 0x44cc66, 0xffcc00, 0xff88cc,
  0xffffff, 0x222222, 0x888888, 0xffa500, 0x9370db
];

let vehicleIdCounter = 0;

export class Vehicle {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.id = `veh_${++vehicleIdCounter}`;
    this.type = options.type || 'car';
    this.isBus = this.type === 'bus';
    this.busRouteId = options.busRouteId || null;
    this.busStopIndex = options.busStopIndex || 0;

    const typeData = VEHICLE_TYPES[this.type] || VEHICLE_TYPES.car;
    this.length = typeData.length;
    this.width = typeData.width;
    this.height = typeData.height;
    this.maxSpeed = this.isBus ? 12 : 18;
    this.accel = this.isBus ? 2.0 : 3.5;
    this.decel = 6.0;
    this.comfortDecel = 3.0;

    this.color = options.color || (this.isBus
      ? typeData.color
      : CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)]);

    this.speed = 0;
    this.desiredSpeed = this.maxSpeed;
    this.waypoints = options.waypoints || [];
    this.waypointIndex = 0;
    this.position = { x: 0, y: 0, z: 0 };
    this.heading = 0;
    this.currentSegId = null;
    this.nextNodeId = null;
    this.prevNodeId = null;
    this.atIntersection = false;
    this.queued = false;
    this.alive = true;
    this.arrived = false;
    this.waitingTime = 0;
    this.totalTravelTime = 0;
    this.distanceTraveled = 0;
    this.stoppedFrames = 0;
    this.averageSpeedSamples = [];
    this.busWaitingAtStop = 0;

    this._buildMesh();

    if (options.startPos) {
      this.setPosition(options.startPos.x, options.startPos.z);
    }
    if (options.heading !== undefined) {
      this.setHeading(options.heading);
    }

    this.scene.add(this.group);
  }

  _buildMesh() {
    this.group = new THREE.Group();
    this.group.name = this.id;

    const bodyColor = this.color;
    const bodyGeom = new THREE.BoxGeometry(this.width, this.height * 0.55, this.length);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.45,
      metalness: 0.2
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = this.height * 0.35;
    body.castShadow = true;
    body.receiveShadow = true;
    this.group.add(body);

    const topHeight = this.height * 0.45;
    const topLen = this.length * (this.isBus ? 0.95 : 0.6);
    const topGeom = new THREE.BoxGeometry(this.width * 0.92, topHeight, topLen);
    const winMat = new THREE.MeshStandardMaterial({
      color: 0x223344,
      roughness: 0.2,
      metalness: 0.7,
      transparent: true,
      opacity: 0.7
    });
    const top = new THREE.Mesh(topGeom, winMat);
    top.position.y = this.height * 0.35 + this.height * 0.55 / 2 + topHeight / 2 - 0.05;
    top.position.z = this.isBus ? 0 : this.length * 0.05;
    top.castShadow = true;
    this.group.add(top);

    const wheelGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.3, 12);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9
    });
    const wheelPositions = [
      [-this.width / 2 + 0.15, 0.32, this.length / 2 - 0.7],
      [this.width / 2 - 0.15, 0.32, this.length / 2 - 0.7],
      [-this.width / 2 + 0.15, 0.32, -this.length / 2 + 0.7],
      [this.width / 2 - 0.15, 0.32, -this.length / 2 + 0.7]
    ];
    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      this.group.add(wheel);
    });

    const headlightGeom = new THREE.BoxGeometry(0.35, 0.18, 0.05);
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffcc,
      emissive: 0xffeeaa,
      emissiveIntensity: 0.5
    });
    [-this.width / 3, this.width / 3].forEach((x) => {
      const hl = new THREE.Mesh(headlightGeom, headlightMat);
      hl.position.set(x, this.height * 0.35, this.length / 2 + 0.01);
      this.group.add(hl);
    });

    const tailGeom = new THREE.BoxGeometry(0.3, 0.15, 0.05);
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0x880000,
      emissive: 0xff0000,
      emissiveIntensity: 0.3
    });
    [-this.width / 3, this.width / 3].forEach((x) => {
      const tl = new THREE.Mesh(tailGeom, tailMat);
      tl.position.set(x, this.height * 0.35, -this.length / 2 - 0.01);
      this.group.add(tl);
    });

    if (this.isBus) {
      const destGeom = new THREE.BoxGeometry(this.width * 0.6, 0.25, 0.02);
      const destMat = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.9
      });
      const dest = new THREE.Mesh(destGeom, destMat);
      dest.position.set(0, this.height - 0.1, this.length / 2 + 0.01);
      this.group.add(dest);

      this.busIndicatorGeom = new THREE.SphereGeometry(0.2, 8, 8);
      this.busIndicatorMat = new THREE.MeshBasicMaterial({
        color: this.color || 0xff4444,
        transparent: true,
        opacity: 0.9
      });
      const indicator = new THREE.Mesh(this.busIndicatorGeom, this.busIndicatorMat);
      indicator.position.set(0, this.height + 0.5, 0);
      this.group.add(indicator);
      this.busIndicator = indicator;
    }
  }

  setPosition(x, z) {
    this.position.x = x;
    this.position.z = z;
    this.group.position.set(x, 0, z);
  }

  setHeading(angle) {
    this.heading = angle;
    this.group.rotation.y = angle;
  }

  setRoute(waypoints) {
    this.waypoints = waypoints;
    this.waypointIndex = 0;
  }

  update(dt, context = {}) {
    if (!this.alive) return;
    this.totalTravelTime += dt;

    if (this.isBus && this.busWaitingAtStop > 0) {
      this.busWaitingAtStop -= dt;
      this.speed = 0;
      this.waitingTime += dt;
      return;
    }

    if (this.waypoints.length === 0) return;
    if (this.waypointIndex >= this.waypoints.length) {
      this.arrived = true;
      this.alive = false;
      return;
    }

    const current = this.waypoints[this.waypointIndex];
    const next = this.waypointIndex + 1 < this.waypoints.length
      ? this.waypoints[this.waypointIndex + 1]
      : null;

    const dx = current.x - this.position.x;
    const dz = current.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    let targetSpeed = this.desiredSpeed;

    const stopThreshold = 1.5;
    if (context.shouldStop && dist < context.stopDistance + stopThreshold) {
      targetSpeed = 0;
    }

    if (context.carInFront && context.carInFrontDist < this.length + 2.5) {
      const gap = context.carInFrontDist - this.length;
      if (gap < 1.5) {
        targetSpeed = Math.min(targetSpeed, 0);
      } else if (gap < 5) {
        targetSpeed = Math.min(targetSpeed, context.carInFront.speed * 0.8);
      }
    }

    const turnSpeedFactor = next ? 0.7 : 1.0;
    targetSpeed *= turnSpeedFactor;

    if (dist < 0.8) {
      this.waypointIndex++;
      if (this.waypointIndex >= this.waypoints.length) {
        this.arrived = true;
        this.alive = false;
        return;
      }
    }

    const newHeading = Math.atan2(dx, dz);
    let diff = newHeading - this.heading;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    const turnRate = 3.0;
    this.setHeading(this.heading + Math.sign(diff) * Math.min(Math.abs(diff), turnRate * dt));

    if (this.speed < targetSpeed) {
      this.speed = Math.min(targetSpeed, this.speed + this.accel * dt);
    } else {
      const decel = (targetSpeed === 0 || this.speed - targetSpeed > 5) ? this.decel : this.comfortDecel;
      this.speed = Math.max(targetSpeed, this.speed - decel * dt);
    }

    if (this.speed < 0.2) {
      this.waitingTime += dt;
      this.stoppedFrames++;
    } else {
      this.stoppedFrames = Math.max(0, this.stoppedFrames - 2);
    }

    this.averageSpeedSamples.push(this.speed);
    if (this.averageSpeedSamples.length > 120) {
      this.averageSpeedSamples.shift();
    }

    const moveDist = this.speed * dt;
    this.distanceTraveled += moveDist;

    const nx = this.position.x + Math.sin(this.heading) * moveDist;
    const nz = this.position.z + Math.cos(this.heading) * moveDist;
    this.setPosition(nx, nz);

    this.atIntersection = dist < 6 && context.isIntersectionArea;
  }

  getAverageSpeed() {
    if (this.averageSpeedSamples.length === 0) return 0;
    return this.averageSpeedSamples.reduce((a, b) => a + b, 0) / this.averageSpeedSamples.length;
  }

  waitAtBusStop(duration = 4) {
    this.busWaitingAtStop = duration;
  }

  isStopped() {
    return this.stoppedFrames > 30;
  }

  dispose() {
    this.alive = false;
    this.scene.remove(this.group);
    this.group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
  }
}
