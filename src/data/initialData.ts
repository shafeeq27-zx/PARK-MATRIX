import { ParkingSlot, ParkingRecord, TariffRate, VehicleType } from '../types';

export const INITIAL_RATES: TariffRate[] = [
  { vehicle_type: 'Bike', hourly_rate: 2.0, description: 'Motorcycles & Scooters' },
  { vehicle_type: 'Car', hourly_rate: 5.0, description: 'Sedans, Hatchbacks & SUVs' },
  { vehicle_type: 'Van', hourly_rate: 8.0, description: 'Commercial Vans & Minivans' },
  { vehicle_type: 'Truck', hourly_rate: 12.0, description: 'Heavy Trucks & Buses' },
];

export const generateInitialSlots = (): ParkingSlot[] => {
  const slots: ParkingSlot[] = [];

  // 10 Bike slots
  for (let i = 1; i <= 10; i++) {
    const num = `B-${i.toString().padStart(2, '0')}`;
    slots.push({
      id: `slot-${num}`,
      slot_number: num,
      slot_type: 'Bike',
      status: i <= 2 ? 'Occupied' : 'Available',
      floor: 'Zone A - Ground Floor',
    });
  }

  // 20 Car slots
  for (let i = 1; i <= 20; i++) {
    const num = `C-${i.toString().padStart(2, '0')}`;
    slots.push({
      id: `slot-${num}`,
      slot_number: num,
      slot_type: 'Car',
      status: i <= 3 ? 'Occupied' : i === 19 ? 'Maintenance' : 'Available',
      floor: 'Zone B - Ground Floor',
    });
  }

  // 6 Van slots
  for (let i = 1; i <= 6; i++) {
    const num = `V-${i.toString().padStart(2, '0')}`;
    slots.push({
      id: `slot-${num}`,
      slot_number: num,
      slot_type: 'Van',
      status: i === 1 ? 'Occupied' : 'Available',
      floor: 'Zone C - Open Bay',
    });
  }

  // 4 Truck slots
  for (let i = 1; i <= 4; i++) {
    const num = `T-${i.toString().padStart(2, '0')}`;
    slots.push({
      id: `slot-${num}`,
      slot_number: num,
      slot_type: 'Truck',
      status: 'Available',
      floor: 'Zone D - Heavy Cargo Bay',
    });
  }

  return slots;
};

export const getInitialRecords = (): ParkingRecord[] => {
  const now = new Date();
  
  const formatTime = (d: Date) => {
    return d.toISOString().replace('T', ' ').substring(0, 19);
  };

  const hoursAgo = (h: number, m: number = 0) => {
    const d = new Date(now.getTime() - (h * 60 + m) * 60 * 1000);
    return formatTime(d);
  };

  return [
    // Currently Active
    {
      id: 101,
      reg_number: 'KA-01-AB-1234',
      vehicle_type: 'Car',
      owner_name: 'Rahul Sharma',
      contact_number: '9876543210',
      slot_number: 'C-01',
      entry_time: hoursAgo(3, 15),
      status: 'Active',
      payment_status: 'Pending',
    },
    {
      id: 102,
      reg_number: 'MH-12-CD-5678',
      vehicle_type: 'Bike',
      owner_name: 'Priya Patel',
      contact_number: '9123456780',
      slot_number: 'B-01',
      entry_time: hoursAgo(1, 45),
      status: 'Active',
      payment_status: 'Pending',
    },
    {
      id: 103,
      reg_number: 'DL-04-EF-9012',
      vehicle_type: 'Car',
      owner_name: 'Amit Verma',
      contact_number: '9988776655',
      slot_number: 'C-02',
      entry_time: hoursAgo(4, 20),
      status: 'Active',
      payment_status: 'Pending',
    },
    {
      id: 104,
      reg_number: 'TN-09-GH-3456',
      vehicle_type: 'Van',
      owner_name: 'City Logistics Corp',
      contact_number: '9871122334',
      slot_number: 'V-01',
      entry_time: hoursAgo(2, 30),
      status: 'Active',
      payment_status: 'Pending',
    },
    {
      id: 105,
      reg_number: 'KA-05-JK-7890',
      vehicle_type: 'Bike',
      owner_name: 'Sneha Kulkarni',
      contact_number: '9765432109',
      slot_number: 'B-02',
      entry_time: hoursAgo(0, 45),
      status: 'Active',
      payment_status: 'Pending',
    },
    {
      id: 106,
      reg_number: 'MH-03-XY-9988',
      vehicle_type: 'Car',
      owner_name: 'Deepak Joshi',
      contact_number: '9822001122',
      slot_number: 'C-03',
      entry_time: hoursAgo(5, 5),
      status: 'Active',
      payment_status: 'Pending',
    },

    // Completed Today
    {
      id: 107,
      reg_number: 'KA-03-LM-4321',
      vehicle_type: 'Car',
      owner_name: 'Vikram Rao',
      contact_number: '9845123456',
      slot_number: 'C-05',
      entry_time: hoursAgo(6, 0),
      exit_time: hoursAgo(2, 0),
      duration_hours: 4,
      fee: 20.0,
      payment_status: 'Paid',
      status: 'Completed',
    },
    {
      id: 108,
      reg_number: 'MH-02-PQ-8765',
      vehicle_type: 'Bike',
      owner_name: 'Karan Mehta',
      contact_number: '9819876543',
      slot_number: 'B-04',
      entry_time: hoursAgo(4, 30),
      exit_time: hoursAgo(1, 15),
      duration_hours: 4,
      fee: 8.0,
      payment_status: 'Paid',
      status: 'Completed',
    },
    {
      id: 109,
      reg_number: 'DL-01-RS-2109',
      vehicle_type: 'Truck',
      owner_name: 'North Cargo Movers',
      contact_number: '9910022334',
      slot_number: 'T-01',
      entry_time: hoursAgo(8, 0),
      exit_time: hoursAgo(3, 0),
      duration_hours: 5,
      fee: 60.0,
      payment_status: 'Paid',
      status: 'Completed',
    },
    {
      id: 110,
      reg_number: 'HR-26-TU-6543',
      vehicle_type: 'Car',
      owner_name: 'Ananya Roy',
      contact_number: '9811224466',
      slot_number: 'C-08',
      entry_time: hoursAgo(27, 0),
      exit_time: hoursAgo(24, 0),
      duration_hours: 3,
      fee: 15.0,
      payment_status: 'Paid',
      status: 'Completed',
    },
    {
      id: 111,
      reg_number: 'KA-04-VW-0987',
      vehicle_type: 'Van',
      owner_name: 'Express Delivery Co',
      contact_number: '9844332211',
      slot_number: 'V-03',
      entry_time: hoursAgo(29, 0),
      exit_time: hoursAgo(25, 0),
      duration_hours: 4,
      fee: 32.0,
      payment_status: 'Paid',
      status: 'Completed',
    },

    // Additional Historical Records Across Current Year for Monthly Reporting
    {
      id: 112,
      reg_number: 'DL-02-JK-1122',
      vehicle_type: 'Car',
      owner_name: 'Rajesh Khanna',
      contact_number: '9812345001',
      slot_number: 'C-04',
      entry_time: `${now.getFullYear()}-01-14 09:15:00`,
      exit_time: `${now.getFullYear()}-01-14 14:15:00`,
      duration_hours: 5,
      fee: 25.0,
      payment_status: 'Paid',
      status: 'Completed',
    },
    {
      id: 113,
      reg_number: 'MH-04-TR-8899',
      vehicle_type: 'Truck',
      owner_name: 'Western Freight Express',
      contact_number: '9812345002',
      slot_number: 'T-02',
      entry_time: `${now.getFullYear()}-01-22 08:00:00`,
      exit_time: `${now.getFullYear()}-01-22 16:00:00`,
      duration_hours: 8,
      fee: 96.0,
      payment_status: 'Paid',
      status: 'Completed',
    },
    {
      id: 114,
      reg_number: 'KA-01-MN-3344',
      vehicle_type: 'Car',
      owner_name: 'Sunil Gavaskar',
      contact_number: '9812345003',
      slot_number: 'C-06',
      entry_time: `${now.getFullYear()}-02-10 11:00:00`,
      exit_time: `${now.getFullYear()}-02-10 15:30:00`,
      duration_hours: 5,
      fee: 25.0,
      payment_status: 'Paid',
      status: 'Completed',
    },
    {
      id: 115,
      reg_number: 'TN-07-ZZ-7766',
      vehicle_type: 'Van',
      owner_name: 'South Parcel Courier',
      contact_number: '9812345004',
      slot_number: 'V-02',
      entry_time: `${now.getFullYear()}-02-18 10:20:00`,
      exit_time: `${now.getFullYear()}-02-18 17:20:00`,
      duration_hours: 7,
      fee: 56.0,
      payment_status: 'Paid',
      status: 'Completed',
    },
    {
      id: 116,
      reg_number: 'KA-05-AA-5566',
      vehicle_type: 'Bike',
      owner_name: 'Arjun Das',
      contact_number: '9812345005',
      slot_number: 'B-03',
      entry_time: `${now.getFullYear()}-03-05 08:30:00`,
      exit_time: `${now.getFullYear()}-03-05 14:30:00`,
      duration_hours: 6,
      fee: 12.0,
      payment_status: 'Paid',
      status: 'Completed',
    },
    {
      id: 117,
      reg_number: 'MH-12-GG-9900',
      vehicle_type: 'Car',
      owner_name: 'Nitin Gadkari',
      contact_number: '9812345006',
      slot_number: 'C-07',
      entry_time: `${now.getFullYear()}-03-24 13:00:00`,
      exit_time: `${now.getFullYear()}-03-24 18:00:00`,
      duration_hours: 5,
      fee: 25.0,
      payment_status: 'Paid',
      status: 'Completed',
    },
    {
      id: 118,
      reg_number: 'DL-08-CC-4455',
      vehicle_type: 'Truck',
      owner_name: 'Capital Cargo Logistics',
      contact_number: '9812345007',
      slot_number: 'T-03',
      entry_time: `${now.getFullYear()}-04-12 07:00:00`,
      exit_time: `${now.getFullYear()}-04-12 15:00:00`,
      duration_hours: 8,
      fee: 96.0,
      payment_status: 'Paid',
      status: 'Completed',
    },
    {
      id: 119,
      reg_number: 'KA-03-BB-8877',
      vehicle_type: 'Car',
      owner_name: 'Meera Nambiar',
      contact_number: '9812345008',
      slot_number: 'C-09',
      entry_time: `${now.getFullYear()}-05-08 09:40:00`,
      exit_time: `${now.getFullYear()}-05-08 16:40:00`,
      duration_hours: 7,
      fee: 35.0,
      payment_status: 'Paid',
      status: 'Completed',
    },
    {
      id: 120,
      reg_number: 'HR-26-EE-2211',
      vehicle_type: 'Van',
      owner_name: 'Metro Wholesale Traders',
      contact_number: '9812345009',
      slot_number: 'V-04',
      entry_time: `${now.getFullYear()}-06-19 11:15:00`,
      exit_time: `${now.getFullYear()}-06-19 18:15:00`,
      duration_hours: 7,
      fee: 56.0,
      payment_status: 'Paid',
      status: 'Completed',
    },
    {
      id: 121,
      reg_number: 'KA-01-FF-6655',
      vehicle_type: 'Car',
      owner_name: 'Suresh Raina',
      contact_number: '9812345010',
      slot_number: 'C-10',
      entry_time: `${now.getFullYear()}-07-15 08:30:00`,
      exit_time: `${now.getFullYear()}-07-15 17:30:00`,
      duration_hours: 9,
      fee: 45.0,
      payment_status: 'Paid',
      status: 'Completed',
    },
    {
      id: 122,
      reg_number: 'MH-01-HH-3322',
      vehicle_type: 'Truck',
      owner_name: 'Maharashtra Heavy Haulers',
      contact_number: '9812345011',
      slot_number: 'T-04',
      entry_time: `${now.getFullYear()}-08-20 06:00:00`,
      exit_time: `${now.getFullYear()}-08-20 18:00:00`,
      duration_hours: 12,
      fee: 144.0,
      payment_status: 'Paid',
      status: 'Completed',
    },
    {
      id: 123,
      reg_number: 'TN-02-JJ-4433',
      vehicle_type: 'Car',
      owner_name: 'Karthik Subramaniam',
      contact_number: '9812345012',
      slot_number: 'C-11',
      entry_time: `${now.getFullYear()}-09-11 10:00:00`,
      exit_time: `${now.getFullYear()}-09-11 16:00:00`,
      duration_hours: 6,
      fee: 30.0,
      payment_status: 'Paid',
      status: 'Completed',
    },
  ];
};
