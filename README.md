# 🏒 Fantasy NHL Stats

[![Next.js](https://img.shields.io/badge/Next.js-15.5.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.14-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.17.1-2D3748?style=flat-square&logo=prisma)](https://prisma.io/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)
[![Production Status](https://img.shields.io/badge/Status-Ready%20for%20Deployment-green?style=flat-square)](docs/PROJECT_STATUS.md)

> **Track, analyze, and celebrate your Fantasy NHL league's greatest moments and most epic fails!**

A comprehensive web application that transforms your Yahoo Fantasy NHL league data into engaging analytics, featuring Hall of Fame celebrations and Wall of Shame highlights. Built with modern web technologies and designed for fantasy hockey enthusiasts.

## 🚀 Production Status

**Current Status:** 🟡 **READY FOR DEPLOYMENT**  
**Database:** ✅ Optimized & Synced (2024 season complete)  
**Features:** ✅ All core functionality implemented  
**Build:** ✅ TypeScript strict mode, no errors  

[📊 View detailed project status →](docs/PROJECT_STATUS.md)

## ✨ Features

### 🏆 Hall of Fame
Celebrate the legends of your league with categories like:
- **Dynasty Builder** - Most total wins across all seasons
- **The Champion** - Most championships won
- **Point Machine** - Highest fantasy point totals
- **Perfect Season** - Best single-season records
- **The Clutch Performer** - Most playoff victories

### 💩 Wall of Shame
Highlight the... memorable moments with categories like:
- **Eternal Loser** - Most total losses
- **Last Place Larry** - Most last-place finishes
- **The Unlucky One** - Most points against
- **Rock Bottom** - Worst single-season records
- **Commissioner Fails** - The commissioner's curse

### 📊 Dashboard & Analytics
- **Real-time standings** and matchup tracking
- **Interactive charts** and statistics visualization
- **Historical data** analysis across multiple seasons
- **Mobile-responsive** design for on-the-go checking

### 🔄 Live Data Sync
- **Automatic daily sync** with Yahoo Fantasy Sports API
- **Real-time updates** during game days
- **Historical data** preservation and analysis

## 🚀 Live Demo

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_Site-green?style=for-the-badge)](https://your-app.vercel.app)

*Coming soon - currently in development*

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | Next.js 15, React 19, TypeScript | Modern web framework with type safety |
| **Styling** | TailwindCSS 4.1 | Utility-first CSS framework |
| **Database** | PostgreSQL + Prisma ORM | Robust data persistence |
| **API** | Yahoo Fantasy Sports API | Live fantasy data integration |
| **Deployment** | Vercel | Serverless hosting with edge functions |
| **Charts** | Chart.js + React-ChartJS-2 | Interactive data visualization |

## 📱 Screenshots

*Screenshots coming soon*

## 🏗️ Project Structure

```
fantasy-nhl-stats/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── components/        # React components
│   └── (routes)/          # Page routes
├── lib/                   # Business logic & utilities
│   ├── analytics/         # Hall of Fame & Wall of Shame logic
│   ├── api/               # Yahoo API client
│   └── db/                # Database configuration
├── public/                # Static assets
│   ├── images/            # Team logos, player photos, icons
│   └── favicon.ico         # Website icons
├── docs/                  # Documentation
└── prisma/                # Database schema
```

## 🚀 Quick Start

1. **Clone and install**
   ```bash
   git clone https://github.com/yourusername/fantasy-nhl-stats.git
   cd fantasy-nhl-stats
   npm install
   ```

2. **Set up environment**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your credentials
   ```

3. **Set up database**
   ```bash
   npm run db:migrate
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

5. **Visit** [http://localhost:3000](http://localhost:3000)

> 📖 **Need detailed setup instructions?** Check out our [Setup Guide](docs/SETUP_GUIDE.md)

## 📊 Analytics Categories

### Hall of Fame Categories (19)
**Core Categories:** Dynasty Builder, The Champion, Playoff Merchant, The Consistent One, Point Machine, Perfect Season, Scoring Explosion, Runaway Winner, Week Winner, The Clutch Performer

**Specialized Categories:** Set It & Forget It, The Steady Hand, Brick Wall, Shutout King, Save % Champion, Sniper, Playmaker, PP Specialist, SH Hero, The Enforcer

### Wall of Shame Categories (19)
- Eternal Loser, Last Place Larry, The Unlucky One, Worst Record
- Point Desert, Rock Bottom, Playoff Choke, Losing Streak
- Waiver Warrior, The Overthinker, Inactive Owner, Goalie Graveyard
- Can't Buy a Goal, Penalty Box, The Minus, Blowout Victim
- Never Stood a Chance, The Heartbreaker, Commissioner Fails, Cursed Team Name

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run migrate` | Import data from JSON files |

## 📚 Documentation

| Document | Purpose | Description |
|----------|---------|-------------|
| [📊 Project Status](docs/PROJECT_STATUS.md) | Current status & roadmap | Production readiness, completed features, next steps |
| [🚀 Getting Started](docs/GETTING_STARTED.md) | Setup & deployment | Complete setup guide, environment config, Vercel deployment |
| [🔧 Technical Reference](docs/TECHNICAL_REFERENCE.md) | Developer docs | Design system, database schema, API endpoints, code patterns |

### Quick Links
- **Current Status**: [View project status →](docs/PROJECT_STATUS.md)
- **Setup Guide**: [Get started →](docs/GETTING_STARTED.md)
- **Technical Docs**: [Developer reference →](docs/TECHNICAL_REFERENCE.md)

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use TailwindCSS for styling
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Yahoo Fantasy Sports** for providing the API
- **Next.js team** for the amazing framework
- **TailwindCSS** for the utility-first CSS approach
- **Prisma** for the excellent database toolkit
- **Vercel** for seamless deployment

## 📞 Support

Having issues? Here are some ways to get help:

- 🐛 **Bug Reports**: [Open an issue](https://github.com/yourusername/fantasy-nhl-stats/issues)
- 💡 **Feature Requests**: [Start a discussion](https://github.com/yourusername/fantasy-nhl-stats/discussions)
- 📖 **Documentation**: Check the [docs](docs/) folder
- 💬 **Questions**: Join our community discussions

## 🌟 Show Your Support

If this project helped you, please give it a ⭐️!

---

<div align="center">

**Built with ❤️ for Fantasy Hockey Enthusiasts**

[🏒 NHL](https://www.nhl.com/) • [📊 Fantasy](https://hockey.fantasysports.yahoo.com/) • [⚡ Next.js](https://nextjs.org/) • [🎨 TailwindCSS](https://tailwindcss.com/)

</div>
