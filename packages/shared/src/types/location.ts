export type LocationType = "STORAGE" | "PICKING" | "RECEIVING" | "SHIPPING" | "PROCESSING" | "RETURN";
export type LocationStatus = "ACTIVE" | "INACTIVE" | "FULL" | "LOCKED";

export interface Location {
  _id: string;
  code: string;
  name: string;
  zone: string;
  aisle: string;
  shelf: string;
  layer: string;
  position: string;
  type: LocationType;
  status: LocationStatus;
  temperatureZone: "FROZEN" | "CHILLED" | "NORMAL";
  maxCapacity: number;
  currentCapacity: number;
  capacityUnit: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationCreateInput {
  code: string;
  name: string;
  zone: string;
  aisle: string;
  shelf: string;
  layer: string;
  position: string;
  type: LocationType;
  temperatureZone: "FROZEN" | "CHILLED" | "NORMAL";
  maxCapacity: number;
  capacityUnit: string;
  description?: string;
}
