# Feature Ideas for FPL Tracker

## 1. My Team Live Points Tracker
**Description:** Display real-time points for the user's current team, including live bonus points and autosubs as matches progress.
**APIs:**
- `https://fantasy.premierleague.com/api/my-team/{user_id}/` for user's team data
- `https://fantasy.premierleague.com/api/event/{event_id}/live/` for live player points

## 2. League Standings Comparison
**Description:** Allow users to compare their team with friends in their private leagues, showing rank changes, points gained/lost, and head-to-head results.
**APIs:**
- `https://fantasy.premierleague.com/api/leagues-classic/{league_id}/standings/` for classic league standings
- `https://fantasy.premierleague.com/api/leagues-h2h/{league_id}/standings/` for head-to-head leagues

## 3. Transfer Suggestions & Alerts
**Description:** Suggest optimal transfers based on upcoming fixtures, player form, and injuries. Alert users when a player in their team is injured or suspended.
**APIs:**
- `https://fantasy.premierleague.com/api/bootstrap-static/` for player status and fixture info
- `https://fantasy.premierleague.com/api/my-team/{user_id}/` for current squad

## 4. Chip Usage Analytics
**Description:** Visualize when users and their league rivals have used chips (Wildcard, Free Hit, Bench Boost, Triple Captain) and analyze chip effectiveness.
**APIs:**
- `https://fantasy.premierleague.com/api/entry/{user_id}/history/` for chip usage history
- `https://fantasy.premierleague.com/api/leagues-classic/{league_id}/standings/` for league rivals

## 5. League Rival Watchlist
**Description:** Let users add league rivals to a watchlist and get notifications about their transfers, captain choices, and chip usage each gameweek.
**APIs:**
- `https://fantasy.premierleague.com/api/entry/{user_id}/event/{event_id}/picks/` for rivals' team selections
- `https://fantasy.premierleague.com/api/entry/{user_id}/history/` for chip usage

## 6. Mini-League Performance Graphs
**Description:** Show interactive graphs of user and league rivals' ranks, points, and transfers over the season.
**APIs:**
- `https://fantasy.premierleague.com/api/entry/{user_id}/history/` for historical data
- `https://fantasy.premierleague.com/api/leagues-classic/{league_id}/standings/` for league data

---
These features leverage the official FPL API endpoints to provide deeper insights and engagement for users around their own teams and leagues.
