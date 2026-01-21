'use client';

import { useState } from 'react';

export default function SyncEmailButton({ onSyncComplete }: { onSyncComplete?: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/sync-emails');
      const data = await res.json();
      
      if (data.success) {
        const count = data.count || 0;
        const msg = count > 0 
          ? `Succès ! ${count} nouveaux email(s) traité(s).` 
          : 'Aucun nouvel email à traiter.';
        setMessage(msg);
        if (onSyncComplete) onSyncComplete();
      } else {
        setMessage('Erreur lors de la synchronisation.');
      }
    } catch {
      setMessage('Erreur de connexion serveur.');
    } finally {
      setSyncing(false);
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <div className="flex flex-col items-end relative">
        <button
        onClick={handleSync}
        disabled={syncing}
        className="text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-4 py-2 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
        {syncing ? (
            <>
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="hidden sm:inline">Synchro...</span>
            </>
        ) : (
            <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span className="hidden sm:inline">Sync Emails</span>
            </>
        )}
        </button>
        {message && (
            <div className={`absolute top-full right-0 mt-2 p-3 rounded-lg shadow-lg border text-sm max-w-xs z-50 animate-in fade-in slide-in-from-top-2 ${
                message.includes('Erreur') 
                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/90 dark:border-red-800 dark:text-red-100' 
                : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/90 dark:border-green-800 dark:text-green-100'
            }`}>
                {message}
            </div>
        )}
    </div>
  );
}
