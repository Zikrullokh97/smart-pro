'use client';

import { useState, useEffect } from 'react';
import { DynamicSidebar } from '@/components/dynamic-sidebar';
import { NotificationCenter } from '@/components/notification-center';
import { AICopilotPanel } from '@/components/ai-copilot-panel';
import { useAuthStore } from '@/lib/store';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

interface Widget {
  id: string;
  title: string;
  value: string | number;
  permission: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAICopilot, setShowAICopilot] = useState(false);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  
  const setUserFromStore = useAuthStore((state: any) => state.setUser);
  const isLoadingFromStore = useAuthStore((state: any) => state.isLoading);

  useEffect(() => {
    if (!isLoadingFromStore) {
      const storedUser = useAuthStore.getState().user;
      if (storedUser) {
        setUser(storedUser as User);
      }
      setIsLoading(false);
    }
  }, [isLoadingFromStore]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setUserFromStore(data);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWidgetData();
    }
  }, [user]);

  const fetchWidgetData = async () => {
    try {
      const response = await fetch('/api/dashboard/widgets', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Unable to load dashboard widgets');
      }

      const data = await response.json();
      setWidgets(data.widgets || []);
      setWidgetError(null);
    } catch (error) {
      setWidgetError(error instanceof Error ? error.message : 'Failed to load widgets');
      setWidgets([]);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const renderWidgetContent = (widget: Widget) => {
    if (widgetError) {
      return (
        <div className="text-center py-4">
          <p className="text-red-600 mb-2">{widgetError}</p>
        </div>
      );
    }

    return (
      <div className="text-center py-4">
        <div className="text-3xl font-bold text-blue-600">{widget.value}</div>
        <p className="text-sm text-gray-500 mt-2">{widget.title}</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 bg-gray-800"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <DynamicSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.firstName} {user?.lastName}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              {hasPermission('notifications.view') && (
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <span className="text-2xl">🔔</span>
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    3
                  </span>
                </button>
              )}
              
              {/* AI Copilot Button */}
              {hasPermission('ai_copilot.view') && (
                <button
                  onClick={() => setShowAICopilot(!showAICopilot)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <span className="text-2xl">🤖</span>
                </button>
              )}
              
              <div className="text-sm">
                <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">{user?.roles.join(', ')}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Widgets Grid */}
          {widgets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {widgets.map((widget) => (
                <div
                  key={widget.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {widget.title}
                  </h3>
                  {renderWidgetContent(widget)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {widgetError ? widgetError : 'No widgets available for your role'}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Notification Center */}
      {showNotifications && hasPermission('notifications.view') && (
        <NotificationCenter onClose={() => setShowNotifications(false)} />
      )}

      {/* AI Copilot Panel */}
      {showAICopilot && hasPermission('ai_copilot.view') && (
        <AICopilotPanel onClose={() => setShowAICopilot(false)} />
      )}
    </div>
  );
}