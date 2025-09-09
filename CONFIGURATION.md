# Configuration Guide

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

### Data Store Configuration
```bash
# Options: memory, sqlite
DATA_STORE=memory
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

