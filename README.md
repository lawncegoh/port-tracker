# Portfolio Tracker

A comprehensive portfolio tracking application with IBKR integration, real estate tracking, and net worth aggregation.

## Features

- **Dashboard**: Overview of total net worth, asset allocation, and performance metrics
- **Brokerage Tab**: Track positions, trades, and portfolio statistics
- **Real Estate Tab**: Manage properties, loans, and equity calculations
- **Others Tab**: Track other assets (cash, crypto, private investments) and liabilities
- **IBKR Integration**: Real-time connection to Interactive Brokers Gateway
- **Data Persistence**: Configurable storage (in-memory or SQLite)

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with dark mode
- **State Management**: Zustand + React Query
- **Charts**: Recharts (ready for implementation)
- **Database**: Prisma + SQLite (configurable)
- **Styling**: Tailwind CSS with custom design system

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- IBKR Gateway running on localhost:5000 (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd port-tracker
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
# Create .env.local file
cp .env.example .env.local

# Configure data store (memory or sqlite)
DATA_STORE=memory
```

4. Start the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### Data Store

The application supports two data storage modes:

- **Memory** (`DATA_STORE=memory`): In-memory storage with sample data (default)
- **SQLite** (`DATA_STORE=sqlite`): Persistent SQLite database (requires Prisma setup)

### IBKR Integration

To connect to Interactive Brokers:

1. Install and configure IBKR Gateway
2. Ensure it's running on `https://localhost:5000`
3. The app will automatically detect connection status

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── ibkr/         # IBKR integration endpoints
│   │   ├── stats/        # Portfolio statistics
│   │   └── networth/     # Net worth aggregation
│   ├── brokerage/        # Brokerage tab page
│   ├── real-estate/      # Real Estate tab page
│   └── others/           # Others tab page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── navigation.tsx    # Main navigation
│   └── providers.tsx     # App providers
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── repo/             # Data repository layer
│   └── types.ts          # TypeScript interfaces
└── styles/                # Global styles
```

## API Endpoints

### IBKR Integration
- `GET /api/ibkr/health` - Check IBKR Gateway connectivity
- `GET /api/ibkr/accounts` - List IBKR accounts
- `GET /api/ibkr/positions` - Get current positions
- `GET /api/ibkr/trades` - Get trade history
- `GET /api/ibkr/summary` - Get account summary

### Portfolio Data
- `GET /api/stats/portfolio` - Get portfolio statistics
- `GET /api/networth/series` - Get net worth time series
- `POST /api/networth/series` - Create net worth snapshot

## Data Models

### Core Entities
- **Position**: Stock/ETF positions with P&L tracking
- **Trade**: Execution history with commission tracking
- **RealEstateProperty**: Property details with loan information
- **OtherAsset**: Cash, crypto, and private investments
- **Liability**: Loans, credit cards, and other debt
- **NetWorthSnapshot**: Historical net worth snapshots

## Development

### Adding New Features

1. **New Data Type**: Add interface to `src/lib/types.ts`
2. **Repository Methods**: Implement in repository classes
3. **API Endpoints**: Create new API routes
4. **UI Components**: Add pages and components
5. **Navigation**: Update navigation if needed

### Database Schema (Future)

When implementing SQLite:

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# View database
pnpm prisma studio
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Self-Hosted

1. Build the application:
```bash
pnpm build
```

2. Start the production server:
```bash
pnpm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create a GitHub issue
- Check the documentation
- Review the code examples

## Roadmap

- [ ] Real-time IBKR data sync
- [ ] Advanced charting with Recharts
- [ ] Export functionality (CSV, PDF)
- [ ] Mobile app
- [ ] Multi-currency support
- [ ] Advanced portfolio analytics
- [ ] Tax reporting features
