# Favicon Files Needed

This file is a placeholder reminder for favicon files that should be added to the public folder.

## 📋 Required Favicon Files

### Main Favicon
- [ ] **favicon.ico** - Multi-resolution ICO file (16x16, 32x32, 48x48)
  - Place at: `public/favicon.ico`
  - Format: ICO
  - Dimensions: 16x16, 32x32, 48x48 (multi-resolution)

### PNG Favicons
- [ ] **favicon-16x16.png** - Small icon for browser tabs
  - Place at: `public/favicon-16x16.png`
  - Format: PNG
  - Dimensions: 16x16px

- [ ] **favicon-32x32.png** - Standard favicon
  - Place at: `public/favicon-32x32.png`
  - Format: PNG
  - Dimensions: 32x32px

### Mobile Icons
- [ ] **apple-touch-icon.png** - iOS home screen icon
  - Place at: `public/apple-touch-icon.png`
  - Format: PNG
  - Dimensions: 180x180px

- [ ] **android-chrome-192x192.png** - Android icon (small)
  - Place at: `public/android-chrome-192x192.png`
  - Format: PNG
  - Dimensions: 192x192px

- [ ] **android-chrome-512x512.png** - Android icon (large)
  - Place at: `public/android-chrome-512x512.png`
  - Format: PNG
  - Dimensions: 512x512px

## 🎨 Design Guidelines

### Logo Concept
For a Fantasy NHL Stats app, consider:
- Hockey puck or stick icon
- Trophy or stats icon
- Simple, recognizable design
- Works well at small sizes
- Represents both hockey and statistics

### Color Scheme
Based on your app's theme colors:
- Primary: `#0f172a` (fantasy-dark)
- Accent: Your team colors or hockey blue/red

## 🛠️ Creation Tools

### Online Favicon Generators
1. **[Favicon.io](https://favicon.io/)** - Generate from text, image, or emoji
2. **[RealFaviconGenerator](https://realfavicongenerator.net/)** - Comprehensive favicon generator
3. **[Favicon Generator](https://www.favicon-generator.org/)** - Simple and fast

### Design Tools
1. **Figma** - Design your icon (free)
2. **Canva** - Quick icon creation
3. **Adobe Illustrator** - Professional design
4. **Inkscape** - Free vector graphics editor

## 📝 Implementation Steps

1. **Create/Design** your base icon (ideally 512x512px or larger)
2. **Generate** all favicon sizes using a generator tool
3. **Download** all generated files
4. **Replace** this file and add the favicon files to public/
5. **Update** `app/layout.tsx` to reference the favicons (if not auto-detected)

## 💡 Quick Start

If you need a placeholder quickly:
1. Go to [Favicon.io](https://favicon.io/emoji-favicons/)
2. Choose a hockey-related emoji (🏒 hockey stick or 🏆 trophy)
3. Download the generated package
4. Extract files to the public/ folder
5. Delete this TODO file

## 🔗 Next.js Integration

Next.js automatically detects favicons in the public folder if they follow the standard naming:
- `favicon.ico`
- `icon.png` or `apple-icon.png`

For more control, add to `app/layout.tsx`:
```tsx
export const metadata = {
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}
```

---

**Delete this file** once you've added the actual favicon files!

