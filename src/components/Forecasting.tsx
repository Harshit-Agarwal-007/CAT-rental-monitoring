import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { clients, rentals } from '../utils/dataLoader';
import { TrendingUp, TrendingDown, Minus, Users } from 'lucide-react';

const Forecasting: React.FC = () => {
  const [selectedClientId, setSelectedClientId] = useState<number>(1);
  const [forecastDays, setForecastDays] = useState<number>(30);

  // Generate forecast data for selected client
  const selectedClient = clients.find(c => c.client_id === selectedClientId);
  const clientRentals = rentals.filter(r => r.client_id === selectedClientId);
  
  // Historical demand pattern
  const historicalData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (11 - i));
    
    // Simulate historical data based on client's avg_monthly_demand with some variation
    const basedemand = selectedClient?.avg_monthly_demand || 0;
    const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
    const demand = Math.max(0, Math.round(basedemand * (1 + variation)));
    
    return {
      month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      demand,
      forecast: i >= 8 ? selectedClient?.forecasted_demand || 0 : null
    };
  });

  // Future forecast based on trend
  const futureData = Array.from({ length: Math.ceil(forecastDays / 30) }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() + i + 1);
    
    let forecastValue = selectedClient?.forecasted_demand || 0;
    
    // Apply trend
    if (selectedClient?.demand_trend === 'up') {
      forecastValue *= (1 + (i * 0.1)); // 10% growth per month
    } else if (selectedClient?.demand_trend === 'down') {
      forecastValue *= (1 - (i * 0.05)); // 5% decline per month
    }
    
    // Apply risk factors
    forecastValue *= (1 - (selectedClient?.forecasted_weather_risk || 0));
    forecastValue *= (1 - (selectedClient?.war_risk || 0));
    
    return {
      month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      forecast: Math.max(0, Math.round(forecastValue))
    };
  });

  const combinedData = [...historicalData, ...futureData];

  // Client comparison data
  const clientComparison = clients.map(client => ({
    client_name: client.client_name,
    current_demand: client.avg_monthly_demand,
    forecasted_demand: Math.round(client.forecasted_demand),
    reliability_score: client.reliability_score,
    trend: client.demand_trend
  })).sort((a, b) => b.forecasted_demand - a.forecasted_demand);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Demand Forecasting</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            {clients.map(client => (
              <option key={client.client_id} value={client.client_id}>
                {client.client_name}
              </option>
            ))}
          </select>
          <select
            value={forecastDays}
            onChange={(e) => setForecastDays(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value={30}>30 Days</option>
            <option value={60}>60 Days</option>
            <option value={90}>90 Days</option>
            <option value={180}>180 Days</option>
          </select>
        </div>
      </div>

      {/* Client Overview */}
      {selectedClient && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{selectedClient.reliability_score}%</div>
              <div className="text-sm text-gray-600">Reliability Score</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                {selectedClient.demand_trend === 'up' && <TrendingUp className="h-6 w-6 text-green-500 mr-1" />}
                {selectedClient.demand_trend === 'down' && <TrendingDown className="h-6 w-6 text-red-500 mr-1" />}
                {selectedClient.demand_trend === 'stable' && <Minus className="h-6 w-6 text-gray-500 mr-1" />}
                <span className="text-lg font-semibold text-gray-900">{selectedClient.demand_trend}</span>
              </div>
              <div className="text-sm text-gray-600">Demand Trend</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{selectedClient.past_delays_count}</div>
              <div className="text-sm text-gray-600">Past Delays</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{Math.round(selectedClient.forecasted_demand)}</div>
              <div className="text-sm text-gray-600">Forecasted Demand</div>
            </div>
          </div>
        </div>
      )}

      {/* Demand Forecast Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Demand Forecast - {selectedClient?.client_name}
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis label={{ value: 'Equipment Demand', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="demand" 
              stroke="#FCD34D" 
              strokeWidth={3}
              name="Historical Demand"
              connectNulls={false}
            />
            <Line 
              type="monotone" 
              dataKey="forecast" 
              stroke="#F59E0B" 
              strokeWidth={3}
              strokeDasharray="5 5"
              name="Forecasted Demand"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Client Comparison */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Client Demand Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Demand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Forecasted Demand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reliability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Factors
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientComparison.map((client) => (
                <tr key={client.client_name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{client.client_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.current_demand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.forecasted_demand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {client.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500 mr-1" />}
                      {client.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500 mr-1" />}
                      {client.trend === 'stable' && <Minus className="h-4 w-4 text-gray-500 mr-1" />}
                      <span className={`text-sm ${
                        client.trend === 'up' ? 'text-green-600' :
                        client.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {client.trend}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full" 
                          style={{ width: `${client.reliability_score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{client.reliability_score}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Weather: {(clients.find(c => c.client_name === client.client_name)?.forecasted_weather_risk || 0) * 100}%
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

export default Forecasting;