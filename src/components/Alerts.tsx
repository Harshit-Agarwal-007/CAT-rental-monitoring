import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateAlerts } from '../utils/calculations';
import { rentals, equipment, clients } from '../utils/dataLoader';
import { differenceInDays, parseISO } from 'date-fns';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Fuel, 
  MapPin, 
  Calendar,
  TrendingUp,
  Filter
} from 'lucide-react';

const Alerts: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [showResolved, setShowResolved] = useState<boolean>(false);
  
  const allAlerts = generateAlerts();
  
  // Filter alerts
  const filteredAlerts = allAlerts.filter(alert => {
    if (!showResolved && alert.resolved) return false;
    if (filter === 'all') return true;
    return alert.type === filter;
  });

  // Alert statistics
  const alertStats = {
    total: allAlerts.length,
    high: allAlerts.filter(a => a.severity === 'high').length,
    medium: allAlerts.filter(a => a.severity === 'medium').length,
    low: allAlerts.filter(a => a.severity === 'low').length,
    fuel: allAlerts.filter(a => a.type === 'fuel').length,
    service: allAlerts.filter(a => a.type === 'service').length,
    geofence: allAlerts.filter(a => a.type === 'geofence').length,
    rental_due: allAlerts.filter(a => a.type === 'rental_due').length
  };

  // Alert distribution by type
  const alertTypeData = [
    { type: 'Fuel Issues', count: alertStats.fuel, color: '#F59E0B' },
    { type: 'Service Due', count: alertStats.service, color: '#EF4444' },
    { type: 'Geofence', count: alertStats.geofence, color: '#8B5CF6' },
    { type: 'Rental Due', count: alertStats.rental_due, color: '#06B6D4' }
  ];

  // Upcoming rental returns (next 7 days)
  const upcomingReturns = rentals
    .filter(rental => rental.status === 'active')
    .map(rental => {
      const returnDate = parseISO(rental.expected_return_date);
      const daysUntilReturn = differenceInDays(returnDate, new Date());
      const equipmentData = equipment.find(eq => eq.equipment_id === rental.equipment_id);
      const clientData = clients.find(c => c.client_id === rental.client_id);
      
      return {
        ...rental,
        daysUntilReturn,
        equipment_code: equipmentData?.equipment_code || 'Unknown',
        client_name: clientData?.client_name || 'Unknown',
        forecasted_demand: clientData?.forecasted_demand || 0
      };
    })
    .filter(rental => rental.daysUntilReturn <= 7 && rental.daysUntilReturn >= 0)
    .sort((a, b) => a.daysUntilReturn - b.daysUntilReturn);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'fuel': return <Fuel className="h-4 w-4" />;
      case 'service': return <Clock className="h-4 w-4" />;
      case 'geofence': return <MapPin className="h-4 w-4" />;
      case 'rental_due': return <Calendar className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Alert Management</h1>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="all">All Alerts</option>
            <option value="fuel">Fuel Issues</option>
            <option value="service">Service Due</option>
            <option value="geofence">Geofence</option>
            <option value="rental_due">Rental Due</option>
          </select>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <span className="text-sm text-gray-600">Show Resolved</span>
          </label>
        </div>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-red-600">{alertStats.high}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Medium Priority</p>
              <p className="text-2xl font-bold text-yellow-600">{alertStats.medium}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Priority</p>
              <p className="text-2xl font-bold text-blue-600">{alertStats.low}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{alertStats.total}</p>
            </div>
            <Filter className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Alert Distribution Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Distribution by Type</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={alertTypeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#FCD34D" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Upcoming Returns & Forecasting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Returns */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Returns (Next 7 Days)</h3>
          </div>
          <div className="p-6">
            {upcomingReturns.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No returns scheduled in the next 7 days</p>
            ) : (
              <div className="space-y-3">
                {upcomingReturns.map(rental => (
                  <div key={rental.rental_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{rental.equipment_code}</div>
                      <div className="text-sm text-gray-600">{rental.client_name}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        rental.daysUntilReturn === 0 ? 'text-red-600' :
                        rental.daysUntilReturn <= 2 ? 'text-yellow-600' : 'text-gray-600'
                      }`}>
                        {rental.daysUntilReturn === 0 ? 'Due Today' : `${rental.daysUntilReturn} days`}
                      </div>
                      <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        View Forecast
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Alerts List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            {filteredAlerts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No active alerts</p>
            ) : (
              <div className="space-y-3">
                {filteredAlerts.map(alert => (
                  <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${
                    alert.severity === 'high' ? 'border-red-500 bg-red-50' :
                    alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2">
                        <div className={`${getSeverityColor(alert.severity)} p-1 rounded`}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{alert.message}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;