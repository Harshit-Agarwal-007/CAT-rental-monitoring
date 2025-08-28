import React, { useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  equipment,
  sites,
  rentals,
  equipmentTracking,
} from '../utils/dataLoader';
import { calculateDistance, generateAlerts } from '../utils/calculations';
import { MapPin, AlertTriangle, CheckCircle, Navigation } from 'lucide-react';

const GPS: React.FC = () => {
  const [selectedSite, setSelectedSite] = useState<number | null>(null);

  const geofenceAlerts = generateAlerts().filter(
    (alert) => alert.type === 'geofence'
  );

  // Calculate geofence violations
  const geofenceData = equipmentTracking
    .map((tracking) => {
      const rental = rentals.find(
        (r) => r.equipment_id === tracking.equipment_id && r.status === 'active'
      );
      if (!rental) return null;

      const site = sites.find((s) => s.site_id === rental.site_id);
      if (!site) {
        console.warn(
          `No site found for equipment ${tracking.equipment_id} (rental.site_id = ${rental.site_id})`
        );
        return null;
      }

      const distance = calculateDistance(
        tracking.latitude,
        tracking.longitude,
        site.latitude,
        site.longitude
      );

      const equipmentData = equipment.find(
        (eq) => eq.equipment_id === tracking.equipment_id
      );

      return {
        equipment_code: equipmentData?.equipment_code || 'Unknown',
        equipment_id: tracking.equipment_id,
        site_name: site.site_name,
        distance: Math.round(distance),
        geofence_radius: site.geofence_radius_meters,
        violation: distance > site.geofence_radius_meters + 150,
        latitude: tracking.latitude,
        longitude: tracking.longitude,
        site_latitude: site.latitude,
        site_longitude: site.longitude,
        timestamp: tracking.timestamp,
      };
    })
    .filter(Boolean);

  // Site overview data
  const siteOverview = sites.map((site) => {
    const activeEquipment = rentals.filter(
      (r) => r.site_id === site.site_id && r.status === 'active'
    );
    const violations = geofenceData.filter(
      (gd) => gd && gd.site_name === site.site_name && gd.violation
    );

    return {
      site_name: site.site_name,
      active_equipment: activeEquipment.length,
      violations: violations.length,
      geofence_radius: site.geofence_radius_meters,
    };
  });

  // Equipment positions for scatter plot
  const positionData = geofenceData
    .map(
      (gd) =>
        gd && {
          x: gd.longitude,
          y: gd.latitude,
          equipment: gd.equipment_code,
          violation: gd.violation,
          distance: gd.distance,
          fill: gd.violation ? '#FFD700' : '#A9A9A9', // yellow if violation, dark gray if safe
        }
    )
    .filter(Boolean);

  return (
    <div className="space-y-6 bg-black text-yellow-400 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-yellow-400">
          GPS Tracking & Geofencing
        </h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle className="h-4 w-4 text-white" />
            <span className="text-white">
              {geofenceData.filter((gd) => gd && !gd.violation).length} Within
              Zone
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400">
              {geofenceAlerts.length} Violations
            </span>
          </div>
        </div>
      </div>

      {/* Geofence Alerts */}
      {geofenceAlerts.length > 0 && (
        <div className="bg-gray-900 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
            <h3 className="text-lg font-medium text-yellow-400">
              Geofence Violations
            </h3>
          </div>
          <div className="space-y-2">
            {geofenceAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="text-sm text-yellow-400 bg-gray-800 p-2 rounded"
              >
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Site Overview */}
        <div className="bg-gray-900 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">
            Site Overview
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={siteOverview}>
              <CartesianGrid strokeDasharray="3 3" stroke="#555" />
              <XAxis
                dataKey="site_name"
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="#FFD700"
              />
              <YAxis stroke="#FFD700" />
              <Tooltip
                contentStyle={{ backgroundColor: '#222', color: '#FFD700' }}
              />
              <Bar
                dataKey="active_equipment"
                fill="#A9A9A9"
                name="Active Equipment"
              />
              <Bar dataKey="violations" fill="#FFD700" name="Violations" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Equipment Positions */}
        <div className="bg-gray-900 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">
            Equipment Positions
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#555" />
              <XAxis dataKey="x" name="Longitude" stroke="#FFD700" />
              <YAxis dataKey="y" name="Latitude" stroke="#FFD700" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-gray-900 p-3 border border-yellow-400 rounded shadow-lg text-yellow-400">
                        <p className="font-semibold">{data.equipment}</p>
                        <p className="text-sm">Distance: {data.distance}m</p>
                        <p
                          className={`text-sm ${
                            data.violation ? 'text-yellow-400' : 'text-white'
                          }`}
                        >
                          {data.violation
                            ? 'Outside Geofence'
                            : 'Within Geofence'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter data={positionData} shape="circle" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Tracking Table */}
      <div className="bg-gray-900 rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-yellow-400">
            Equipment Location Status
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                {[
                  'Equipment',
                  'Site',
                  'Distance from Site',
                  'Geofence Status',
                  'Last Update',
                  'Coordinates',
                ].map((head) => (
                  <th
                    key={head}
                    className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {geofenceData.slice(0, 15).map(
                (item, index) =>
                  item && (
                    <tr key={index} className="hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-yellow-400">
                          {item.equipment_code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {item.site_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {item.distance}m
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.violation ? (
                            <>
                              <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2" />
                              <span className="text-yellow-400 font-medium">
                                Outside Zone
                              </span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 text-white mr-2" />
                              <span className="text-white font-medium">
                                Within Zone
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        <div className="flex items-center">
                          <Navigation className="h-3 w-3 mr-1 text-yellow-400" />
                          {item.latitude.toFixed(4)},{' '}
                          {item.longitude.toFixed(4)}
                        </div>
                      </td>
                    </tr>
                  )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GPS;
