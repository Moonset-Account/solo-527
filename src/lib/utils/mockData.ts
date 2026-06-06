import type {
	OverviewData,
	AnalysisData,
	DetailData,
	LowTempBox,
	LateBuilding,
	RefundRequest,
	PendingVisit,
	AnalysisItem,
	BuildingHeatmap,
	TemperaturePoint,
	RoutePoint,
	DeliveryPhoto,
	ExcludedSample
} from '$lib/types';

const deliveryMen = ['张师傅', '李师傅', '王师傅', '赵师傅', '刘师傅', '陈师傅'];
const mealTypes = ['营养套餐A', '营养套餐B', '软食套餐', '低糖套餐', '清真套餐'];
const buildings = [
	{ name: '阳光花园1号楼', lat: 31.2304, lng: 121.4737 },
	{ name: '阳光花园2号楼', lat: 31.2310, lng: 121.4742 },
	{ name: '阳光花园3号楼', lat: 31.2315, lng: 121.4732 },
	{ name: '幸福里小区A栋', lat: 31.2320, lng: 121.4750 },
	{ name: '幸福里小区B栋', lat: 31.2325, lng: 121.4755 },
	{ name: '康乐苑1号楼', lat: 31.2295, lng: 121.4725 },
	{ name: '康乐苑2号楼', lat: 31.2290, lng: 121.4720 },
	{ name: '安康社区甲单元', lat: 31.2330, lng: 121.4740 },
	{ name: '安康社区乙单元', lat: 31.2335, lng: 121.4745 },
	{ name: '祥和公寓', lat: 31.2300, lng: 121.4760 }
];
const timeSlots = ['06:00-08:00', '08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00'];
const userNames = ['李奶奶', '王爷爷', '张阿姨', '刘叔叔', '陈奶奶', '赵爷爷', '孙阿姨', '周叔叔'];

function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
	return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function randomChoice<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export function generateOverviewData(date: string, minSampleCount: number = 3): OverviewData {
	const lowTempBoxes: LowTempBox[] = [];
	for (let i = 0; i < 8; i++) {
		const sampleCount = randomInt(1, 10);
		let status: 'pending' | 'confirmed';
		
		if (sampleCount < minSampleCount) {
			status = 'pending';
		} else {
			status = randomChoice(['pending', 'confirmed', 'confirmed']);
		}
		
		lowTempBoxes.push({
			boxId: `BOX-${String(1001 + i)}`,
			minTemperature: randomFloat(45, 59),
			sampleCount,
			status,
			deliveryMan: randomChoice(deliveryMen),
			mealType: randomChoice(mealTypes)
		});
	}

	const lateBuildings: LateBuilding[] = [];
	for (let i = 0; i < 6; i++) {
		const building = randomChoice(buildings);
		lateBuildings.push({
			buildingName: building.name,
			lateCount: randomInt(1, 8),
			avgDelayMinutes: randomInt(5, 45),
			onTimeRate: randomFloat(70, 95)
		});
	}

	const refundRequests: RefundRequest[] = [];
	const reasons = ['餐品温度过低', '配送超时', '餐品不完整', '口味不符', '其他'];
	for (let i = 0; i < 5; i++) {
		refundRequests.push({
			id: `REF-${String(2001 + i)}`,
			applicant: randomChoice(userNames),
			reason: randomChoice(reasons),
			amount: randomFloat(15, 35),
			status: randomChoice(['pending', 'pending', 'approved', 'rejected'])
		});
	}

	const pendingVisits: PendingVisit[] = [];
	for (let i = 0; i < 6; i++) {
		pendingVisits.push({
			id: `VISIT-${String(3001 + i)}`,
			userName: randomChoice(userNames),
			deliveryDate: date,
			status: randomChoice(['pending', 'pending', 'completed'])
		});
	}

	return {
		date,
		stats: {
			lowTempBoxCount: lowTempBoxes.filter((b) => b.status === 'confirmed').length,
			lateDeliveryCount: lateBuildings.reduce((sum, b) => sum + b.lateCount, 0),
			refundRequestCount: refundRequests.filter((r) => r.status === 'pending').length,
			pendingVisitCount: pendingVisits.filter((v) => v.status === 'pending').length
		},
		lowTempBoxes,
		lateBuildings,
		refundRequests,
		pendingVisits
	};
}

export function generateAnalysisData(
	dimension: 'deliveryMan' | 'mealType' | 'timeSlot' | 'building',
	date: string
): AnalysisData {
	let items: AnalysisItem[] = [];
	let buildingHeatmap: BuildingHeatmap[] | undefined;

	switch (dimension) {
		case 'deliveryMan':
			items = deliveryMen.map((name) => ({
				name,
				onTimeRate: randomFloat(85, 99),
				lowTempCount: randomInt(0, 5),
				totalOrders: randomInt(20, 50),
				avgTemperature: randomFloat(62, 78)
			}));
			break;
		case 'mealType':
			items = mealTypes.map((name) => ({
				name,
				onTimeRate: randomFloat(88, 98),
				lowTempCount: randomInt(0, 4),
				totalOrders: randomInt(15, 40),
				avgTemperature: randomFloat(60, 75)
			}));
			break;
		case 'timeSlot':
			items = timeSlots.map((name) => ({
				name,
				onTimeRate: randomFloat(80, 97),
				lowTempCount: randomInt(0, 6),
				totalOrders: randomInt(10, 35),
				avgTemperature: randomFloat(58, 80)
			}));
			break;
		case 'building':
			items = buildings.map((b) => ({
				name: b.name,
				onTimeRate: randomFloat(82, 96),
				lowTempCount: randomInt(0, 3),
				totalOrders: randomInt(8, 25),
				avgTemperature: randomFloat(61, 76)
			}));
			buildingHeatmap = buildings.map((b) => ({
				buildingName: b.name,
				lat: b.lat,
				lng: b.lng,
				value: randomInt(1, 10)
			}));
			break;
	}

	return { dimension, data: items, buildingHeatmap };
}

export function generateDetailData(boxId: string, deliveryDate: string): DetailData {
	const temperatureCurve: TemperaturePoint[] = [];
	const baseTime = new Date(`${deliveryDate}T11:00:00`);
	let currentTemp = 75;

	for (let i = 0; i < 20; i++) {
		const time = new Date(baseTime.getTime() + i * 5 * 60 * 1000);
		currentTemp += randomFloat(-2, 1);
		if (i > 12) currentTemp += randomFloat(-3, 0);
		temperatureCurve.push({
			time: time.toISOString(),
			temperature: Math.max(40, Math.min(85, currentTemp)),
			location: {
				lat: 31.2304 + randomFloat(-0.003, 0.003),
				lng: 121.4737 + randomFloat(-0.003, 0.003)
			}
		});
	}

	const route: RoutePoint[] = [];
	const routeAddresses = [
		'配送站出发',
		'阳光花园1号楼',
		'阳光花园2号楼',
		'幸福里小区A栋',
		'康乐苑1号楼',
		'安康社区甲单元'
	];
	for (let i = 0; i < routeAddresses.length; i++) {
		const time = new Date(baseTime.getTime() + i * 15 * 60 * 1000);
		route.push({
			time: time.toISOString(),
			location: {
				lat: 31.2304 + (i - 2.5) * 0.002,
				lng: 121.4737 + (i - 2.5) * 0.0015
			},
			address: routeAddresses[i]
		});
	}

	const photos: DeliveryPhoto[] = [];
	for (let i = 0; i < 3; i++) {
		const uploadTime = new Date(baseTime.getTime() + (i + 1) * 20 * 60 * 1000);
		photos.push({
			url: `https://picsum.photos/seed/meal-${boxId}-${i}/600/400`,
			thumbnail: `https://picsum.photos/seed/meal-${boxId}-${i}/200/150`,
			uploadTime: uploadTime.toISOString()
		});
	}

	const excludedSamples: ExcludedSample[] = [];
	for (let i = 0; i < 2; i++) {
		const time = new Date(baseTime.getTime() + randomInt(0, 100) * 60 * 1000);
		excludedSamples.push({
			time: time.toISOString(),
			temperature: i === 0 ? randomFloat(-5, 5) : randomFloat(105, 120),
			reason: i === 0 ? '温度超出合理范围' : '传感器数据异常波动'
		});
	}

	return {
		boxId,
		deliveryMan: randomChoice(deliveryMen),
		mealType: randomChoice(mealTypes),
		deliveryDate,
		building: randomChoice(buildings).name,
		temperatureCurve,
		route,
		photos,
		excludedSamples
	};
}
