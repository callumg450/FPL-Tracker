# FPL Tracker

A React application for tracking Fantasy Premier League (FPL) statistics, fixtures, and player performance.

## Features

- 📊 Live gameweek statistics
- ⚽ Fixture tracking and analysis
- 👥 Team management interface
- 📈 Player performance metrics
- 🏆 League position tracking

## Tech Stack

- React (with Vite)
- TailwindCSS
- Node.js
- Express (for proxy server)

## API

This project uses the Official Fantasy Premier League API. The API endpoints are accessed through a proxy server to handle CORS issues.

Key endpoints used:
- `/api/bootstrap-static/` - General game information
- `/api/entry/{id}/` - User team information
- `/api/event/{id}/live/` - Live gameweek data
- `/api/fixtures/` - Match fixtures data

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fpl-tracker.git
```

2. Install dependencies:
```bash
cd fpl-tracker
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Start the proxy server:
```bash
node src/proxy/index.js
```

## Environment Setup

Create a `.env` file in the root directory with:
```env
VITE_API_URL=http://localhost:3001
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Fantasy Premier League API Documentation](https://fantasy.premierleague.com/api)
- [FPL API Community](https://www.reddit.com/r/FantasyPL/wiki/api)

---
*Note: This project is not affiliated with or endorsed by the Official Fantasy Premier League.*

