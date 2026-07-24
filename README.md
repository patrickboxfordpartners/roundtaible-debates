# RoundtAIble Debates

A real-time AI-powered debate platform where historical figures engage in dynamic discussions on modern topics. Built for dual-use: education (classroom debates with fact-checking and Socratic questioning) and sales demos (showcasing AI conversation capabilities).

**Live Demo:** [theroundtaible.com](https://theroundtaible.com)

## Overview

RoundtAIble brings historical figures to life through AI-powered personas that debate contemporary issues. Each persona has a unique voice, debate style, and personality based on their historical character. Users can watch debates unfold in real-time, inject their own voice inputs, and learn through interactive discussion.

### Key Features

- **6+ Historical Personas** - Edison, Morgan, Carnegie, Twain, Adams, Tesla, and more with authentic voices and debate styles
- **Real-Time AI Debates** - Dynamic conversations powered by xAI Grok 3 Mini with persona-specific system prompts
- **Voice Synthesis** - ElevenLabs integration provides unique voices for each historical figure
- **Voice Input** - Web Speech API allows users to inject their own comments into debates
- **Dual Mode System**:
  - **Standard Mode** - Entertainment-focused debates for demos and general use
  - **Educational Mode** - Classroom-ready with vocabulary highlights, fact citations, Socratic questions, and grade-level adjustments (6-12, college)
- **Lightning Rounds** - Fast-paced 60-second debates for quick demonstrations
- **Multiplayer Viewing** - Real-time synchronization across multiple viewers using Supabase Realtime
- **Analytics & Tracking** - PostHog integration for usage metrics and user behavior
- **Subscription Tiers** - Stripe-powered Pro (25 debates/month) and Edu (100 debates/month) plans
- **Teacher Dashboard** - Class management, assignments, and student progress tracking
- **Student Dashboard** - Access to assigned debates, quiz functionality, and tournament participation

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tooling
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations and theatrical UI transitions
- **Radix UI** - Accessible component primitives
- **React Router** - Client-side routing
- **shadcn/ui** - Component library

### Backend & Services
- **Supabase** - Authentication, PostgreSQL database, Realtime subscriptions, Edge Functions
- **xAI Grok 3 Mini** - AI persona responses and debate summaries
- **ElevenLabs** - Text-to-speech for persona voices
- **Stripe** - Subscription management and payment processing
- **PostHog** - Product analytics and event tracking

### Infrastructure
- **Vercel** - Deployment and hosting
- **Supabase Edge Functions** - Serverless API proxies:
  - `ai-proxy` - Grok API integration with rate limiting
  - `tts-proxy` - ElevenLabs voice synthesis
  - `stripe-checkout` - Payment session creation
  - `stripe-webhook` - Subscription event handling
  - `stripe-portal` - Customer portal access

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Supabase account
- xAI API key (for Grok)
- ElevenLabs API key (for voice synthesis)
- Stripe account (for payments, optional for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/patrickboxfordpartners/roundtaible-debates.git
cd roundtaible-debates

# Install dependencies
npm install
# or
bun install

# Copy environment template
cp .env.example .env
```

### Environment Variables

Create a `.env` file with the following:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe (frontend)
VITE_STRIPE_PRICE_PRO_MONTHLY=price_id
VITE_STRIPE_PRICE_PRO_YEARLY=price_id
VITE_STRIPE_PRICE_EDU_MONTHLY=price_id
VITE_STRIPE_PRICE_EDU_YEARLY=price_id
```

**Supabase Edge Function Secrets** (set via Supabase CLI or dashboard):
```bash
XAI_API_KEY=your_xai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### Database Setup

Run the provided SQL migrations in your Supabase project:

```bash
# Tables for debates, users, and analytics
supabase/migrations/*.sql

# Or use individual files:
debates-table-migration.sql
waitlist-migration.sql
supabase_contact_table.sql
```

### Development

```bash
# Start development server
npm run dev
# or
bun run dev

# Open http://localhost:5173
```

### Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
roundtaible-debates/
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (Auth, DebateMode)
│   ├── data/            # Debate topics, personas, quiz data
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── pages/           # Route components
│   │   ├── Index.tsx          # Main debate interface
│   │   ├── Landing.tsx        # Marketing landing page
│   │   ├── TeacherDashboard.tsx
│   │   ├── StudentDashboard.tsx
│   │   ├── Pricing.tsx
│   │   └── ...
│   ├── services/        # API integrations
│   │   ├── aiService.ts       # Grok AI persona generation
│   │   ├── voiceInputService.ts # Web Speech API
│   │   ├── supabaseClient.ts
│   │   └── analytics.ts       # PostHog tracking
│   └── App.tsx
├── supabase/
│   ├── functions/       # Edge Functions
│   │   ├── ai-proxy/         # xAI Grok integration
│   │   ├── tts-proxy/        # ElevenLabs voice synthesis
│   │   ├── stripe-checkout/
│   │   ├── stripe-webhook/
│   │   └── stripe-portal/
│   └── migrations/      # Database schema
├── public/              # Static assets
└── scripts/             # Build and deployment scripts
```

## Use Cases

### Education
- **Classroom Debates** - Teachers assign debate topics to students
- **Historical Perspective** - Students engage with authentic historical viewpoints
- **Critical Thinking** - Socratic questions prompt deeper analysis
- **Grade-Level Content** - Adjustable vocabulary and complexity (6-12, college)
- **Fact-Checking** - Citations and historical references in educational mode
- **Quiz Mode** - Test comprehension after debates

### Sales & Demos
- **Product Demonstrations** - Showcase AI conversation capabilities
- **Corporate Training** - Leadership debates on business ethics
- **Entertainment** - Streaming debates on controversial modern topics
- **Lightning Rounds** - Quick, high-impact demos in 60 seconds

### Research
- **Argument Testing** - Evaluate how different personas approach topics
- **Conversation Dynamics** - Study multi-agent AI interactions
- **Historical Simulation** - Test how historical figures might view modern issues

## Key Features Detail

### Persona System

Each historical figure has:
- **Unique Voice** (ElevenLabs) - Distinct vocal characteristics
- **Character Context** - Historical background and viewpoints
- **Debate Style** - Personality-driven response patterns
  - Edison: Pragmatic, solution-focused
  - Morgan: Capitalist, bottom-line thinking
  - Twain: Witty, satirical, humorous
  - Tesla: Visionary, eccentric, scientific
  - Carnegie: Philanthropic, socially conscious
  - Adams: Philosophical, historical perspective

### Circuit Breaker Pattern

The AI service includes automatic circuit breaking:
- Stops API calls after quota/auth failures
- Auto-recovers after 60-second cooldown
- Fallback responses maintain user experience
- Rate limiting: 60 requests/minute per IP

### Educational Mode

When enabled, debates include:
- **Vocabulary Highlights** - Definitions for specialized terms
- **Fact Citations** - Historical events, studies, dates
- **Socratic Questions** - Prompts for critical thinking
- **Grade-Level Language** - Adjusted complexity (6-8, 9-10, 11-12, college)
- **Summary Takeaways** - Key learnings and evidence evaluation

## Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch
```

Test coverage includes:
- AI service circuit breaker logic
- Debate history management
- Analytics event tracking
- Realtime synchronization

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Source-available. You may read and fork this code for personal or educational use. Commercial use, redistribution, or deployment in a competing product is not permitted without written permission from Boxford Partners.

## Acknowledgments

- Historical personas inspired by the Algonquin Round Table
- Voice synthesis by [ElevenLabs](https://elevenlabs.io)
- AI reasoning by [xAI Grok](https://x.ai)
- Components from [shadcn/ui](https://ui.shadcn.com)

## Support

For issues, questions, or feature requests, please open an issue on GitHub or contact the maintainers.

---

**Built by [Boxford Partners](https://boxfordpartners.com)**
