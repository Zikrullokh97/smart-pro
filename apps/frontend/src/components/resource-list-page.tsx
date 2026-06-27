'use client';

import { useEffect, useState } from 'react';
import { DynamicSidebar } from '@/components/dynamic-sidebar';

interface ResourceListPageProps {
  title: string;
  description: string;
  endpoint: string;
  entityLabel: string;
}

function getNestedValue(item: Record<string, any>, paths: string[]) {
  for (const path of paths) {
    const value = path.split('.').reduce<any>((acc, key) => acc?.[key], item);
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
}

function getPrimaryText(item: Record<string, any>) {
  const candidates = [
    getNestedValue(item, ['firstName']),
    getNestedValue(item, ['lastName']),
    getNestedValue(item, ['name']),
    getNestedValue(item, ['title']),
    getNestedValue(item, ['subject.name']),
    getNestedValue(item, ['student.firstName']),
    getNestedValue(item, ['student.lastName']),
    getNestedValue(item, ['email']),
    getNestedValue(item, ['id']),
  ];

  const first = candidates.find((value) => value !== undefined && value !== null && value !== '');
  if (typeof first === 'string') return first;
  if (typeof first === 'number') return String(first);
  return 'Unnamed item';
}

function getSecondaryText(item: Record<string, any>) {
  const status = getNestedValue(item, ['status']);
  const description = getNestedValue(item, ['description']);
  const email = getNestedValue(item, ['email']);
  const date = getNestedValue(item, ['createdAt', 'updatedAt']);
  const className = getNestedValue(item, ['className']);

  if (status) return `Status: ${status}`;
  if (description) return description;
  if (email) return email;
  if (className) return `Class: ${className}`;
  if (date) return new Date(date).toLocaleString();
  return 'No additional details';
}

export function ResourceListPage({ title, description, endpoint, entityLabel }: ResourceListPageProps) {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(endpoint, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = await response.json();
      const normalized = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
            ? payload.items
            : [];

      setItems(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [endpoint]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <DynamicSidebar />

      <div className="flex-1 p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          </div>

          <button
            onClick={fetchItems}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            Loading {entityLabel} data...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            No {entityLabel} data available yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item, index) => (
              <div key={item.id || index} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{getPrimaryText(item)}</h2>
                    <p className="mt-1 text-sm text-gray-600">{getSecondaryText(item)}</p>
                  </div>
                  {item.status ? (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {item.status}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
