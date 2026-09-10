import React from 'react';
import {
  Layers,
  LayoutDashboard,
  GitFork,
  Radio,
  AlertTriangle,
  ScrollText
} from 'lucide-react';
import type { NavigationPageId } from '../types';

interface SidebarProps {
  activePage: NavigationPageId;
  onSelectPage: (page: NavigationPageId) => void;
}

interface NavSection {
  title?: string;
  items: {
    id: NavigationPageId;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onSelectPage }) => {
  const sections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        {
          id: 'overview',
          label: 'Overview',
          icon: <LayoutDashboard className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        {
          id: 'workflows',
          label: 'Workflows',
          icon: <GitFork className="w-4 h-4" />
        },
        {
          id: 'simulator',
          label: 'Incident Analysis',
          badge: '1 Active',
          icon: <Radio className="w-4 h-4" />
        },
        {
          id: 'risks',
          label: 'Risk Events',
          icon: <AlertTriangle className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'GOVERNANCE',
      items: [
        {
          id: 'audit',
          label: 'Audit Log',
          icon: <ScrollText className="w-4 h-4" />
        }
      ]
    }
  ];

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200/80 flex flex-col justify-between h-screen select-none">
      {/* Brand Header */}
      <div>
        <div className="h-14 px-5 border-b border-slate-200/80 flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-2xs">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-bold tracking-tight text-slate-900 leading-none">
              FLOWTRACE
            </div>
            <div className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase mt-0.5">
              Process Intelligence
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="p-2.5 space-y-3.5 mt-1">
          {sections.map((section, idx) => (
            <div key={section.title || idx} className={idx > 0 ? 'pt-2.5 border-t border-slate-100' : ''}>
              {section.title && (
                <div className="px-2.5 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectPage(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`transition-colors ${
                            isActive ? 'text-blue-600' : 'text-slate-400'
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-red-100 text-red-700 border border-red-200">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom System Status */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
        <div className="rounded-md border border-slate-200/80 bg-white p-2.5 space-y-1 shadow-2xs">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
            System Status
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="text-emerald-700 text-[11px]">Operational</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">99.98%</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

