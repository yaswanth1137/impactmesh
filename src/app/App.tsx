import { useState, useEffect } from 'react';
import { HeaderBar } from '../components/shell/HeaderBar.tsx';
import { CommandRail, type NavRoute } from '../components/shell/CommandRail.tsx';
import { StatusBar } from '../components/shell/StatusBar.tsx';

// Routes
import { CommandRoute } from './routes/CommandRoute.tsx';
import { SalesRoute } from './routes/SalesRoute.tsx';
import { ProductRoute } from './routes/ProductRoute.tsx';
import { OperationsRoute } from './routes/OperationsRoute.tsx';
import { FinanceRoute } from './routes/FinanceRoute.tsx';
import { FlowTraceRoute } from './routes/FlowTraceRoute.tsx';
import { SimulatorRoute } from './routes/SimulatorRoute.tsx';

import { realtimeSubscriptionManager, type RealtimeConnectionState } from '../lib/realtime/subscription-manager.ts';

const pathToRoute = (pathname: string): NavRoute => {
  const clean = pathname.replace(/^\//, '').toLowerCase().split('/')[0];
  if (clean === 'sales') return 'sales';
  if (clean === 'product') return 'product';
  if (clean === 'operations' || clean === 'ops') return 'operations';
  if (clean === 'finance') return 'finance';
  if (clean === 'flowtrace') return 'flowtrace';
  if (clean === 'simulator') return 'simulator';
  return 'command';
};

export function App() {
  const [currentRoute, setCurrentRouteState] = useState<NavRoute>(() => {
    if (typeof window !== 'undefined') {
      return pathToRoute(window.location.pathname);
    }
    return 'command';
  });
  const [realtimeState, setRealtimeState] = useState<RealtimeConnectionState>('CONNECTED');

  const setCurrentRoute = (route: NavRoute) => {
    setCurrentRouteState(route);
    if (typeof window !== 'undefined') {
      const targetPath = route === 'command' ? '/command' : `/${route}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRouteState(pathToRoute(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    realtimeSubscriptionManager.initializeChannels();

    const unsubscribe = realtimeSubscriptionManager.onConnectionStateChange((state) => {
      setRealtimeState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const renderActiveRoute = () => {
    switch (currentRoute) {
      case 'command':
        return <CommandRoute onPlotRoute={() => setCurrentRoute('flowtrace')} />;
      case 'sales':
        return <SalesRoute />;
      case 'product':
        return <ProductRoute />;
      case 'operations':
        return <OperationsRoute />;
      case 'finance':
        return <FinanceRoute />;
      case 'flowtrace':
        return <FlowTraceRoute onBackToCommand={() => setCurrentRoute('command')} />;
      case 'simulator':
        return <SimulatorRoute onSelectRoute={(route) => setCurrentRoute(route)} />;
      default:
        return <CommandRoute onPlotRoute={() => setCurrentRoute('flowtrace')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090B0F] text-[#E8E4D8] flex flex-col font-sans antialiased overflow-x-hidden">
      {/* 1. TOP HEADER BAR */}
      <HeaderBar systemOnline={realtimeState !== 'ERROR'} />

      {/* 2. BODY CONTAINER: COMMAND RAIL + MAIN WORKSPACE */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Command Rail (Tactical Sidebar) */}
        <CommandRail
          currentRoute={currentRoute}
          onNavigate={(route) => setCurrentRoute(route)}
          className="hidden md:flex shrink-0"
        />

        {/* Mobile Navigation Header on smaller viewports */}
        <div className="md:hidden fixed bottom-8 left-0 right-0 z-40 px-3 flex items-center justify-around bg-[#101419]/95 border-t border-[#2A333B] py-2 backdrop-blur-sm">
          {(['command', 'sales', 'product', 'operations', 'finance', 'flowtrace'] as NavRoute[]).map((r) => (
            <button
              key={r}
              onClick={() => setCurrentRoute(r)}
              className={`px-2 py-1 font-pixel text-[9px] uppercase cursor-pointer ${
                currentRoute === r ? 'bg-[#D6A84F] text-[#090B0F]' : 'text-[#A9ADA8]'
              }`}
            >
              {r.slice(0, 4)}
            </button>
          ))}
        </div>

        {/* Central Workspace Area */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-8 chart-grid-bg min-h-0">
          {renderActiveRoute()}
        </main>
      </div>

      {/* 3. BOTTOM TELEMETRY STATUS BAR */}
      <StatusBar realtimeState={realtimeState} activeEventCount={4} healthScore={64} />
    </div>
  );
}

export default App;
