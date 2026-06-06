import {
  Route,
  Station,
  Trip,
  ArrivalRecord,
  CardRecord,
  Complaint,
  WeatherRecord,
  Anomaly,
  DetourInfo,
  Direction,
  PeakPeriod,
  CrowdingLevel,
} from "@/types";

const STATION_NAMES = [
  "火车站", "市政府", "人民广场", "科技园", "大学城",
  "商业街", "体育中心", "医院", "公园", "居民区",
  "工业区", "机场", "客运站", "博物馆", "图书馆",
  "大剧院", "会展中心", "物流园", "保税区", "高新区",
];

const ROUTE_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatTime(date: Date): string {
  return date.toISOString();
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function getCrowdingLevel(loadFactor: number): CrowdingLevel {
  if (loadFactor < 0.4) return "low";
  if (loadFactor < 0.7) return "medium";
  if (loadFactor < 0.9) return "high";
  return "extreme";
}

function getPeakPeriod(hour: number): PeakPeriod {
  if (hour >= 7 && hour <= 9) return "morning";
  if (hour >= 17 && hour <= 19) return "evening";
  return "off-peak";
}

function generateBaseLoadFactor(hour: number): number {
  const peakPeriod = getPeakPeriod(hour);
  if (peakPeriod === "morning") return 0.6 + Math.random() * 0.35;
  if (peakPeriod === "evening") return 0.55 + Math.random() * 0.35;
  return 0.2 + Math.random() * 0.4;
}

const baseLng = 116.4074;
const baseLat = 39.9042;

export function generateStations(): Station[] {
  const stations: Station[] = [];
  for (let i = 0; i < STATION_NAMES.length; i++) {
    const angle = (i / STATION_NAMES.length) * Math.PI * 2;
    const radius = 0.02 + (i % 5) * 0.008;
    stations.push({
      id: `station_${i + 1}`,
      name: STATION_NAMES[i],
      code: `ST${String(i + 1).padStart(3, "0")}`,
      lng: baseLng + Math.cos(angle) * radius,
      lat: baseLat + Math.sin(angle) * radius,
      routes: [],
      sequence: i + 1,
    });
  }
  return stations;
}

export function generateRoutes(stations: Station[]): Route[] {
  const routes: Route[] = [];
  const routeCount = 6;

  for (let r = 0; r < routeCount; r++) {
    const routeStationsCount = 8 + Math.floor(Math.random() * 8);
    const routeStations: Station[] = [];
    const startIdx = (r * 4) % stations.length;

    for (let i = 0; i < routeStationsCount; i++) {
      const idx = (startIdx + i * 2) % stations.length;
      const station = { ...stations[idx] };
      station.sequence = i + 1;
      station.routes = [`route_${r + 1}`];
      routeStations.push(station);
    }

    routes.push({
      id: `route_${r + 1}`,
      name: `${r + 1}路`,
      code: `RT${String(r + 1).padStart(3, "0")}`,
      color: ROUTE_COLORS[r % ROUTE_COLORS.length],
      stations: routeStations,
      direction: "up",
      totalStops: routeStationsCount,
      operatingHours: { start: "06:00", end: "22:00" },
    });
  }

  return routes;
}

export function generateTrips(routes: Route[], date: Date): Trip[] {
  const trips: Trip[] = [];
  const startHour = 6;
  const endHour = 22;

  routes.forEach((route, routeIdx) => {
    for (let hour = startHour; hour < endHour; hour++) {
      const tripCount = getPeakPeriod(hour) === "off-peak" ? 2 : 4;
      for (let t = 0; t < tripCount; t++) {
        const minute = Math.floor((60 / tripCount) * t + Math.random() * 5);
        const startTime = new Date(date);
        startTime.setHours(hour, minute, 0, 0);

        const isDetour = Math.random() < 0.08;

        trips.push({
          id: generateId("trip"),
          routeId: route.id,
          routeName: route.name,
          direction: getRandomElement<Direction>(["up", "down"]),
          startTime: formatTime(startTime),
          endTime: formatTime(addMinutes(startTime, 45 + Math.random() * 20)),
          vehicleId: `VEH-${String(1000 + routeIdx * 10 + t).padStart(4, "0")}`,
          driverName: `司机${String(routeIdx * 10 + t + 1).padStart(3, "0")}`,
          isDetour,
          detourReason: isDetour ? getRandomElement(["道路施工", "交通事故", "临时交通管制"]) : undefined,
          peakPeriod: getPeakPeriod(hour),
        });
      }
    }
  });

  return trips;
}

export function generateArrivalRecords(
  routes: Route[],
  trips: Trip[],
  date: Date
): ArrivalRecord[] {
  const records: ArrivalRecord[] = [];

  trips.forEach((trip) => {
    const route = routes.find((r) => r.id === trip.routeId);
    if (!route) return;

    const tripDate = new Date(trip.startTime);
    const hour = tripDate.getHours();
    const baseLoad = generateBaseLoadFactor(hour);

    route.stations.forEach((station, idx) => {
      const scheduledTime = addMinutes(tripDate, idx * 3 + Math.random() * 1);
      const delay = trip.isDetour
        ? 300 + Math.random() * 600
        : Math.max(0, (Math.random() - 0.3) * 300);
      const actualTime = addMinutes(scheduledTime, delay / 60);

      const loadVariation = (Math.random() - 0.5) * 0.3;
      const loadFactor = Math.min(1, Math.max(0, baseLoad + loadVariation + idx * 0.02));
      const passengerCount = Math.floor(loadFactor * 80);

      records.push({
        id: generateId("arrival"),
        tripId: trip.id,
        routeId: trip.routeId,
        stationId: station.id,
        stationName: station.name,
        scheduledTime: formatTime(scheduledTime),
        actualTime: formatTime(actualTime),
        delaySeconds: Math.round(delay),
        loadFactor: Number(loadFactor.toFixed(4)),
        passengerCount,
        crowdingLevel: getCrowdingLevel(loadFactor),
        isDetour: trip.isDetour,
        timestamp: formatTime(actualTime),
      });
    });
  });

  return records;
}

export function generateCardRecords(
  routes: Route[],
  trips: Trip[],
  arrivalRecords: ArrivalRecord[],
  date: Date
): CardRecord[] {
  const records: CardRecord[] = [];

  trips.forEach((trip) => {
    const tripArrivals = arrivalRecords.filter((a) => a.tripId === trip.id);
    if (tripArrivals.length === 0) return;

    const passengerCount = Math.floor(
      tripArrivals.reduce((sum, a) => sum + a.passengerCount, 0) / tripArrivals.length * 1.5
    );

    for (let p = 0; p < passengerCount; p++) {
      const onIdx = Math.floor(Math.random() * (tripArrivals.length - 1));
      const offIdx = onIdx + 1 + Math.floor(Math.random() * (tripArrivals.length - onIdx - 1));
      const onArrival = tripArrivals[onIdx];
      const offArrival = tripArrivals[offIdx];

      const passengerType = getRandomElement(["adult", "student", "senior", "child"]) as CardRecord["passengerType"];
      const baseFare = 2;
      const distanceFare = (offIdx - onIdx) * 0.5;
      const fare = passengerType === "adult"
        ? baseFare + distanceFare
        : passengerType === "student"
          ? (baseFare + distanceFare) * 0.5
          : passengerType === "senior"
            ? 0
            : (baseFare + distanceFare) * 0.5;

      records.push({
        id: generateId("card"),
        cardId: `CARD-${String(Math.floor(Math.random() * 100000)).padStart(6, "0")}`,
        routeId: trip.routeId,
        stationId: onArrival.stationId,
        stationName: onArrival.stationName,
        tripId: trip.id,
        tapType: "on",
        timestamp: onArrival.actualTime,
        fare: Number(fare.toFixed(2)),
        passengerType,
      });

      if (offArrival) {
        records.push({
          id: generateId("card"),
          cardId: `CARD-${String(Math.floor(Math.random() * 100000)).padStart(6, "0")}`,
          routeId: trip.routeId,
          stationId: offArrival.stationId,
          stationName: offArrival.stationName,
          tripId: trip.id,
          tapType: "off",
          timestamp: offArrival.actualTime,
          fare: 0,
          passengerType,
        });
      }
    }
  });

  return records;
}

export function generateComplaints(
  routes: Route[],
  trips: Trip[],
  arrivalRecords: ArrivalRecord[],
  date: Date
): Complaint[] {
  const complaints: Complaint[] = [];
  const complaintCount = 15 + Math.floor(Math.random() * 20);
  const categories = ["crowding", "delay", "driver", "vehicle", "other"];

  for (let i = 0; i < complaintCount; i++) {
    const trip = getRandomElement(trips);
    const tripArrivals = arrivalRecords.filter((a) => a.tripId === trip.id);
    const arrival = tripArrivals.length > 0 ? getRandomElement(tripArrivals) : undefined;
    const category = getRandomElement(categories);

    const descriptions: Record<string, string[]> = {
      crowding: [
        "车辆过于拥挤，无法上车",
        "早高峰期间满载率过高",
        "车厢内人太多，无法移动",
      ],
      delay: [
        "晚点严重，等待超过30分钟",
        "发车间隔不稳定",
        "车辆未按时到站",
      ],
      driver: [
        "司机服务态度不好",
        "司机开车不稳",
        "司机到站不停车",
      ],
      vehicle: [
        "车辆空调故障",
        "车辆卫生差",
        "座椅损坏",
      ],
      other: [
        "其他问题",
        "线路规划不合理",
        "站点标识不清晰",
      ],
    };

    complaints.push({
      id: generateId("complaint"),
      routeId: trip.routeId,
      routeName: trip.routeName,
      stationId: arrival?.stationId,
      stationName: arrival?.stationName,
      tripId: trip.id,
      category: category as Complaint["category"],
      description: getRandomElement(descriptions[category]),
      timestamp: arrival
        ? arrival.timestamp
        : formatTime(addMinutes(new Date(trip.startTime), Math.random() * 30)),
      status: getRandomElement(["open", "resolved", "closed"]),
      reporterContact: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`,
    });
  }

  return complaints;
}

export function generateWeatherRecords(date: Date): WeatherRecord[] {
  const records: WeatherRecord[] = [];
  const conditions = ["sunny", "cloudy", "rainy", "stormy", "snowy"];

  for (let hour = 0; hour < 24; hour++) {
    const time = new Date(date);
    time.setHours(hour, 0, 0, 0);

    const baseTemp = 15 + Math.sin((hour - 6) / 24 * Math.PI * 2) * 10;
    const condition = hour >= 6 && hour <= 18
      ? getRandomElement(conditions)
      : getRandomElement(["sunny", "cloudy"]);

    records.push({
      id: generateId("weather"),
      timestamp: formatTime(time),
      date: time.toISOString().split("T")[0],
      hour,
      condition: condition as WeatherRecord["condition"],
      temperature: Number((baseTemp + Math.random() * 3).toFixed(1)),
      precipitation: condition === "rainy" || condition === "stormy"
        ? Number((Math.random() * 20).toFixed(2))
        : 0,
      windSpeed: Number((5 + Math.random() * 15).toFixed(1)),
      visibility: condition === "stormy" || condition === "snowy"
        ? Number((2 + Math.random() * 3).toFixed(1))
        : Number((8 + Math.random() * 7).toFixed(1)),
    });
  }

  return records;
}

export function generateAnomalies(
  routes: Route[],
  trips: Trip[],
  arrivalRecords: ArrivalRecord[],
  complaints: Complaint[]
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  arrivalRecords
    .filter((a) => a.delaySeconds > 300 && !a.isDetour)
    .slice(0, 8)
    .forEach((arrival) => {
      anomalies.push({
        id: generateId("anomaly"),
        type: "delay",
        routeId: arrival.routeId,
        stationId: arrival.stationId,
        tripId: arrival.tripId,
        timestamp: arrival.timestamp,
        severity: arrival.delaySeconds > 600 ? "high" : "medium",
        description: `晚点${Math.round(arrival.delaySeconds / 60)}分钟`,
        resolved: Math.random() > 0.5,
      });
    });

  arrivalRecords
    .filter((a) => a.crowdingLevel === "extreme")
    .slice(0, 10)
    .forEach((arrival) => {
      anomalies.push({
        id: generateId("anomaly"),
        type: "crowding",
        routeId: arrival.routeId,
        stationId: arrival.stationId,
        tripId: arrival.tripId,
        timestamp: arrival.timestamp,
        severity: "high",
        description: `极度拥挤，满载率${Math.round(arrival.loadFactor * 100)}%`,
        resolved: Math.random() > 0.6,
      });
    });

  trips
    .filter((t) => t.isDetour)
    .slice(0, 5)
    .forEach((trip) => {
      anomalies.push({
        id: generateId("anomaly"),
        type: "detour",
        routeId: trip.routeId,
        tripId: trip.id,
        timestamp: trip.startTime,
        severity: "medium",
        description: `临时绕行：${trip.detourReason}`,
        resolved: false,
      });
    });

  if (complaints.length > 5) {
    const routeComplaintCounts: Record<string, number> = {};
    complaints.forEach((c) => {
      routeComplaintCounts[c.routeId] = (routeComplaintCounts[c.routeId] || 0) + 1;
    });

    Object.entries(routeComplaintCounts)
      .filter(([, count]) => count >= 3)
      .forEach(([routeId, count]) => {
        const route = routes.find((r) => r.id === routeId);
        anomalies.push({
          id: generateId("anomaly"),
          type: "complaint_spike",
          routeId,
          timestamp: complaints[0].timestamp,
          severity: count >= 5 ? "high" : "medium",
          description: `${route?.name}投诉量突增，共${count}条`,
          resolved: false,
        });
      });
  }

  return anomalies;
}

export function generateDetourInfos(trips: Trip[]): DetourInfo[] {
  return trips
    .filter((t) => t.isDetour)
    .map((trip) => ({
      id: generateId("detour"),
      tripId: trip.id,
      routeId: trip.routeId,
      originalRoute: ["station_1", "station_2", "station_3", "station_4"],
      detourRoute: ["station_1", "station_5", "station_6", "station_4"],
      reason: trip.detourReason || "临时绕行",
      startTime: trip.startTime,
      endTime: trip.endTime,
      affectedStations: ["station_2", "station_3"],
    }));
}

export function generateAllData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stations = generateStations();
  const routes = generateRoutes(stations);
  const trips = generateTrips(routes, today);
  const arrivalRecords = generateArrivalRecords(routes, trips, today);
  const cardRecords = generateCardRecords(routes, trips, arrivalRecords, today);
  const complaints = generateComplaints(routes, trips, arrivalRecords, today);
  const weatherRecords = generateWeatherRecords(today);
  const anomalies = generateAnomalies(routes, trips, arrivalRecords, complaints);
  const detourInfos = generateDetourInfos(trips);

  return {
    stations,
    routes,
    trips,
    arrivalRecords,
    cardRecords,
    complaints,
    weatherRecords,
    anomalies,
    detourInfos,
  };
}
