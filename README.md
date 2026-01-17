# MeNabung Mini-App

AI-powered DeFi savings advisor for IDRX on Base. Built as a Farcaster Mini-App.

## Setup

```bash
cp .env.local.example .env.local  # Add your API keys
npm install
npm run dev
```

## Environment Variables

| Variable | Description |
| ---------- | ------------- |
| `OPENAI_API_KEY` | OpenAI API key for AI chat |
| `NEXT_PUBLIC_ONCHAINKIT_API_KEY` | Coinbase OnchainKit key |

## Stack

- Next.js 16 + React 19 + TypeScript
- Farcaster Mini-App SDK
- Wagmi + Viem + OnchainKit (Base L2)
- OpenAI GPT-4o-mini

## Features

- **AI Advisor** - Chat-based savings recommendations
- **Portfolio** - Track allocations across strategies
- **Deposit/Withdraw** - Full vault interaction flow

## Strategies

| Strategy | APY | Description |
| ---------- | ----- | ------------- |
| Options | 8% | Thetanuts premium yields |
| LP | 12% | Aerodrome trading fees |
| Staking | 15% | IDRX staking rewards |

## Links

- **Live**: <https://menabung-miniapp.vercel.app>
- **Base.dev**: <https://base.dev/preview>
