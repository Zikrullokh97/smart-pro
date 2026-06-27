'use client';

import { useEffect, useState } from 'react';
import { DynamicSidebar } from '@/components/dynamic-sidebar';

interface ChildSummary {
  id: string;
  student?: {
    firstName?: string;
    lastName?: string;
  };
  firstName?: string;
  lastName?: string;
  className?: string;
}

export default function ParentPortalPage() {
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await fetch('/api/parent-portal/children', { credentials: 'include' });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const payload = await response.json();
        const normalized = Array.isArray(payload) ? payload : Array.isArray(payload?.children) ? payload.children : [];
        setChildren(normalized);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load child data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildren();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <DynamicSidebar />

      <div className="flex-1 p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Parent Portal</h1>
          <p className="mt-1 text-sm text-gray-600">A quick view of your children and their school information.</p>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            Loading parent portal data...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
            {error}
          </div>
        ) : children.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            No children data available yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {children.map((child, index) => {
              const name = child.student?.firstName || child.firstName || 'Child';
              const surname = child.student?.lastName || child.lastName || '';
              return (
                <div key={child.id || index} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900">{[name, surname].filter(Boolean).join(' ')}</h2>
                  <p className="mt-1 text-sm text-gray-600">{child.className || 'No class assigned yet'}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
