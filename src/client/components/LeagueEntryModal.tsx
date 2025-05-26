//Component for each individual entry in the league ranking table
import React, { useEffect, useState, useMemo } from 'react';
import TeamFormation from './team/TeamFormation.js';
import TransfersThisWeek from './team/TransfersThisWeek.js';
import { applyAutoSubs } from '../utils/fplAutoSubs';

const CHIP_LABELS: Record<string, string> = {
  wildcard: 'Wildcard',
  freehit: 'Free Hit',
  bboost: 'Bench Boost',
  '3xc': 'Triple Captain'
};

interface LeagueEntry {
  id: number;
  entry_name: string;
  player_name: string;
  [key: string]: any;
}
interface Player {
  id: number;
  element_type: number;
  web_name: string;
  [key: string]: any;
}
interface Team {
  code: number;
  id: number;
  name: string;
  [key: string]: any;
}

interface LeagueEntryModalProps {
  selectedEntry: LeagueEntry;
  entryPicks: any;
  loadingPicks: boolean;
  lastRefreshTime: Date | null;
  players: Player[];
  liveData: any[];
  teams: Team[];
  fixtures: any[];
  onClose: () => void;
  onRefresh: () => void;
}

const LeagueEntryModal: React.FC<LeagueEntryModalProps> = ({
  selectedEntry,
  entryPicks,
  loadingPicks,
  lastRefreshTime,
  players,
  liveData,
  teams,
  fixtures,
  onClose,
  onRefresh
}) => {
  // Memoize picksWithSubs to avoid unnecessary recomputation
  const picksWithSubs = useMemo(() => {
    if (entryPicks && entryPicks.picks && players && liveData && fixtures) {
      return applyAutoSubs(entryPicks.picks, liveData, players, fixtures);
    }
    return entryPicks?.picks;
  }, [entryPicks, players, liveData, fixtures]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-3xl my-4 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => { e.stopPropagation(); }}
      >
        <button 
          className="absolute top-2 right-2 text-xl font-bold text-gray-500 hover:text-gray-800 z-10" 
          onClick={onClose}
        >
          &times;
        </button>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold text-indigo-800">{selectedEntry.entry_name} ({selectedEntry.player_name})</h3>
          <div className="flex items-center">
            <button 
              className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 hover:bg-indigo-50 rounded mr-1 disabled:opacity-50"
              onClick={onRefresh}
              disabled={loadingPicks}
            >
              {loadingPicks ? 'Updating...' : 'Refresh'}
            </button>
            {lastRefreshTime && (
              <span className="text-xs text-gray-500">
                Updated: {lastRefreshTime.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        {/* Transfers at the top */}
        <TransfersThisWeek
          entryId={selectedEntry.entry}
          eventId={entryPicks?.entry_history?.event || entryPicks?.event}
          players={players}
          eventTransfersCost={entryPicks?.entry_history?.event_transfers_cost}
          baseUrl={import.meta.env.VITE_BASE_URL}
        />
        {loadingPicks ? (
          <div className="text-center text-gray-500">Loading team...</div>
        ) : entryPicks && entryPicks.picks && entryPicks.picks.length > 0 ? (
          <>
            {entryPicks.active_chip && (
              <div className="mb-2 text-center">
                <span className="inline-block bg-indigo-200 text-indigo-900 rounded px-3 py-1 font-semibold text-sm">
                  Chip played: {CHIP_LABELS[entryPicks.active_chip]}
                </span>
              </div>
            )}
            <TeamFormation 
              picks={entryPicks.picks} 
              players={players} 
              liveData={liveData} 
              showPoints={true} 
              teams={teams}
              fixtures={fixtures}
              picksWithSubs={picksWithSubs} // Use computed picksWithSubs for live sub highlighting
            />
          </>
        ) : entryPicks && entryPicks.error ? (
          <div className="text-center text-red-500">{entryPicks.error}</div>
        ) : null}
      </div>
    </div>
  );
};

export default LeagueEntryModal;
