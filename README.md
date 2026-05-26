# Dating Profile Optimizer

AI-powered dating bio optimizer. Genereert 5 viral-worthy varianten van je dating profile in 10 seconden.

## Stack

- Vanilla HTML/CSS/JS frontend (geen build step)
- Vercel Serverless Function in `api/generate.js`
- Anthropic Claude API (server-side)

## Setup

1. Maak een Anthropic API key aan op https://console.anthropic.com
2. Voeg deze in Vercel toe als environment variable `ANTHROPIC_API_KEY`
3. Deploy via Vercel (auto-deploy bij elke push naar main)

## Lokaal draaien

```
npm i -g vercel
vercel dev
```
