'use client';

import { useState, useEffect } from 'react';

interface AIAction {
  id: string;
  agentType: string;
  actionType: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
}

interface AICopilotPanelProps {
  onClose: () => void;
}

export function AICopilotPanel({ onClose }: AICopilotPanelProps) {
  const [suggestions, setSuggestions] = useState<AIAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('/api/ai-copilot/suggestions', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const approveSuggestion = async (id: string) => {
    try {
      await fetch(`/api/ai-copilot/suggestions/${id}/approve`, {
        method: 'PATCH',
        credentials: 'include',
      });
      setSuggestions(suggestions.map(s => 
        s.id === id ? { ...s, status: 'approved' } : s
      ));
    } catch (error) {
      console.error('Failed to approve suggestion:', error);
    }
  };

  const rejectSuggestion = async (id: string) => {
    try {
      await fetch(`/api/ai-copilot/suggestions/${id}/reject`, {
        method: 'PATCH',
        credentials: 'include',
      });
      setSuggestions(suggestions.map(s => 
        s.id === id ? { ...s, status: 'rejected' } : s
      ));
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
    }
  };

  const filteredSuggestions = suggestions.filter(s => {
    if (activeTab === 'pending') return s.status === 'pending';
    if (activeTab === 'approved') return s.status === 'approved';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'executed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-xl border-l border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI Assistant</h2>
          <p className="text-sm text-gray-600">Suggested Actions</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'pending'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'approved'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'all'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All
        </button>
      </div>

      <div className="overflow-y-auto h-full pb-20">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No suggestions</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSuggestions.map(suggestion => (
              <div key={suggestion.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {suggestion.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(suggestion.status)}`}>
                    {suggestion.status}
                  </span>
                </div>
                
                {suggestion.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {suggestion.description}
                  </p>
                )}

                <div className="text-xs text-gray-400 mb-3">
                  Agent: {suggestion.agentType} • {new Date(suggestion.createdAt).toLocaleDateString()}
                </div>

                {suggestion.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveSuggestion(suggestion.id)}
                      className="flex-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectSuggestion(suggestion.id)}
                      className="flex-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {suggestion.status === 'approved' && (
                  <div className="text-sm text-green-600 font-medium">
                    ✓ Ready to execute
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}