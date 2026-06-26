'use client';

import { useState, useEffect } from 'react';
import { DynamicSidebar } from '@/components/dynamic-sidebar';
import { NotificationCenter } from '@/components/notification-center';
import { AICopilotPanel } from '@/components/ai-copilot-panel';
import { useAuthStore } from '@/lib/store';
import { widgetFetchers } from '@/lib/widget-fetchers';

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
  type: string;
  permissions: string[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAICopilot, setShowAICopilot] = useState(false);
  const [widgetData, setWidgetData] = useState<Record<string, any>>({});
  const [widgetErrors, setWidgetErrors] = useState<Record<string, string>>({});
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  
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
    const widgets = getWidgetsForUser();
    const data: Record<string, any> = {};
    const errors: Record<string, string> = {};

    await Promise.all(
      widgets.map(async (widget) => {
        try {
          const fetcher = widgetFetchers[widget.type as keyof typeof widgetFetchers];
          if (fetcher) {
            data[widget.id] = await fetcher();
          }
        } catch (error) {
          errors[widget.id] = error instanceof Error ? error.message : 'Failed to load';
          console.error(`Failed to fetch ${widget.id}:`, error);
        }
      })
    );

    setWidgetData(data);
    setWidgetErrors(errors);
  };

  const retryWidget = async (widgetId: string, widgetType: string) => {
    setRetryCount((prev: any) => ({ ...prev, [widgetId]: (prev[widgetId] || 0) + 1 }));
    
    try {
      const fetcher = widgetFetchers[widgetType as keyof typeof widgetFetchers];
      if (fetcher) {
        const data = await fetcher();
        setWidgetData((prev: any) => ({ ...prev, [widgetId]: data }));
        setWidgetErrors((prev: any) => ({ ...prev, [widgetId]: null }));
      }
    } catch (error) {
      setWidgetErrors((prev: any) => ({ 
        ...prev, 
        [widgetId]: error instanceof Error ? error.message : 'Failed to load' 
      }));
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const getWidgetsForUser = (): Widget[] => {
    if (!user) return [];
    
    const widgets: Widget[] = [];
    
    if (user.roles.includes('director')) {
      widgets.push(
        { id: 'kpi', title: 'KPI Dashboard', type: 'kpi', permissions: ['reports.view'] },
        { id: 'analytics', title: 'Analytics', type: 'analytics', permissions: ['reports.view'] }
      );
    }
    
    if (user.roles.includes('academic_head')) {
      widgets.push(
        { id: 'schedule', title: 'Schedule Overview', type: 'schedule', permissions: ['schedule.view'] },
        { id: 'teacher-load', title: 'Teacher Load', type: 'teacher-load', permissions: ['teachers.view'] },
        { id: 'attendance-alerts', title: 'Attendance Alerts', type: 'attendance-alerts', permissions: ['attendance.view'] }
      );
    }
    
    if (user.roles.includes('teacher') || user.roles.includes('class_teacher')) {
      widgets.push(
        { id: 'classes', title: 'My Classes', type: 'classes', permissions: ['classes.view'] },
        { id: 'journal', title: 'Grade Journal', type: 'journal', permissions: ['grades.view'] },
        { id: 'homework', title: 'Homework', type: 'homework', permissions: ['homework.view'] }
      );
    }
    
    if (user.roles.includes('class_teacher')) {
      widgets.push(
        { id: 'class-monitoring', title: 'Class Monitoring', type: 'class-monitoring', permissions: ['students.view'] },
        { id: 'parent-communication', title: 'Parent Communication', type: 'parent-communication', permissions: ['notifications.view'] }
      );
    }
    
    if (user.roles.includes('parent')) {
      widgets.push(
        { id: 'child-progress', title: 'Child Progress', type: 'child-progress', permissions: ['parent_portal.view'] }
      );
    }
    
    if (user.roles.includes('student')) {
      widgets.push(
        { id: 'my-homework', title: 'My Homework', type: 'homework', permissions: ['homework.view'] },
        { id: 'my-grades', title: 'My Grades', type: 'grades', permissions: ['grades.view'] },
        { id: 'my-schedule', title: 'My Schedule', type: 'schedule', permissions: ['schedule.view'] }
      );
    }
    
    return widgets.filter(w => hasPermission(w.permissions[0]));
  };

  const visibleWidgets = getWidgetsForUser();

  const renderWidgetContent = (widget: Widget) => {
    const data = widgetData[widget.id];
    const error = widgetErrors[widget.id];
    const retries = retryCount[widget.id] || 0;

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">Failed to load data</p>
          <button
            onClick={() => retryWidget(widget.id, widget.type)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry {retries > 0 ? `(${retries})` : ''}
          </button>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      );
    }

    switch (widget.type) {
      case 'kpi':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Students</span>
              <span className="text-2xl font-bold text-blue-600">{data.studentCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Teachers</span>
              <span className="text-2xl font-bold text-green-600">{data.teacherCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Attendance Rate</span>
              <span className="text-2xl font-bold text-purple-600">{data.attendanceRate}%</span>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Grade</span>
              <span className="text-2xl font-bold text-blue-600">{data.averageGrade}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Grades</span>
              <span className="text-2xl font-bold text-green-600">{data.totalGrades}</span>
            </div>
          </div>
        );

      case 'classes':
      case 'teacher-load':
        return (
          <div className="space-y-2">
            {data.length > 0 ? (
              data.slice(0, 5).map((item: any, idx: number) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium">{item.name || item.firstName + ' ' + item.lastName}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No data available</p>
            )}
          </div>
        );

      case 'homework':
      case 'journal':
        return (
          <div className="space-y-2">
            {data.length > 0 ? (
              data.slice(0, 5).map((item: any, idx: number) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium">{item.title || item.subject?.name}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No data available</p>
            )}
          </div>
        );

      case 'attendance-alerts':
        return (
          <div className="space-y-2">
            {data.length > 0 ? (
              data.slice(0, 5).map((item: any, idx: number) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium">{item.student?.firstName} {item.student?.lastName}</span>
                  <span className="ml-2 text-red-600">({item.status})</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-green-600">No alerts</p>
            )}
          </div>
        );

      case 'class-monitoring':
        return (
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Students</span>
              <span className="text-xl font-bold">{data.totalStudents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Present Today</span>
              <span className="text-xl font-bold text-green-600">{data.presentToday}</span>
            </div>
          </div>
        );

      case 'child-progress':
        return (
          <div className="space-y-2">
            {data.children?.length > 0 ? (
              data.children.map((child: any, idx: number) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium">{child.student.firstName} {child.student.lastName}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No children data</p>
            )}
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            {Array.isArray(data) ? `${data.length} items` : 'Data loaded'}
          </div>
        );
    }
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
          {visibleWidgets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleWidgets.map((widget) => (
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
              <p className="text-gray-500">No widgets available for your role</p>
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