import { useState, useEffect, useCallback } from 'react';
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

// Mobile terminals are strictly limited to the 4 department screens
export const MOBILE_DEPT_ROUTES: { id: NavRoute; label: string; name: string }[] = [
  { id: 'operations', label: 'OPER', name: 'Operations' },
  { id: 'sales', label: 'SALE', name: 'Sales' },
  { id: 'product', label: 'PROD', name: 'Product' },
  { id: 'finance', label: 'FIN', name: 'Finance' },
];

const isMobileScreen = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

const parseRouteFromLocation = (): NavRoute => {
  if (typeof window === 'undefined') return 'command';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (path.includes('operations') || hash.includes('operations') || path.includes('ops')) return 'operations';
  if (path.includes('sales') || hash.includes('sales')) return 'sales';
  if (path.includes('product') || hash.includes('product')) return 'product';
  if (path.includes('finance') || hash.includes('finance')) return 'finance';
  if (path.includes('flowtrace') || hash.includes('flowtrace')) return 'flowtrace';
  if (path.includes('simulator') || hash.includes('simulator')) return 'simulator';

  // If on mobile screen without explicit path, default directly to operations
  if (window.innerWidth < 768) {
    return 'operations';
  }
  return 'command';
};

export function App() {
  const [currentRoute, setCurrentRoute] = useState<NavRoute>(parseRouteFromLocation);
  const [realtimeState, setRealtimeState] = useState<RealtimeConnectionState>('CONNECTED');
  const [isMobile, setIsMobile] = useState<boolean>(isMobileScreen);

  const navigateTo = useCallback((route: NavRoute) => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined') {
      const targetUrl = route === 'command' ? '/command' : `/${route}`;
      if (window.location.pathname !== targetUrl) {
        window.history.pushState(null, '', targetUrl);
      }
    }
  }, []);

  useEffect(() => {
    // 1. Initialize Supabase Realtime Channels
    realtimeSubscriptionManager.initializeChannels();

    const unsubscribeConn = realtimeSubscriptionManager.onConnectionStateChange((state) => {
      setRealtimeState(state);
    });

    // 2. Synchronize on browser forward / back navigation
    const handlePopState = () => {
      setCurrentRoute(parseRouteFromLocation());
    };
    window.addEventListener('popstate', handlePopState);

    // 3. Responsive resize listener
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      unsubscribeConn();
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const renderActiveRoute = () => {
    // On mobile devices, non-department routes (command, flowtrace, simulator) are strictly restricted
    if (isMobile && (currentRoute === 'command' || currentRoute === 'flowtrace' || currentRoute === 'simulator')) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center min-h-[60vh] max-w-sm mx-auto space-y-4">
          <div className="w-14 h-14 bg-[#141A20] border-2 border-[#F87171] text-[#F87171] flex items-center justify-center font-pixel text-2xl shadow-lg shadow-red-950/20">
            🔒
          </div>
          <div>
            <div className="font-pixel text-xs text-[#F87171] tracking-widest uppercase">
              DESKTOP ONLY ACCESS
            </div>
            <h2 className="font-pixel text-sm text-[#E8E4D8] mt-1 uppercase">
              CEO COMMAND RESTRICTED
            </h2>
          </div>
          <p className="text-xs text-[#A9ADA8] font-mono leading-relaxed bg-[#101419] p-3 border border-[#2A333B]">
            Department mobile terminals are authorized strictly for operational controls:
            <span className="text-[#D6A84F] font-semibold block mt-1">OPERATIONS · SALES · PRODUCT · FINANCE</span>
            The CEO Command Center and FlowTrace require executive desktop workstation authorization.
          </p>
          <div className="grid grid-cols-2 gap-2 w-full pt-2">
            {MOBILE_DEPT_ROUTES.map((dept) => (
              <button
                key={dept.id}
                onClick={() => navigateTo(dept.id)}
                className="px-3 py-2 bg-[#1A2128] hover:bg-[#252E37] border border-[#2A333B] text-[#E8E4D8] hover:text-[#D6A84F] font-pixel text-[10px] tracking-wider uppercase cursor-pointer transition-colors"
              >
                [{dept.label}] {dept.name}
              </button>
            ))}
          </div>
        </div>
      );
    }

    switch (currentRoute) {
      case 'command':
        return <CommandRoute onPlotRoute={() => navigateTo('flowtrace')} />;
      case 'sales':
        return <SalesRoute />;
      case 'product':
        return <ProductRoute />;
      case 'operations':
        return <OperationsRoute />;
      case 'finance':
        return <FinanceRoute />;
      case 'flowtrace':
        return <FlowTraceRoute onBackToCommand={() => navigateTo('command')} />;
      case 'simulator':
        return <SimulatorRoute onSelectRoute={(route) => navigateTo(route)} />;
      default:
        return <CommandRoute onPlotRoute={() => navigateTo('flowtrace')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EFE5] text-[#18201D] flex flex-col font-sans antialiased overflow-x-hidden">
      {/* 1. TOP HEADER BAR */}
      <HeaderBar systemOnline={realtimeState !== 'ERROR'} />

      {/* 2. BODY CONTAINER: COMMAND RAIL + MAIN WORKSPACE */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Desktop Left Command Rail (Tactical Sidebar - hidden on mobile) */}
        <CommandRail
          currentRoute={currentRoute}
          onNavigate={navigateTo}
          className="hidden md:flex shrink-0"
        />

        {/* Mobile-Only Navigation Bar: Exactly the 4 Department Screens (OPER, SALE, PROD, FIN) */}
        <div className="md:hidden fixed bottom-8 left-0 right-0 z-40 px-2 py-1.5 flex items-center justify-around bg-[#FAF8F1]/95 border-t border-[#DDD5C5] backdrop-blur-md shadow-md">
          {MOBILE_DEPT_ROUTES.map((dept) => {
            const isActive = currentRoute === dept.id;
            return (
              <button
                key={dept.id}
                onClick={() => navigateTo(dept.id)}
                className={`flex-1 mx-1 py-2 px-1 text-center font-mono text-[10px] uppercase cursor-pointer rounded-xs border transition-all ${
                  isActive
                    ? 'bg-[#C89638] text-[#FAF8F1] border-[#C89638] font-bold shadow-2xs'
                    : 'bg-[#F3EFE5] text-[#576560] border-[#DDD5C5] hover:text-[#18201D] hover:border-[#C89638]'
                }`}
              >
                {dept.label}
              </button>
            );
          })}
        </div>

        {/* Central Workspace Area */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-8 chart-grid-bg min-h-0 pb-20 md:pb-8">
          {renderActiveRoute()}
        </main>
      </div>

      {/* 3. BOTTOM TELEMETRY STATUS BAR */}
      <StatusBar realtimeState={realtimeState} activeEventCount={4} healthScore={64} />
    </div>
  );
}

export default App;
