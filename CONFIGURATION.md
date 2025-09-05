# Configuration Guide

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

### Data Store Configuration
```bash
# Options: memory, sqlite
DATA_STORE=memory
```

### IBKR Flex Token Configuration
```bash
# Your IBKR Flex Token for secure API access
IBKR_FLEX_TOKEN=your-flex-token-here

# Your Activity Flex Query ID
IBKR_FLEX_QUERY_ID=your-query-id-here

# IBKR Flex Web Service base URL (official endpoint)
IBKR_FLEX_BASE_URL=https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService
```

### Database Configuration (for future SQLite implementation)
```bash
DATABASE_URL="file:./dev.db"
```

### Next.js Configuration
```bash
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

## IBKR Connection Setup (Flex Web Service)

### Prerequisites
1. Interactive Brokers account (paper or live)
2. Flex Queries enabled in your IBKR account
3. API access approved by IBKR

### Step-by-Step Setup

1. **Enable Flex Queries in IBKR**
   - Log into your Interactive Brokers Web Portal
   - Go to Performance & Reports → Flex Queries
   - Ensure Flex Queries are enabled for your account
   - Note: This may require approval from IBKR (24-48 hours)

2. **Create Flex Query**
   - In Flex Queries section, click 'Create New Query'
   - Select 'Activity' as the query type
   - Configure the query to include trades, positions, and account info
   - Set the activation period to at least one year
   - Save the query and note the generated ID

3. **Generate Flex Token**
   - In Flex Queries section, go to 'Tokens' tab
   - Click 'Generate New Token'
   - Set token permissions to 'Read Only'
   - Set expiration to at least one year
   - Copy the generated token (you'll need this)

4. **Configure Portfolio Tracker**
   - Go to Settings → IBKR Integration
   - Enter your Flex Token
   - Enter your Activity Flex Query ID
   - Click 'Test Connection' to verify
   - Start syncing your portfolio data

### API Endpoints
The system uses the official IBKR Flex Web Service API:
- **Base URL**: `https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService`
- **SendRequest**: `/SendRequest` - Initiates report generation
- **GetStatement**: `/GetStatement` - Retrieves generated report
- **Version**: API version 3 (required)

### Security Benefits
- **No Direct Access**: Portfolio tracker never sees your broker credentials
- **Read-Only**: Can only view data, never execute trades
- **Token-Based**: Uses secure tokens with configurable permissions
- **Time-Limited**: Tokens can be set to expire automatically
- **Permission-Based**: Granular control over what data is accessible

## Data Storage Options

### Memory Storage (Default)
- Fastest performance
- Data lost on restart
- Good for development and testing
- No setup required

### SQLite Storage
- Persistent data storage
- Good for production use
- Requires Prisma setup
- Set `DATA_STORE=sqlite`

## Troubleshooting

### Common Issues

1. **Flex Queries Not Enabled**
   - Contact IBKR support to enable Flex Queries
   - May require account approval (24-48 hours)
   - Ensure you have an active IBKR account

2. **Token Generation Failed**
   - Check if Flex Queries are properly enabled
   - Verify account permissions
   - Try generating a new token

3. **Query ID Not Found**
   - Ensure the Flex Query is properly configured
   - Check that the query includes the required data fields
   - Verify the query is active and not expired

4. **Connection Timeout**
   - Check your internet connection
   - Verify the Flex Query is active
   - Ensure the token hasn't expired

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=true
```

## Performance Tuning

### Sync Intervals
- Default: Manual sync only
- Customizable via environment variables
- Recommended: Sync after market hours

### Data Retention
- Positions: Real-time via Flex Web Service
- Trades: Historical (configurable)
- Snapshots: Daily (configurable)

## Production Deployment

### Security Checklist
- [ ] Use HTTPS
- [ ] Enable authentication
- [ ] Use environment variables
- [ ] Secure database access
- [ ] Enable logging and monitoring
- [ ] Rotate Flex Tokens regularly
- [ ] Use minimal required permissions

### Scaling Considerations
- Database connection pooling
- API rate limiting
- Caching strategies
- Load balancing
- Token management and rotation