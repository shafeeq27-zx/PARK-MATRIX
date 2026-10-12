export type VehicleType = 'Bike' | 'Car' | 'Van' | 'Truck';

export type SlotStatus = 'Available' | 'Occupied' | 'Maintenance';

export interface ParkingSlot {
  id: string;
  slot_number: string;
  slot_type: VehicleType;
  status: SlotStatus;
  floor: string;
}

export interface ParkingRecord {
  id: number;
  reg_number: string;
  vehicle_type: VehicleType;
  owner_name: string;
  contact_number: string;
  slot_number: string;
  entry_time: string;
  exit_time?: string;
  duration_hours?: number;
  fee?: number;
  payment_status: 'Paid' | 'Pending';
  status: 'Active' | 'Completed';
}

export interface TariffRate {
  vehicle_type: VehicleType;
  hourly_rate: number;
  description: string;
}

export type ActiveTab = 
  | 'dashboard' 
  | 'entry' 
  | 'exit' 
  | 'slots' 
  | 'history' 
  | 'reports' 
  | 'settings'
  | 'code';
