import React from 'react';
import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Service from './components/Service';
import GPS from './components/GPS';
import Usage from './components/Usage';
import Forecasting from './components/Forecasting';
import Alerts from './components/Alerts';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'service':
        return <Service />;
      case 'gps':
        return <GPS />;
      case 'usage':
        return <Usage />;
      case 'forecasting':
        return <Forecasting />;
      case 'alerts':
        return <Alerts />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;
