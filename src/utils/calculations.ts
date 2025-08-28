import { differenceInDays, parseISO } from 'date-fns';
import {
  equipment,
  sites,
  rentals,
  clients,
  equipmentTracking,
} from './dataLoader';
import { Alert } from '../types';

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth’s radius in meters

  // ✅ Ensure inputs are valid numbers
  if (
    [lat1, lon1, lat2, lon2].some(
      (v) => typeof v !== 'number' || isNaN(v) || v < -180 || v > 180
    )
  ) {
    console.warn('Invalid coordinates:', { lat1, lon1, lat2, lon2 });
    return NaN;
  }

  // ✅ Convert degrees → radians
  const φ1 = (lat1 * Math.PI) / 180000;
  const φ2 = (lat2 * Math.PI) / 180000;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180000;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180000;

  // ✅ Haversine formula
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Generate alerts based on business rules
export function generateAlerts(): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  // Fuel usage alerts
  rentals.forEach((rental) => {
    if (rental.status === 'active') {
      const equipmentData = equipment.find(
        (eq) => eq.equipment_id === rental.equipment_id
      );
      if (equipmentData) {
        const fuelDiff = Math.abs(
          rental.fuel_usage_per_hour - equipmentData.ideal_fuel_usage_per_hour
        );
        if (fuelDiff > 10) {
          alerts.push({
            id: `fuel-${rental.rental_id}`,
            type: 'fuel',
            equipment_id: rental.equipment_id,
            message: `Equipment ${
              equipmentData.equipment_code
            } fuel usage deviation: ${fuelDiff.toFixed(1)}L/hr`,
            severity: fuelDiff > 15 ? 'high' : 'medium',
            timestamp: now.toISOString(),
            resolved: false,
          });
        }
      }
    }
  });

  // Service alerts (every 30 days)
  rentals.forEach((rental) => {
    if (rental.status === 'active') {
      const checkOutDate = parseISO(rental.check_out_date);
      const daysSinceCheckout = differenceInDays(now, checkOutDate);

      if (daysSinceCheckout >= 30 && daysSinceCheckout % 30 === 0) {
        const equipmentData = equipment.find(
          (eq) => eq.equipment_id === rental.equipment_id
        );
        alerts.push({
          id: `service-${rental.rental_id}`,
          type: 'service',
          equipment_id: rental.equipment_id,
          message: `Equipment ${equipmentData?.equipment_code} requires service (${daysSinceCheckout} days)`,
          severity: 'medium',
          timestamp: now.toISOString(),
          resolved: false,
        });
      }
    }
  });

  // Geofence alerts
  equipmentTracking.forEach((tracking) => {
    const rental = rentals.find(
      (r) => r.equipment_id === tracking.equipment_id && r.status === 'active'
    );
    if (rental) {
      const site = sites.find((s) => s.site_id === rental.site_id);
      if (site) {
        const distance = calculateDistance(
          tracking.latitude,
          tracking.longitude,
          site.latitude,
          site.longitude
        );

        if (distance > site.geofence_radius_meters + 150) {
          const equipmentData = equipment.find(
            (eq) => eq.equipment_id === tracking.equipment_id
          );
          alerts.push({
            id: `geofence-${tracking.tracking_id}`,
            type: 'geofence',
            equipment_id: tracking.equipment_id,
            message: `Equipment ${
              equipmentData?.equipment_code
            } is ${Math.round(distance)}m from site (${Math.round(
              distance - site.geofence_radius_meters
            )}m outside geofence)`,
            severity: 'high',
            timestamp: tracking.timestamp,
            resolved: false,
          });
        }
      }
    }
  });

  // Rental due alerts
  rentals.forEach((rental) => {
    if (rental.status === 'active') {
      const returnDate = parseISO(rental.expected_return_date);
      const daysUntilReturn = differenceInDays(returnDate, now);

      if (daysUntilReturn <= 3 && daysUntilReturn >= 0) {
        const equipmentData = equipment.find(
          (eq) => eq.equipment_id === rental.equipment_id
        );
        const clientData = clients.find(
          (c) => c.client_id === rental.client_id
        );
        alerts.push({
          id: `rental-due-${rental.rental_id}`,
          type: 'rental_due',
          equipment_id: rental.equipment_id,
          client_id: rental.client_id,
          message: `Rental for ${equipmentData?.equipment_code} (${clientData?.client_name}) due in ${daysUntilReturn} days`,
          severity: daysUntilReturn === 0 ? 'high' : 'medium',
          timestamp: now.toISOString(),
          resolved: false,
        });
      }
    }
  });

  return alerts;
}

// Calculate equipment utilization
export function calculateUtilization(equipmentId: number): number {
  const rental = rentals.find(
    (r) => r.equipment_id === equipmentId && r.status === 'active'
  );
  if (!rental) return 0;

  const totalHours = rental.engine_hours_per_day + rental.idle_hours_per_day;
  return totalHours > 0 ? (rental.engine_hours_per_day / totalHours) * 100 : 0;
}
