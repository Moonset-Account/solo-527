import type {
	Vehicle,
	Customer,
	Route,
	Container,
	Probe,
	Shipment,
	TemperatureRecord,
	LocationRecord,
	DoorEvent,
	AnomalyRecord,
	DataDictionaryItem
} from '$lib/types';

function generateId(): string {
	return Math.random().toString(36).substring(2, 15);
}

function randomFromArray<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

function randomIntBetween(min: number, max: number): number {
	return Math.floor(randomBetween(min, max + 1));
}

function formatDate(d: Date): string {
	return d.toISOString().slice(0, 19).replace('T', ' ');
}

export function generateMockData(): {
	vehicles: Vehicle[];
	customers: Customer[];
	routes: Route[];
	containers: Container[];
	probes: Probe[];
	shipments: Shipment[];
	temperatureRecords: TemperatureRecord[];
	locationRecords: LocationRecord[];
	doorEvents: DoorEvent[];
	anomalyRecords: AnomalyRecord[];
	dataDictionary: DataDictionaryItem[];
} {
	const vehicles: Vehicle[] = [
		{
			id: 'v001',
			plateNumber: '京A·12345',
			model: '冷藏车-4.2米',
			driverName: '张师傅',
			status: 'active',
			createdAt: new Date('2024-01-01')
		},
		{
			id: 'v002',
			plateNumber: '京B·67890',
			model: '冷藏车-6.8米',
			driverName: '李师傅',
			status: 'active',
			createdAt: new Date('2024-01-01')
		},
		{
			id: 'v003',
			plateNumber: '沪A·54321',
			model: '冷藏车-9.6米',
			driverName: '王师傅',
			status: 'active',
			createdAt: new Date('2024-01-15')
		},
		{
			id: 'v004',
			plateNumber: '沪B·09876',
			model: '冷藏车-4.2米',
			driverName: '赵师傅',
			status: 'maintenance',
			createdAt: new Date('2024-02-01')
		},
		{
			id: 'v005',
			plateNumber: '粤A·13579',
			model: '冷藏车-6.8米',
			driverName: '刘师傅',
			status: 'active',
			createdAt: new Date('2024-02-15')
		}
	];

	const customers: Customer[] = [
		{
			id: 'c001',
			name: '鲜优生鲜',
			contact: '王经理 13800138001',
			industry: '生鲜零售',
			createdAt: new Date('2024-01-01')
		},
		{
			id: 'c002',
			name: '康泰医药',
			contact: '李总监 13900139002',
			industry: '医药冷链',
			createdAt: new Date('2024-01-01')
		},
		{
			id: 'c003',
			name: '麦好甜品',
			contact: '张主管 13700137003',
			industry: '食品加工',
			createdAt: new Date('2024-01-15')
		},
		{
			id: 'c004',
			name: '海通水产',
			contact: '陈经理 13600136004',
			industry: '水产加工',
			createdAt: new Date('2024-02-01')
		}
	];

	const routes: Route[] = [
		{
			id: 'r001',
			name: '北京-上海',
			origin: '北京大兴仓库',
			destination: '上海青浦配送中心',
			distanceKm: 1260,
			createdAt: new Date('2024-01-01')
		},
		{
			id: 'r002',
			name: '北京-广州',
			origin: '北京大兴仓库',
			destination: '广州白云物流园',
			distanceKm: 2120,
			createdAt: new Date('2024-01-01')
		},
		{
			id: 'r003',
			name: '上海-杭州',
			origin: '上海青浦配送中心',
			destination: '杭州余杭仓库',
			distanceKm: 180,
			createdAt: new Date('2024-01-15')
		},
		{
			id: 'r004',
			name: '广州-深圳',
			origin: '广州白云物流园',
			destination: '深圳宝安冷链中心',
			distanceKm: 140,
			createdAt: new Date('2024-02-01')
		}
	];

	const containers: Container[] = [
		{
			id: 'ct001',
			code: 'REE-001',
			type: '标准冷藏箱',
			volume: 35,
			status: 'active',
			createdAt: new Date('2024-01-01')
		},
		{
			id: 'ct002',
			code: 'REE-002',
			type: '标准冷藏箱',
			volume: 35,
			status: 'active',
			createdAt: new Date('2024-01-01')
		},
		{
			id: 'ct003',
			code: 'REE-003',
			type: '深冷箱',
			volume: 30,
			status: 'active',
			createdAt: new Date('2024-01-15')
		},
		{
			id: 'ct004',
			code: 'REE-004',
			type: '恒温箱',
			volume: 25,
			status: 'maintenance',
			createdAt: new Date('2024-02-01')
		},
		{
			id: 'ct005',
			code: 'REE-005',
			type: '标准冷藏箱',
			volume: 40,
			status: 'active',
			createdAt: new Date('2024-02-15')
		}
	];

	const probes: Probe[] = [
		{
			id: 'p001',
			code: 'TP-CAL-001',
			model: 'Sensirion SHT35',
			lastCalibrationDate: new Date('2024-05-15'),
			calibrationDeviation: 0.1,
			isActive: true,
			createdAt: new Date('2024-01-01')
		},
		{
			id: 'p002',
			code: 'TP-CAL-002',
			model: 'Sensirion SHT35',
			lastCalibrationDate: new Date('2024-05-20'),
			calibrationDeviation: -0.15,
			isActive: true,
			createdAt: new Date('2024-01-01')
		},
		{
			id: 'p003',
			code: 'TP-CHECK-003',
			model: 'DS18B20',
			lastCalibrationDate: new Date('2024-03-01'),
			calibrationDeviation: 0.8,
			isActive: true,
			createdAt: new Date('2024-01-15')
		},
		{
			id: 'p004',
			code: 'TP-ERR-004',
			model: 'Sensirion SHT35',
			lastCalibrationDate: new Date('2023-11-01'),
			calibrationDeviation: 1.5,
			isActive: false,
			createdAt: new Date('2024-02-01')
		},
		{
			id: 'p005',
			code: 'TP-CAL-005',
			model: 'Sensirion SHT35',
			lastCalibrationDate: new Date('2024-06-01'),
			calibrationDeviation: 0.05,
			isActive: true,
			createdAt: new Date('2024-02-15')
		}
	];

	const now = new Date();
	const shipments: Shipment[] = [];
	const temperatureRecords: TemperatureRecord[] = [];
	const locationRecords: LocationRecord[] = [];
	const doorEvents: DoorEvent[] = [];
	const anomalyRecords: AnomalyRecord[] = [];

	for (let i = 0; i < 15; i++) {
		const shipmentId = `s${String(i + 1).padStart(3, '0')}`;
		const daysAgo = randomIntBetween(0, 30);
		const departureTime = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
		departureTime.setHours(8 + randomIntBetween(0, 4), randomIntBetween(0, 59));

		const route = randomFromArray(routes);
		const durationHours = Math.ceil(route.distanceKm / 60) + randomIntBetween(1, 4);
		const arrivalTime = new Date(departureTime.getTime() + durationHours * 60 * 60 * 1000);
		const plannedArrivalTime = new Date(
			departureTime.getTime() + (durationHours - 1) * 60 * 60 * 1000
		);

		const isDelayed = arrivalTime > plannedArrivalTime;
		const hasAnomaly = Math.random() > 0.4;

		shipments.push({
			id: shipmentId,
			batchNo: `BATCH-${202406}${String(i + 1).padStart(4, '0')}`,
			vehicleId: randomFromArray(vehicles.filter((v) => v.status === 'active')).id,
			customerId: randomFromArray(customers).id,
			routeId: route.id,
			containerId: randomFromArray(containers.filter((c) => c.status === 'active')).id,
			departureTime,
			arrivalTime,
			plannedArrivalTime,
			status: hasAnomaly ? 'abnormal' : isDelayed ? 'delayed' : 'completed',
			createdAt: departureTime
		});

		const probe = randomFromArray(probes.filter((p) => p.isActive));
		const batchNo = `BATCH-${202406}${String(i + 1).padStart(4, '0')}`;

		const locRecords = generateLocationRecords(shipmentId, route, departureTime, arrivalTime);
		locationRecords.push(...locRecords);

		const events = generateDoorEvents(shipmentId, departureTime, arrivalTime);
		doorEvents.push(...events);

		const tempRecords = generateTemperatureRecords(
			shipmentId,
			batchNo,
			probe,
			departureTime,
			arrivalTime,
			hasAnomaly,
			locRecords,
			events
		);
		temperatureRecords.push(...tempRecords);

		if (hasAnomaly) {
			const anomalies = generateAnomalyRecords(
				shipmentId,
				`BATCH-${202406}${String(i + 1).padStart(4, '0')}`,
				departureTime,
				arrivalTime,
				tempRecords
			);
			anomalyRecords.push(...anomalies);
		}
	}

	const dataDictionary: DataDictionaryItem[] = [
		{
			id: 'dd001',
			category: 'anomaly_type',
			key: 'over_temp',
			value: 'over_temp',
			label: '温度超标',
			description: '箱内温度高于设定上限',
			sortOrder: 1,
			isActive: true,
			createdAt: new Date()
		},
		{
			id: 'dd002',
			category: 'anomaly_type',
			key: 'under_temp',
			value: 'under_temp',
			label: '温度过低',
			description: '箱内温度低于设定下限',
			sortOrder: 2,
			isActive: true,
			createdAt: new Date()
		},
		{
			id: 'dd003',
			category: 'anomaly_type',
			key: 'door_open',
			value: 'door_open',
			label: '开门超时',
			description: '箱门开启时间超过规定阈值',
			sortOrder: 3,
			isActive: true,
			createdAt: new Date()
		},
		{
			id: 'dd004',
			category: 'anomaly_type',
			key: 'probe_error',
			value: 'probe_error',
			label: '探头故障',
			description: '温度探头校准过期或读数异常',
			sortOrder: 4,
			isActive: true,
			createdAt: new Date()
		},
		{
			id: 'dd005',
			category: 'anomaly_type',
			key: 'delay',
			value: 'delay',
			label: '到货延迟',
			description: '实际到货时间晚于计划时间',
			sortOrder: 5,
			isActive: true,
			createdAt: new Date()
		},
		{
			id: 'dd006',
			category: 'severity',
			key: 'low',
			value: 'low',
			label: '低',
			description: '对货物质量影响较小',
			sortOrder: 1,
			isActive: true,
			createdAt: new Date()
		},
		{
			id: 'dd007',
			category: 'severity',
			key: 'medium',
			value: 'medium',
			label: '中',
			description: '需要关注的异常',
			sortOrder: 2,
			isActive: true,
			createdAt: new Date()
		},
		{
			id: 'dd008',
			category: 'severity',
			key: 'high',
			value: 'high',
			label: '高',
			description: '可能影响货物质量',
			sortOrder: 3,
			isActive: true,
			createdAt: new Date()
		},
		{
			id: 'dd009',
			category: 'severity',
			key: 'critical',
			value: 'critical',
			label: '严重',
			description: '严重威胁货物质量安全',
			sortOrder: 4,
			isActive: true,
			createdAt: new Date()
		},
		{
			id: 'dd010',
			category: 'responsible_party',
			key: 'carrier',
			value: 'carrier',
			label: '承运商',
			description: '运输过程中承运商责任',
			sortOrder: 1,
			isActive: true,
			createdAt: new Date()
		},
		{
			id: 'dd011',
			category: 'responsible_party',
			key: 'warehouse',
			value: 'warehouse',
			label: '仓库',
			description: '装卸货过程中仓库责任',
			sortOrder: 2,
			isActive: true,
			createdAt: new Date()
		},
		{
			id: 'dd012',
			category: 'responsible_party',
			key: 'customer',
			value: 'customer',
			label: '客户',
			description: '收货方操作责任',
			sortOrder: 3,
			isActive: true,
			createdAt: new Date()
		},
		{
			id: 'dd013',
			category: 'responsible_party',
			key: 'equipment',
			value: 'equipment',
			label: '设备',
			description: '设备故障导致',
			sortOrder: 4,
			isActive: true,
			createdAt: new Date()
		},
		{
			id: 'dd014',
			category: 'responsible_party',
			key: 'unknown',
			value: 'unknown',
			label: '待确认',
			description: '责任方待判定',
			sortOrder: 5,
			isActive: true,
			createdAt: new Date()
		},
		{
			id: 'dd015',
			category: 'temp_threshold',
			key: 'upper_limit',
			value: '8',
			label: '温度上限(°C)',
			description: '冷藏运输温度上限阈值',
			sortOrder: 1,
			isActive: true,
			createdAt: new Date()
		},
		{
			id: 'dd016',
			category: 'temp_threshold',
			key: 'lower_limit',
			value: '-25',
			label: '温度下限(°C)',
			description: '冷冻运输温度下限阈值',
			sortOrder: 2,
			isActive: true,
			createdAt: new Date()
		},
		{
			id: 'dd017',
			category: 'calibration',
			key: 'max_deviation',
			value: '0.5',
			label: '最大允许偏差(°C)',
			description: '温度探头校准最大允许偏差',
			sortOrder: 1,
			isActive: true,
			createdAt: new Date()
		},
		{
			id: 'dd018',
			category: 'calibration',
			key: 'validity_period_days',
			value: '90',
			label: '校准有效期(天)',
			description: '温度探头校准有效周期',
			sortOrder: 2,
			isActive: true,
			createdAt: new Date()
		}
	];

	return {
		vehicles,
		customers,
		routes,
		containers,
		probes,
		shipments,
		temperatureRecords,
		locationRecords,
		doorEvents,
		anomalyRecords,
		dataDictionary
	};
}

function generateTemperatureRecords(
	shipmentId: string,
	batchNo: string,
	probe: Probe,
	startTime: Date,
	endTime: Date,
	hasAnomaly: boolean,
	locationRecords: LocationRecord[],
	doorEvents: DoorEvent[]
): TemperatureRecord[] {
	const records: TemperatureRecord[] = [];
	const intervalMs = 5 * 60 * 1000;
	let currentTime = new Date(startTime);
	const baseTemp = randomBetween(-18, 2);

	let anomalyStart: Date | null = null;
	let anomalyEnd: Date | null = null;

	if (hasAnomaly) {
		const startOffset = randomBetween(0.2, 0.6) * (endTime.getTime() - startTime.getTime());
		const duration = randomBetween(15, 60) * 60 * 1000;
		anomalyStart = new Date(startTime.getTime() + startOffset);
		anomalyEnd = new Date(anomalyStart.getTime() + duration);
	}

	let idCounter = 0;
	while (currentTime <= endTime) {
		let temp = baseTemp + randomBetween(-1, 1);

		if (anomalyStart && anomalyEnd && currentTime >= anomalyStart && currentTime <= anomalyEnd) {
			temp = 6 + randomBetween(0, 3);
		}

		const isCalibrated = !!(probe.lastCalibrationDate && probe.calibrationDeviation <= 0.5);

		const nearestLocation = locationRecords.reduce((nearest, loc) => {
			const diff = Math.abs(loc.timestamp.getTime() - currentTime.getTime());
			const nearestDiff = Math.abs(nearest.timestamp.getTime() - currentTime.getTime());
			return diff < nearestDiff ? loc : nearest;
		}, locationRecords[0]);

		const isDoorOpen = doorEvents.some((event) => {
			if (event.eventType !== 'open') return false;
			const closeEvent = doorEvents.find(
				(e) => e.eventType === 'close' && e.timestamp.getTime() > event.timestamp.getTime()
			);
			return (
				currentTime.getTime() >= event.timestamp.getTime() &&
				(!closeEvent || currentTime.getTime() <= closeEvent.timestamp.getTime())
			);
		});

		records.push({
			id: `${shipmentId}-t${String(idCounter++).padStart(5, '0')}`,
			shipmentId,
			batchNo,
			probeId: probe.id,
			timestamp: new Date(currentTime),
			temperature: Math.round(temp * 10) / 10,
			humidity: Math.round(randomBetween(40, 70) * 10) / 10,
			latitude: nearestLocation?.latitude,
			longitude: nearestLocation?.longitude,
			doorOpen: isDoorOpen,
			probeCalibrated: isCalibrated,
			probeCalibrationDate: probe.lastCalibrationDate,
			calibrationDeviation: probe.calibrationDeviation,
			createdAt: new Date(currentTime)
		});

		currentTime = new Date(currentTime.getTime() + intervalMs);
	}

	return records;
}

function generateLocationRecords(
	shipmentId: string,
	route: Route,
	startTime: Date,
	endTime: Date
): LocationRecord[] {
	const records: LocationRecord[] = [];
	const points: [number, number][] = [
		[39.7289, 116.4189],
		[31.2304, 121.4737],
		[23.1291, 113.2644],
		[30.2741, 120.1551],
		[22.5431, 114.0579]
	];

	const startPoint = randomFromArray(points);
	const endPoint = randomFromArray(points.filter((p) => p !== startPoint));

	const intervalMs = 10 * 60 * 1000;
	const totalMs = endTime.getTime() - startTime.getTime();
	let currentTime = new Date(startTime);

	let idCounter = 0;
	while (currentTime <= endTime) {
		const progress = (currentTime.getTime() - startTime.getTime()) / totalMs;
		const lat = startPoint[0] + (endPoint[0] - startPoint[0]) * progress + randomBetween(-0.05, 0.05);
		const lng = startPoint[1] + (endPoint[1] - startPoint[1]) * progress + randomBetween(-0.05, 0.05);

		records.push({
			id: `${shipmentId}-l${String(idCounter++).padStart(5, '0')}`,
			shipmentId,
			timestamp: new Date(currentTime),
			latitude: Math.round(lat * 10000) / 10000,
			longitude: Math.round(lng * 10000) / 10000,
			speed: Math.round(randomBetween(40, 90) * 10) / 10,
			createdAt: new Date(currentTime)
		});

		currentTime = new Date(currentTime.getTime() + intervalMs);
	}

	return records;
}

function generateDoorEvents(shipmentId: string, startTime: Date, endTime: Date): DoorEvent[] {
	const events: DoorEvent[] = [];
	const numEvents = randomIntBetween(2, 4);

	for (let i = 0; i < numEvents; i++) {
		const offset = (i / numEvents) * (endTime.getTime() - startTime.getTime());
		const eventTime = new Date(startTime.getTime() + offset + randomBetween(0, 3600000));

		events.push({
			id: `${shipmentId}-d${i * 2}`,
			shipmentId,
			timestamp: eventTime,
			eventType: 'open',
			location: i === 0 ? '发货仓库' : i === numEvents - 1 ? '收货仓库' : '中途站点',
			operator: i === 0 ? '仓库管理员A' : '司机',
			createdAt: eventTime
		});

		const closeTime = new Date(eventTime.getTime() + randomBetween(5, 20) * 60 * 1000);
		events.push({
			id: `${shipmentId}-d${i * 2 + 1}`,
			shipmentId,
			timestamp: closeTime,
			eventType: 'close',
			createdAt: closeTime
		});
	}

	return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

function generateAnomalyRecords(
	shipmentId: string,
	batchNo: string,
	startTime: Date,
	endTime: Date,
	tempRecords: TemperatureRecord[]
): AnomalyRecord[] {
	const anomalies: AnomalyRecord[] = [];
	const anomalyTypes: Array<{
		type: 'over_temp' | 'under_temp' | 'door_open' | 'probe_error' | 'delay';
		severity: 'low' | 'medium' | 'high' | 'critical';
		party: 'carrier' | 'warehouse' | 'customer' | 'equipment' | 'unknown';
		description: string;
	}> = [
		{ type: 'over_temp', severity: 'high', party: 'carrier', description: '运输过程中箱内温度超过上限阈值' },
		{ type: 'door_open', severity: 'medium', party: 'warehouse', description: '装卸货过程中箱门开启时间过长' },
		{ type: 'under_temp', severity: 'medium', party: 'equipment', description: '制冷设备故障导致温度过低' },
		{ type: 'probe_error', severity: 'low', party: 'equipment', description: '温度探头数据异常' },
		{ type: 'delay', severity: 'medium', party: 'carrier', description: '运输时间超过计划时长' }
	];

	const selected = randomFromArray(anomalyTypes);
	const startOffset = randomBetween(0.2, 0.6) * (endTime.getTime() - startTime.getTime());
	const duration = randomBetween(15, 90);
	const anomalyStart = new Date(startTime.getTime() + startOffset);
	const anomalyEnd = new Date(anomalyStart.getTime() + duration * 60 * 1000);

	const uncalibratedProbe = tempRecords.some((r) => !r.probeCalibrated);
	const hasResolved = Math.random() > 0.5;

	anomalies.push({
		id: `${shipmentId}-a001`,
		shipmentId,
		batchNo,
		startTime: anomalyStart,
		endTime: anomalyEnd,
		durationMinutes: Math.round(duration),
		anomalyType: selected.type,
		severity: selected.severity,
		responsibleParty: selected.party,
		status: hasResolved ? 'resolved' : 'pending',
		resolved: hasResolved,
		resolvedAt: hasResolved ? new Date(anomalyEnd.getTime() + 3600000).toISOString() : undefined,
		probeCalibrated: !uncalibratedProbe,
		description: selected.description,
		createdAt: anomalyEnd
	});

	if (uncalibratedProbe && Math.random() > 0.5) {
		anomalies.push({
			id: `${shipmentId}-a002`,
			shipmentId,
			batchNo,
			startTime: startTime,
			endTime: endTime,
			durationMinutes: Math.round(
				(endTime.getTime() - startTime.getTime()) / (60 * 1000)
			),
			anomalyType: 'probe_error',
			severity: 'low',
			responsibleParty: 'equipment',
			status: 'pending',
			resolved: false,
			probeCalibrated: false,
			description: '温度探头校准过期，数据仅供参考',
			annotation: '温度探头校准过期，数据仅供参考',
			createdAt: endTime
		});
	}

	return anomalies;
}

export function getInsertSQL(tableName: string, data: any[]): { sql: string; values: any[] } {
	if (data.length === 0) return { sql: '', values: [] };

	const columns = Object.keys(data[0])
		.map((k) => k.replace(/([A-Z])/g, '_$1').toLowerCase())
		.join(', ');
	const placeholders = data.map((_, i) => `(${Object.keys(data[0]).map((_, j) => `$${i * Object.keys(data[0]).length + j + 1}`).join(', ')})`).join(', ');

	const values = data.flatMap((row) =>
		Object.values(row).map((v) => (v instanceof Date ? formatDate(v) : v))
	);

	return {
		sql: `INSERT INTO ${tableName} (${columns}) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
		values
	};
}
