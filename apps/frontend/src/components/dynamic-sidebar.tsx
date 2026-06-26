'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Permission {
  name: string;
  module: string;
  action: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

interface MenuItem {
  module: string;
  label: string;
  icon: string;
  href: string;
  permissions: string[];
}

const menuConfig: MenuItem[] = [
  {
    module: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    href: '/dashboard',
    permissions: ['dashboard.view'],
  },
  {
    module: 'students',
    label: 'Students',
    icon: '👨‍🎓',
    href: '/students',
    permissions: ['students.view'],
  },
  {
    module: 'teachers',
    label: 'Teachers',
    icon: '👨‍🏫',
    href: '/teachers',
    permissions: ['teachers.view'],
  },
  {
    module: 'classes',
    label: 'Classes',
    icon: '🏫',
    href: '/classes',
    permissions: ['classes.view'],
  },
  {
    module: 'attendance',
    label: 'Attendance',
    icon: '📅',
    href: '/attendance',
    permissions: ['attendance.view'],
  },
  {
    module: 'grades',
    label: 'Grades',
    icon: '📝',
    href: '/grades',
    permissions: ['grades.view'],
  },
  {
    module: 'homework',
    label: 'Homework',
    icon: '📚',
    href: '/homework',
    permissions: ['homework.view'],
  },
  {
    module: 'schedule',
    label: 'Schedule',
    icon: '⏰',
    href: '/schedule',
    permissions: ['schedule.view'],
  },
  {
    module: 'reports',
    label: 'Reports',
    icon: '📈',
    href: '/reports',
    permissions: ['reports.view'],
  },
  {
    module: 'notifications',
    label: 'Notifications',
    icon: '🔔',
    href: '/notifications',
    permissions: ['notifications.view'],
  },
  {
    module: 'parent-portal',
    label: 'My Children',
    icon: '👨‍👩‍👧‍👦',
    href: '/parent-portal',
    permissions: ['parent_portal.view'],
  },
  {
    module: 'student-portal',
    label: 'My Profile',
    icon: '👤',
    href: '/student-portal',
    permissions: ['student_portal.view'],
  },
  {
    module: 'ai-copilot',
    label: 'AI Assistant',
    icon: '🤖',
    href: '/ai-copilot',
    permissions: ['ai_copilot.view'],
  },
  {
    module: 'psychological',
    label: 'Psychological',
    icon: '🧠',
    href: '/psychological',
    permissions: ['sensitive_data.view'],
  },
  {
    module: 'health',
    label: 'Health Records',
    icon: '🏥',
    href: '/health',
    permissions: ['sensitive_data.view'],
  },
  {
    module: 'discipline',
    label: 'Discipline',
    icon: '⚠️',
    href: '/discipline',
    permissions: ['sensitive_data.view'],
  },
];

export function DynamicSidebar() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    return permissions.some(p => user.permissions.includes(p));
  };

  const visibleMenuItems = menuConfig.filter(item => hasPermission(item.permissions));

  if (isLoading) {
    return (
      <div className="w-64 bg-gray-800 text-white p-4">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold">EduSphere Pro</h2>
        {user && (
          <div className="mt-2">
            <p className="text-sm">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-gray-400">{user.roles.join(', ')}</p>
          </div>
        )}
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {visibleMenuItems.map(item => (
            <li key={item.module}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}