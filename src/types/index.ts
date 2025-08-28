export interface Equipment {
  equipment_id: number;
  equipment_code: string;
  type: string;
  status: string;
  ideal_fuel_usage_per_hour: number;
  recommended_service_period: number;
}

export interface Site {
  site_id: number;
  site_name: string;
  location: string;
  client_id: number;
  latitude: number;
  longitude: number;
  geofence_radius_meters: number;
}

export interface Rental {
  rental_id: number;
  equipment_id: number;
  client_id: number;
  site_id: number;
  check_out_date: string;
  expected_return_date: string;
  check_in_date?: string;
  engine_hours_per_day: number;
  idle_hours_per_day: number;
  operating_days: number;
  status: string;
  fuel_usage_per_hour: number;
}

export interface Client {
  client_id: number;
  client_name: string;
  reliability_score: number;
  past_delays_count: number;
  historical_demand: string;
  avg_monthly_demand: number;
  delay_history: number;
  forecasted_weather_risk: number;
  war_risk: number;
  demand_trend: string;
  forecasted_demand: number;
}

export interface EquipmentTracking {
  tracking_id: number;
  equipment_id: number;
  timestamp: string;
  latitude: number;
  longitude: number;
}

export interface Maintenance {
  maintenance_id: number;
  equipment_id: number;
  service_date: string;
  service_logs: string;
}

export interface Alert {
  id: string;
  type: 'fuel' | 'service' | 'geofence' | 'rental_due';
  equipment_id?: number;
  client_id?: number;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  resolved: boolean;
}