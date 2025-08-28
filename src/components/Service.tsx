import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { equipment, rentals, maintenance } from '../utils/dataLoader';
import { generateAlerts } from '../utils/calculations';
import { differenceInDays, parseISO } from 'date-fns';
import { Download, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const Service: React.FC = () => {
  const [selectedEquipment, setSelectedEquipment] = useState<number | null>(null);
  
  const alerts = generateAlerts().filter(alert => alert.type === 'fuel' || alert.type === 'service');
  
  // Service due analysis
  const serviceData = equipment.map(eq => {
    const activeRental = rentals.find(r => r.equipment_id === eq.equipment_id && r.status === 'active');
    const lastMaintenance = maintenance
      .filter(m => m.equipment_id === eq.equipment_id)
      .sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime())[0];
    
    let daysSinceService = 0;
    if (activeRental) {
      const checkOutDate = parseISO(activeRental.check_out_date);
      daysSinceService = differenceInDays(new Date(), checkOutDate);
    }
    
    return {
      equipment_code: eq.equipment_code,
      equipment_id: eq.equipment_id,
      type: eq.type,
      status: eq.status,
      daysSinceService,
      serviceDue: daysSinceService >= eq.recommended_service_period,
      fuelDeviation: activeRental ? Math.abs(activeRental.fuel_usage_per_hour - eq.ideal_fuel_usage_per_hour) : 0,
      lastMaintenanceDate: lastMaintenance?.service_date || 'No records'
    };
  });

  // Fuel deviation chart data
  const fuelDeviationData = serviceData
    .filter(eq => eq.status === 'rented')
    .map(eq => ({
      equipment: eq.equipment_code,
      deviation: eq.fuelDeviation,
      threshold: 10
    }));

  const downloadServiceLog = (equipmentId: number) => {
    const equipmentMaintenance = maintenance.filter(m => m.equipment_id === equipmentId);
    const equipmentData = equipment.find(eq => eq.equipment_id === equipmentId);
    
    const csvContent = [
      'Date,Service Log,Equipment Code',
      ...equipmentMaintenance.map(m => `${m.service_date},"${m.service_logs}",${equipmentData?.equipment_code}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service_log_${equipmentData?.equipment_code}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Service Management</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <AlertTriangle className="h-4 w-4" />
          <span>{alerts.length} active alerts</span>
        </div>
      </div>

      {/* Service Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-lg font-medium text-red-800">Service Alerts</h3>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fuel Deviation Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fuel Usage Deviation Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fuelDeviationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="equipment" angle={-45} textAnchor="end" height={80} />
            <YAxis label={{ value: 'Deviation (L/hr)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Bar dataKey="deviation" fill="#FCD34D" name="Fuel Deviation" />
            <Bar dataKey="threshold" fill="#EF4444" name="Alert Threshold" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Service Schedule Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Service Schedule & Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Since Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fuel Deviation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Maintenance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {serviceData.map((item) => (
                <tr key={item.equipment_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{item.equipment_code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {item.status === 'rented' && <Clock className="h-4 w-4 text-yellow-500 mr-1" />}
                      {item.status === 'maintenance' && <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />}
                      {item.status === 'idle' && <CheckCircle className="h-4 w-4 text-green-500 mr-1" />}
                      <span className={`text-sm font-medium ${
                        item.status === 'rented' ? 'text-yellow-600' :
                        item.status === 'maintenance' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${item.serviceDue ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                      {item.daysSinceService} days
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${item.fuelDeviation > 10 ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                      {item.fuelDeviation.toFixed(1)}L/hr
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.lastMaintenanceDate !== 'No records' ? 
                      new Date(item.lastMaintenanceDate).toLocaleDateString() : 
                      'No records'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => downloadServiceLog(item.equipment_id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download Log
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Service;