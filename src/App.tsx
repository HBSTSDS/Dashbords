import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CouponsView } from './components/CouponsView';
import { EventsView } from './components/EventsView';
import { ReportsView } from './components/ReportsView';
import { SalesView } from './components/SalesView';
import { useEventData } from './hooks/useEventData';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const { events } = useEventData();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard events={events} />;
      case 'coupons':
        return <CouponsView events={events} />;
      case 'events':
        return <EventsView events={events} />;
      case 'reports':
        return <ReportsView />;
      case 'sales': // Use Sales View for now if needed, or mapping? 
        // Layout has 'coupons' mapped to 'Promotores & Cupons', 
        // 'reports' mapped to 'Relatórios', 
        // 'events' mapped to 'Eventos'.
        // 'settings' is missing a view.
        return <SalesView />;
      case 'settings':
        return <div className="p-8 text-center text-zinc-500">Configurações em breve...</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

export default App;
