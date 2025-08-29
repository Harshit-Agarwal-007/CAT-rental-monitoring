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
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  equipment,
  sites,
  rentals,
  equipmentTracking,
  clients as allClients
} from '../utils/dataLoader';
import { calculateDistance, generateAlerts } from '../utils/calculations';
import { MapPin, AlertTriangle, CheckCircle, Navigation, TrendingUp, Calendar, Fuel, Wrench } from 'lucide-react';

const GPS: React.FC = () => {
  const [selectedSite, setSelectedSite] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<string>('24h'); // '1h', '6h', '24h', '7d'

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
        equipment_type: equipmentData?.type || 'Unknown',
        site_name: site.site_name,
        site_id: site.site_id,
        distance: Math.round(distance),
        geofence_radius: site.geofence_radius_meters,
        violation: distance > site.geofence_radius_meters + 150,
        latitude: tracking.latitude,
        longitude: tracking.longitude,
        site_latitude: site.latitude,
        site_longitude: site.longitude,
        timestamp: tracking.timestamp,
        client_id: rental.client_id,
        fuel_usage: rental.fuel_usage_per_hour,
        ideal_fuel_usage: equipmentData?.ideal_fuel_usage_per_hour || 0
      };
    })
    .filter(Boolean) as any[];

  // Site overview data
  const siteOverview = sites.map((site) => {
    const activeEquipment = rentals.filter(
      (r) => r.site_id === site.site_id && r.status === 'active'
    );
    const violations = geofenceData.filter(
      (gd) => gd && gd.site_name === site.site_name && gd.violation
    );

    // Get client info for this site
    const client = allClients.find(c => c.client_id === site.client_id);
    
    return {
      site_name: site.site_name,
      active_equipment: activeEquipment.length,
      violations: violations.length,
      geofence_radius: site.geofence_radius_meters,
      client_name: client?.client_name || 'Unknown',
      forecasted_demand: client ? Number(client.forecasted_demand.toFixed(2)) : 0,
      weather_risk: client?.forecasted_weather_risk || 0
    };
  });

  // Equipment positions for scatter plot with enhanced data
  const positionData = geofenceData
    .map((gd) => {
      // Get client info
      const client = allClients.find(c => c.client_id === gd.client_id);
      
      return {
        x: gd.longitude,
        y: gd.latitude,
        equipment: gd.equipment_code,
        equipment_type: gd.equipment_type,
        violation: gd.violation,
        distance: gd.distance,
        site: gd.site_name,
        client: client?.client_name || 'Unknown',
        fuel_deviation: Math.abs(gd.fuel_usage - gd.ideal_fuel_usage),
        latitude: gd.latitude,
        longitude: gd.longitude,
        fill: gd.violation ? '#FF6B6B' : '#4ECDC4', // Red if violation, teal if safe
        stroke: '#FFFFFF',
        strokeWidth: 1
      };
    })
    .filter(Boolean);

  // Generate suggestions based on various factors
  const generateSuggestions = () => {
    const suggestions = [];
    
    // 1. High weather risk sites
    const highWeatherRiskSites = siteOverview
      .filter(site => site.weather_risk > 0.5)
      .sort((a, b) => b.weather_risk - a.weather_risk);
    
    if (highWeatherRiskSites.length > 0) {
      suggestions.push({
        id: 'weather-risk',
        type: 'warning',
        title: 'Weather Risk Alert',
        message: `Sites ${highWeatherRiskSites.map(s => s.site_name).join(', ')} have high weather risk (${Math.round(highWeatherRiskSites[0].weather_risk * 100)}%). Consider equipment protection measures.`,
        priority: 'high',
        icon: 'weather'
      });
    }
    
    // 2. High fuel usage deviations
    const highFuelDeviations = positionData
      .filter(pos => pos.fuel_deviation > 5)
      .sort((a, b) => b.fuel_deviation - a.fuel_deviation);
    
    if (highFuelDeviations.length > 0) {
      suggestions.push({
        id: 'fuel-deviation',
        type: 'warning',
        title: 'Fuel Usage Anomaly',
        message: `Equipment ${highFuelDeviations[0].equipment} is consuming ${highFuelDeviations[0].fuel_deviation.toFixed(1)}L/hr more than expected. Investigate possible issues.`,
        priority: 'medium',
        icon: 'fuel'
      });
    }
    
    // 3. High distance from site
    const farFromSite = geofenceData
      .filter(gd => gd.distance > gd.geofence_radius * 2)
      .sort((a, b) => b.distance - a.distance);
    
    if (farFromSite.length > 0) {
      suggestions.push({
        id: 'distance-alert',
        type: 'warning',
        title: 'Equipment Far From Site',
        message: `Equipment ${farFromSite[0].equipment_code} is ${Math.round(farFromSite[0].distance/1000)}km from site. Verify if this is expected.`,
        priority: 'medium',
        icon: 'distance'
      });
    }
    
    // 4. High forecasted demand sites
    const highDemandSites = siteOverview
      .filter(site => site.forecasted_demand > 10)
      .sort((a, b) => b.forecasted_demand - a.forecasted_demand);
    
    if (highDemandSites.length > 0) {
      suggestions.push({
        id: 'high-demand',
        type: 'info',
        title: 'High Demand Forecast',
        message: `Site ${highDemandSites[0].site_name} has high forecasted demand (${highDemandSites[0].forecasted_demand} units). Prepare additional equipment.`,
        priority: 'medium',
        icon: 'demand'
      });
    }
    
    // 5. Sites with many violations
    const violationSites = siteOverview
      .filter(site => site.violations > 0)
      .sort((a, b) => b.violations - a.violations);
    
    if (violationSites.length > 0) {
      suggestions.push({
        id: 'violations',
        type: 'warning',
        title: 'Geofence Violations',
        message: `${violationSites[0].violations} equipment at ${violationSites[0].site_name} have geofence violations. Review site protocols.`,
        priority: 'high',
        icon: 'violation'
      });
    }
    
    return suggestions;
  };

  const suggestions = generateSuggestions();

  // Equipment type distribution for better visualization
  const equipmentTypeData = positionData.reduce((acc, item) => {
    if (!acc[item.equipment_type]) {
      acc[item.equipment_type] = { type: item.equipment_type, count: 0, violations: 0 };
    }
    acc[item.equipment_type].count++;
    if (item.violation) {
      acc[item.equipment_type].violations++;
    }
    return acc;
  }, {} as Record<string, any>);

  const equipmentTypeDistribution = Object.values(equipmentTypeData);

  // Custom tooltip for scatter chart
  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 p-4 border-2 border-yellow-400 rounded-lg shadow-lg text-yellow-400">
          <p className="font-bold text-lg mb-2">{data.equipment}</p>
          <div className="space-y-1">
            <p className="text-sm"><span className="font-medium">Type:</span> {data.equipment_type}</p>
            <p className="text-sm"><span className="font-medium">Site:</span> {data.site}</p>
            <p className="text-sm"><span className="font-medium">Client:</span> {data.client}</p>
            <p className="text-sm"><span className="font-medium">Distance:</span> {data.distance}m</p>
            <p className="text-sm"><span className="font-medium">Coordinates:</span> {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}</p>
            <p className="text-sm"><span className="font-medium">Fuel Deviation:</span> {data.fuel_deviation?.toFixed(1)}L/hr</p>
            <p className={`text-sm font-medium ${data.violation ? 'text-red-400' : 'text-green-400'}`}>
              {data.violation ? 'Outside Geofence' : 'Within Geofence'}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const violationPercentage = data.count > 0 ? Math.round((data.violations / data.count) * 100) : 0;
      return (
        <div className="bg-gray-900 p-3 border border-yellow-400 rounded shadow-lg">
          <p className="font-bold text-yellow-400">{data.type}</p>
          <p className="text-white text-sm">Total: {data.count} units</p>
          <p className="text-white text-sm">Violations: {data.violations} ({violationPercentage}%)</p>
        </div>
      );
    }
    return null;
  };

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

      {/* Suggestions Bar */}
      {suggestions.length > 0 && (
        <div className="bg-gray-900 border-l-4 border-yellow-400 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-yellow-400 mb-2">
            Smart Suggestions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.slice(0, 4).map((suggestion) => (
              <div 
                key={suggestion.id} 
                className={`p-3 rounded-lg ${
                  suggestion.type === 'warning' 
                    ? 'bg-red-900/30 border border-red-700' 
                    : 'bg-blue-900/30 border border-blue-700'
                }`}
              >
                <div className="flex items-start">
                  {suggestion.icon === 'weather' && <Wrench className="h-5 w-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />}
                  {suggestion.icon === 'fuel' && <Fuel className="h-5 w-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />}
                  {suggestion.icon === 'distance' && <Navigation className="h-5 w-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />}
                  {suggestion.icon === 'demand' && <TrendingUp className="h-5 w-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />}
                  {suggestion.icon === 'violation' && <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />}
                  <div>
                    <p className="font-medium text-yellow-400">{suggestion.title}</p>
                    <p className="text-sm text-gray-300">{suggestion.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Geofence Alerts */}
      {geofenceAlerts.length > 0 && (
        <div className="bg-gray-900 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-medium text-red-500">
              Geofence Violations
            </h3>
          </div>
          <div className="space-y-2">
            {geofenceAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="text-sm text-red-400 bg-gray-800 p-2 rounded"
              >
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Site Overview */}
        <div className="bg-gray-900 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">
            Site Overview
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={siteOverview} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#555" />
              <XAxis type="number" stroke="#FFD700" />
              <YAxis 
                dataKey="site_name" 
                type="category" 
                scale="band" 
                stroke="#FFD700" 
                width={80}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#222', color: '#FFD700', borderColor: '#FFD700' }}
              />
              <Legend />
              <Bar
                dataKey="active_equipment"
                fill="#4ECDC4"
                name="Active Equipment"
              />
              <Bar dataKey="violations" fill="#FF6B6B" name="Violations" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Equipment Positions with Enhanced Visualization */}
        <div className="bg-gray-900 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-yellow-400">
              Equipment Positions
            </h3>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-gray-800 text-yellow-400 border border-yellow-400 rounded px-2 py-1 text-sm"
            >
              <option value="1h">Last 1 Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#555" />
              <XAxis 
                dataKey="x" 
                name="Longitude" 
                stroke="#FFD700" 
                domain={['dataMin - 0.01', 'dataMax + 0.01']}
              />
              <YAxis 
                dataKey="y" 
                name="Latitude" 
                stroke="#FFD700" 
                domain={['dataMin - 0.01', 'dataMax + 0.01']}
              />
              <Tooltip content={<CustomScatterTooltip />} />
              <Scatter 
                data={positionData} 
                fill="#8884d8"
              >
                {positionData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill} 
                    stroke={entry.stroke}
                    strokeWidth={entry.strokeWidth}
                  />
                ))}
              </Scatter>
              <Legend />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Equipment Type Distribution */}
        <div className="bg-gray-900 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">
            Equipment Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={equipmentTypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, count }) => `${name}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="type"
              >
                {equipmentTypeDistribution.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={['#4ECDC4', '#FF6B6B', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][index % 6]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend 
                wrapperStyle={{ color: '#FFD700', fontSize: '12px' }}
              />
            </PieChart>
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
                  'Type',
                  'Site',
                  'Client',
                  'Distance from Site',
                  'Geofence Status',
                  'Fuel Deviation',
                  'Coordinates',
                  'Last Update',
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
                        {item.equipment_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {item.site_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {allClients.find(c => c.client_id === item.client_id)?.client_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {item.distance}m
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.violation ? (
                            <>
                              <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                              <span className="text-red-500 font-medium">
                                Outside Zone
                              </span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              <span className="text-green-500 font-medium">
                                Within Zone
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div className={`font-medium ${Math.abs(item.fuel_usage - item.ideal_fuel_usage) > 5 ? 'text-red-500' : 'text-green-500'}`}>
                          {Math.abs(item.fuel_usage - item.ideal_fuel_usage).toFixed(1)}L/hr
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div className="flex items-center">
                          <Navigation className="h-3 w-3 mr-1 text-yellow-400" />
                          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(item.timestamp).toLocaleString()}
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
