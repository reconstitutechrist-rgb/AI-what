# 🚀 AI App Builder - Conversation-First Full-Stack Generator

Build complete React and Next.js applications through natural conversation with Claude AI. No coding required - just describe what you want to build!

![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![AI](https://img.shields.io/badge/AI-Claude%20Sonnet%204.5-purple)

---

## ✨ Key Features

### 🤖 **Conversation-First Interface**
- Chat with AI like you're talking to a developer
- Natural language app generation
- Iterative refinements through conversation
- Q&A mode for programming questions

### 🏗️ **Full-Stack Support**
- **Frontend-only apps**: Instant preview in browser
- **Full-stack apps**: Next.js with database, auth, APIs
- Prisma ORM, NextAuth.js, API routes included
- One-click export with deployment instructions

### 🔄 **Smart Modification System**
- Diff-based surgical edits (Phase 2 complete)
- Only changes what you request - preserves everything else
- Simple changes: Auto-applied instantly
- Complex changes: Review and approve before applying
- Staged modifications for big features

### 📸 **Image-Inspired Designs**
- Upload screenshots or designs
- AI extracts colors, styles, and patterns
- Recreates the aesthetic with Tailwind CSS
- Perfect for replicating existing designs

### 🕒 **Advanced Version Control**
- Automatic version saving on every change
- Unlimited undo/redo (Ctrl+Z / Ctrl+Shift+Z)
- Fork/branch to create alternative versions
- Compare versions side-by-side
- One-click revert to any previous version

### 📦 **Export & Deploy**
- Download as ZIP with complete project structure
- Includes package.json, configuration, README
- Deployment instructions for Vercel/Netlify
- Ready for production use

### 🔐 **Password Protected**
- Built-in authentication
- Default password: "Nerd" (change in `.env.local`)
- Multi-user ready

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/takk387/AI-app.git
cd AI-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# Run the development server
npm run dev

# Open http://localhost:3000
```

### Environment Setup

Create a `.env.local` file:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
SITE_PASSWORD=Nerd
```

---

## 💡 How to Use

### 1. **Start a Conversation**
Just describe what you want to build:
- "Build a todo app with priorities"
- "Create a blog with dark mode"
- "Make a dashboard with charts"

### 2. **Iterative Refinement**
Continue the conversation to improve:
- "Add a dark mode toggle"
- "Make the buttons blue"
- "Add export to CSV functionality"

### 3. **Preview & Test**
- Frontend apps: Instant live preview
- Full-stack apps: Download and run locally
- Fullscreen mode available
- View/edit code in browser

### 4. **Version Control**
- **Ctrl+Z**: Undo last change
- **Ctrl+Shift+Z**: Redo
- Click **🕒 History** to see all versions
- Fork to create alternative versions

### 5. **Export & Deploy**
- Click **📦 Export** for deployment instructions
- Download ZIP with complete project
- Deploy to Vercel, Netlify, or anywhere

---

## 🎯 What Can You Build?

### Frontend-Only Apps (Instant Preview)
- ✅ Todo lists, calculators, games
- ✅ Dashboards, charts, data visualizations  
- ✅ Landing pages, portfolios
- ✅ UI components, design systems

### Full-Stack Apps (Download Required)
- ⚡ Blogs with CMS
- ⚡ E-commerce platforms
- ⚡ SaaS applications
- ⚡ Social media apps
- ⚡ CRM systems
- ⚡ Project management tools

---

## 🛠️ Technology Stack

### Core
- **AI**: Claude Sonnet 4.5 (Anthropic)
- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS

### Preview System
- **Sandpack**: Browser-based React preview
- **Live Editing**: Real-time code updates

### Full-Stack Capabilities
- **Database**: Prisma ORM (PostgreSQL, MySQL, MongoDB, SQLite)
- **Authentication**: NextAuth.js (OAuth, JWT)
- **File Upload**: Local storage or cloud (S3, Cloudinary)
- **Real-time**: Pusher, Server-Sent Events
- **Email**: Resend, Nodemailer

---

## 📚 Documentation

- **[Current Features](./CURRENT_FEATURES.md)** - Complete feature list
- **[Keyboard Shortcuts](./KEYBOARD_SHORTCUTS.md)** - Hidden shortcuts
- **[Modification Guide](./MODIFICATION_GUIDE.md)** - How diff system works
- **[Version Control](./VERSION_CONTROL.md)** - Undo/redo/fork/compare
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues
- **[Full-Stack Guide](./FULL_STACK_GUIDE.md)** - Backend features
- **[Deployment](./DEPLOYMENT_GUIDE.md)** - How to deploy

---

## 🔑 Features in Detail

### Dual Chat System
The app intelligently routes your messages:
- **Questions**: "What is useState?" → AI answers
- **Build requests**: "Build a todo app" → AI generates

### Modification System (Phase 2)
Smart diff-based modifications:
- **Simple changes**: Color, text, styling → Auto-applied
- **Medium changes**: New features, dark mode → Auto-applied
- **Complex changes**: Auth, major refactors → Requires approval

### Image Upload
Upload any image and AI will:
- Extract color palette
- Identify design style
- Recreate the aesthetic
- Match fonts and layouts

---

## ⌨️ Keyboard Shortcuts

### Version Control
- `Ctrl+Z` / `Cmd+Z` - Undo
- `Ctrl+Shift+Z` / `Cmd+Shift+Z` - Redo
- `Ctrl+Y` / `Cmd+Y` - Redo (alternative)

### Interface
- `Enter` - Send message
- `Esc` - Close modals

---

## 🐛 Known Issues

### Complex Modifications
Some complex modifications (like adding authentication) may fail due to AI limitations. **Solution**: Break into smaller steps or use full-stack templates.

### Token Limits
Very large apps may approach the 16K token limit. **Solution**: Build incrementally through conversation stages.

See [Troubleshooting Guide](./TROUBLESHOOTING.md) for more.

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard:
# ANTHROPIC_API_KEY=your-key
# SITE_PASSWORD=your-password
```

### Netlify
```bash
# Install Netlify CLI  
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Add environment variables in Netlify dashboard
```

See [Deployment Guide](./DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 📊 Current Status

- ✅ **Phase 0**: Planning (Complete)
- ✅ **Phase 1**: Core AI generation (Complete)
- ✅ **Phase 2**: Smart modification system (Complete)
- 🔄 **Phase 3**: See [Future Implementation](./FUTURE_IMPLEMENTATION_TODO.md)

---

## 🤝 Contributing

Contributions welcome! Please read the contributing guidelines first.

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- Built with [Claude](https://anthropic.com) by Anthropic
- Preview powered by [Sandpack](https://sandpack.codesandbox.io/)
- UI inspired by Base44's clean design philosophy

---

## 📞 Support

- 📖 [Documentation](./CURRENT_FEATURES.md)
- 🐛 [Report Issues](https://github.com/takk387/AI-app/issues)
- 💬 [Discussions](https://github.com/takk387/AI-app/discussions)

---

**Built with ❤️ using AI-powered development**
