'use client';

import { useEffect, useState } from 'react';
import { DynamicSidebar } from '@/components/dynamic-sidebar';

interface StudentPortalSummary {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  className?: string;
  gradeLevel?: string;
}

export default function StudentPortalPage() {
  const [profile, setProfile] = useState<StudentPortalSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/student-portal/profile', { credentials: 'include' });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const payload = await response.json();
        setProfile(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <DynamicSidebar />

      <div className="flex-1 p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Student Portal</h1>
          <p className="mt-1 text-sm text-gray-600">Your personal profile and study details.</p>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            Loading student portal data...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
            {error}
          </div>
        ) : !profile ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            No profile data available yet.
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Full name</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{[profile.firstName, profile.lastName].filter(Boolean).join(' ')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{profile.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Class</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{profile.className || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Grade level</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{profile.gradeLevel || 'Not provided'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
