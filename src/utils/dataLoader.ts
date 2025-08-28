import { Equipment, Site, Rental, Client, EquipmentTracking, Maintenance } from '../types';
import { parseCSV } from './csvParser';

// Import CSV files as text
import equipmentCSV from '../data/EQUIPMENT.csv?raw';
import sitesCSV from '../data/SITES.csv?raw';
import rentalsCSV from '../data/RENTALS.csv?raw';
import clientCSV from '../data/CLIENT.csv?raw';
import trackingCSV from '../data/EQUIPMENT_TRACKING.csv?raw';
import maintenanceCSV from '../data/MAINTENANCE.csv?raw';

export const equipment: Equipment[] = parseCSV<Equipment>(equipmentCSV);
export const sites: Site[] = parseCSV<Site>(sitesCSV);
export const rentals: Rental[] = parseCSV<Rental>(rentalsCSV);
export const clients: Client[] = parseCSV<Client>(clientCSV);
export const equipmentTracking: EquipmentTracking[] = parseCSV<EquipmentTracking>(trackingCSV);
export const maintenance: Maintenance[] = parseCSV<Maintenance>(maintenanceCSV);