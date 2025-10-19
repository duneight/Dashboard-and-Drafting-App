# Public Assets Directory

This directory contains all static assets served by the Fantasy NHL Stats application.

## 📁 Directory Structure

```
public/
├── images/
│   ├── teams/              # NHL team and fantasy team assets
│   │   ├── logos/          # Official NHL team logos (SVG/PNG)
│   │   └── avatars/        # Custom fantasy team avatars
│   ├── players/            # Player-related images
│   │   ├── headshots/      # Official player headshots
│   │   └── placeholders/   # Generic placeholder avatars
│   ├── icons/              # Application icons and graphics
│   │   ├── trophies/       # Hall of Fame trophy icons
│   │   ├── shame/          # Wall of Shame icons
│   │   ├── achievements/   # Achievement badges
│   │   └── stats/          # Statistics visualization icons
│   ├── backgrounds/        # Background images and patterns
│   │   ├── hero/           # Hero section backgrounds
│   │   └── patterns/       # Decorative patterns
│   └── social/             # Social media sharing images
│       ├── og-image.png    # Open Graph default image
│       └── twitter-card.png # Twitter card image
├── fonts/                  # Custom web fonts (if not using CDN)
├── favicon.ico             # Main favicon (ICO format)
├── favicon-16x16.png       # Small favicon
├── favicon-32x32.png       # Standard favicon
├── apple-touch-icon.png    # iOS home screen icon (180x180)
├── android-chrome-192x192.png  # Android icon
├── android-chrome-512x512.png  # Android icon (large)
├── site.webmanifest        # PWA manifest file
└── robots.txt              # Search engine crawling rules
```

## 🎨 Asset Guidelines

### Image Formats

| Asset Type | Recommended Format | Alternative | Notes |
|------------|-------------------|-------------|-------|
| Team Logos | SVG | PNG (transparent) | Scalable preferred |
| Player Photos | WebP | JPEG | WebP for smaller size |
| Icons | SVG | PNG | Vector graphics preferred |
| Backgrounds | WebP | JPEG | Optimize for web |
| Social Cards | PNG | JPEG | 1200x630 recommended |

### Naming Conventions

Use **kebab-case** for all filenames:

```
✅ Good:
- team-logo-edmonton-oilers.svg
- player-headshot-connor-mcdavid-200x200.webp
- trophy-dynasty-builder.svg
- background-hero-ice-pattern.webp

❌ Bad:
- EdmontonOilers.svg
- Connor McDavid.jpg
- trophy_icon.svg
- bg_1.png
```

### Size Recommendations

#### Team Logos
- SVG: Preferred (scalable)
- PNG: 256x256px (with transparency)
- Max file size: 50KB

#### Player Headshots
- Primary: 400x400px (WebP)
- Thumbnail: 200x200px (WebP)
- Max file size: 100KB each

#### Icons
- SVG: Preferred for crisp scaling
- PNG: 32x32, 64x64, 128x128, 256x256
- Max file size: 20KB per icon

#### Backgrounds
- Hero: 1920x1080px (WebP/JPEG)
- Patterns: 512x512px (tiling)
- Max file size: 300KB

#### Social Media
- Open Graph: 1200x630px (PNG/JPEG)
- Twitter Card: 1200x600px (PNG/JPEG)
- Max file size: 1MB

### Optimization

Always optimize images before adding them:

- **Use WebP** when possible for smaller file sizes
- **Compress images** with tools like:
  - [TinyPNG](https://tinypng.com/) for PNG/JPEG
  - [SVGOMG](https://jakearchibald.github.io/svgomg/) for SVG
  - [Squoosh](https://squoosh.app/) for WebP conversion
- **Remove metadata** from images
- **Use appropriate dimensions** (don't upload oversized images)

## 🔗 Usage in Next.js

### Static Image Import (Recommended)

```tsx
import Image from 'next/image'

// For images in public/
<Image 
  src="/images/teams/logos/edmonton-oilers.svg" 
  alt="Edmonton Oilers Logo"
  width={64}
  height={64}
/>
```

### Direct Reference

```tsx
// For background images or regular img tags
<img src="/images/icons/trophies/dynasty-builder.svg" alt="Trophy" />

// In CSS
background-image: url('/images/backgrounds/hero/ice-pattern.webp');
```

### Dynamic Images

```tsx
const teamLogo = (teamName: string) => `/images/teams/logos/${teamName}.svg`

<Image 
  src={teamLogo('edmonton-oilers')} 
  alt={`${teamName} logo`}
  width={64}
  height={64}
/>
```

## 📋 Asset Checklist

### Essential Files
- [ ] favicon.ico (16x16, 32x32, 48x48)
- [ ] favicon-16x16.png
- [ ] favicon-32x32.png
- [ ] apple-touch-icon.png (180x180)
- [ ] android-chrome-192x192.png
- [ ] android-chrome-512x512.png
- [ ] Open Graph image (1200x630)
- [ ] Twitter card image (1200x600)

### Icon Categories
- [ ] Trophy icons for Hall of Fame categories
- [ ] Shame icons for Wall of Shame categories
- [ ] Achievement/badge icons
- [ ] Statistics icons (goals, assists, etc.)

### Team Assets
- [ ] NHL team logos (all 32 teams)
- [ ] Fantasy team avatar options

### Player Assets
- [ ] Placeholder avatar (generic)
- [ ] Player headshots (as available)

## 🎯 Best Practices

1. **Keep it organized** - Use the folder structure consistently
2. **Name descriptively** - Future you will thank you
3. **Optimize everything** - Smaller files = faster site
4. **Use SVG when possible** - Better for logos and icons
5. **WebP over JPEG** - Better compression, wider support now
6. **Add alt text** - Always provide descriptive alt text in code
7. **Test on devices** - Check appearance on mobile and desktop
8. **Version control** - Commit organized, optimized assets

## 🚀 Next Steps

1. Add placeholder favicon files
2. Create default Open Graph image
3. Add NHL team logos as needed
4. Add achievement icons for analytics
5. Create background patterns for hero sections

---

**Need help?** Check the [Next.js Image Optimization docs](https://nextjs.org/docs/app/building-your-application/optimizing/images)

