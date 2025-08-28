import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { equipment, rentals, clients } from '../utils/dataLoader';
import { calculateUtilization } from '../utils/calculations';
import { TrendingDown, TrendingUp, Activity, Clock } from 'lucide-react';

const Usage: React.FC = () => {
  // Calculate utilization for all equipment
  const utilizationData = equipment.map(eq => {
    const rental = rentals.find(r => r.equipment_id === eq.equipment_id && r.status === 'active');
    const utilization = calculateUtilization(eq.equipment_id);
    
    return {
      equipment_code: eq.equipment_code,
      equipment_id: eq.equipment_id,
      type: eq.type,
      status: eq.status,
      utilization: Math.round(utilization),
      engine_hours: rental?.engine_hours_per_day || 0,
      idle_hours: rental?.idle_hours_per_day || 0,
      operating_days: rental?.operating_days || 0,
      fuel_usage: rental?.fuel_usage_per_hour || 0,
      client_name: rental ? clients.find(c => c.client_id === rental.client_id)?.client_name || 'Unknown' : 'Not Rented'
    };
  }).sort((a, b) => a.utilization - b.utilization);

  // Under-utilized equipment (less than 60% utilization)
  const underUtilized = utilizationData.filter(eq => eq.status === 'rented' && eq.utilization < 60);

  // Utilization by type
  const typeUtilization = equipment.reduce((acc, eq) => {
    const utilization = calculateUtilization(eq.equipment_id);
    if (!acc[eq.type]) {
      acc[eq.type] = { type: eq.type, total: 0, count: 0, avgUtilization: 0 };
    }
    acc[eq.type].total += utilization;
    acc[eq.type].count += 1;
    acc[eq.type].avgUtilization = Math.round(acc[eq.type].total / acc[eq.type].count);
    return acc;
  }, {} as Record<string, any>);

  const typeData = Object.values(typeUtilization);

  // Utilization distribution
  const utilizationRanges = [
    { range: '0-20%', count: 0, color: '#EF4444' },
    { range: '21-40%', count: 0, color: '#F97316' },
    { range: '41-60%', count: 0, color: '#EAB308' },
    { range: '61-80%', count: 0, color: '#84CC16' },
    { range: '81-100%', count: 0, color: '#10B981' }
  ];

  utilizationData.forEach(eq => {
    if (eq.status === 'rented') {
      if (eq.utilization <= 20) utilizationRanges[0].count++;
      else if (eq.utilization <= 40) utilizationRanges[1].count++;
      else if (eq.utilization <= 60) utilizationRanges[2].count++;
      else if (eq.utilization <= 80) utilizationRanges[3].count++;
      else utilizationRanges[4].count++;
    }
  });

  const stats = [
    {
      title: 'Avg Utilization',
      value: `${Math.round(utilizationData.filter(eq => eq.status === 'rented').reduce((acc, eq) => acc + eq.utilization, 0) / utilizationData.filter(eq => eq.status === 'rented').length || 0)}%`,
      icon: Activity,
      color: 'bg-green-500'
    },
    {
      title: 'Under-Utilized',
      value: underUtilized.length,
      icon: TrendingDown,
      color: 'bg-red-500'
    },
    {
      title: 'High Performance',
      value: utilizationData.filter(eq => eq.status === 'rented' && eq.utilization >= 80).length,
      icon: TrendingUp,
      color: 'bg-yellow-400'
    },
    {
      title: 'Total Operating Hours',
      value: utilizationData.reduce((acc, eq) => acc + eq.engine_hours * eq.operating_days, 0),
      icon: Clock,
      color: 'bg-blue-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Equipment Usage Analysis</h1>
        <div className="text-sm text-gray-500">
          Monitoring {utilizationData.filter(eq => eq.status === 'rented').length} active rentals
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utilization by Type */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Utilization by Equipment Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="avgUtilization" fill="#FCD34D" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Utilization Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Utilization Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={utilizationRanges}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ range, count }) => count > 0 ? `${range}: ${count}` : ''}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {utilizationRanges.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Under-Utilized Equipment Alert */}
      {underUtilized.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <TrendingDown className="h-5 w-5 text-yellow-400 mr-2" />
            <h3 className="text-lg font-medium text-yellow-800">Under-Utilized Equipment</h3>
          </div>
          <p className="text-yellow-700 text-sm mb-2">
            {underUtilized.length} equipment units are operating below 60% utilization
          </p>
        </div>
      )}

      {/* Detailed Usage Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Equipment Usage Details</h3>
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
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engine Hours/Day
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Idle Hours/Day
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operating Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fuel Usage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {utilizationData.map((item) => (
                <tr key={item.equipment_id} className={`hover:bg-gray-50 ${item.utilization < 60 && item.status === 'rented' ? 'bg-yellow-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{item.equipment_code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.status === 'rented' ? 'bg-yellow-100 text-yellow-800' :
                      item.status === 'maintenance' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.client_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            item.utilization >= 80 ? 'bg-green-500' :
                            item.utilization >= 60 ? 'bg-yellow-400' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(item.utilization, 100)}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium ${
                        item.utilization >= 80 ? 'text-green-600' :
                        item.utilization >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {item.utilization}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.engine_hours}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.idle_hours}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.operating_days}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.fuel_usage}L/hr
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

export default Usage;