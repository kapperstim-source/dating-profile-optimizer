# 🚀 Deployment Guide - Dating Profile Optimizer

## Deploy to Vercel (FREE - 5 minutes)

### Step 1: Prepare Your Code

```bash
# Make sure everything is in git
git init
git add .
git commit -m "Initial commit: Dating Profile Optimizer"
```

### Step 2: Push to GitHub

```bash
# Create repo on github.com
git remote add origin https://github.com/YOUR_USERNAME/dating-profile-optimizer.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Vercel

**Option A: Via CLI**
```bash
npm i -g vercel
vercel
```

**Option B: Via Web Dashboard**
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Import Project"
4. Select your repository
5. Click "Deploy"

### Step 4: Configure Environment (Optional)

If you want to add server-side processing later, add environment variables in Vercel dashboard:
- Settings → Environment Variables
- NO need to add API key (users provide their own)

### Done! 🎉

Your site is live at: `https://dating-profile-optimizer-[random].vercel.app`

---

## 📱 Custom Domain (Optional - €12/year)

1. Buy domain on Namecheap, GoDaddy, etc.
2. In Vercel → Domains → Add custom domain
3. Add nameservers from Vercel to your domain registrar
4. Wait 24 hours for DNS to update

---

## 💰 Adding Payment (Stripe)

### 1. Create Stripe Account
- Go to stripe.com
- Sign up (free)

### 2. Add to Your App
Create `/app/api/create-payment.ts`:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(req: Request) {
  const { amount } = await req.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: { name: 'Premium Profiles' },
          unit_amount: amount * 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${req.headers.get('origin')}/success`,
    cancel_url: `${req.headers.get('origin')}/`,
  });

  return Response.json({ sessionId: session.id });
}
```

### 3. Add Stripe Key to Vercel
- Settings → Environment Variables
- Add `STRIPE_SECRET_KEY` and `STRIPE_PUBLIC_KEY`

---

## 🔍 Monitor & Analytics

### Vercel Dashboard
- Real-time logs
- Deployment history
- Performance metrics

### Optional: Add Google Analytics
Add to `/app/layout.tsx`:
```tsx
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
```

---

## 🚨 Troubleshooting

**Blank page?**
- Check Vercel logs: Deployments → View logs

**API calls failing?**
- User API key invalid
- Claude API rate limited

**Build errors?**
```bash
# Clean build
rm -rf .next node_modules
npm install
npm run build
```

---

## 🎯 Next: Marketing

Once live:

1. **Reddit Posts**
   - r/Tinder: "I built an AI that got me 50% more matches"
   - r/dating: Link in comments
   
2. **ProductHunt**
   - Launch on ProductHunt
   - Aim for #1 product

3. **TikTok**
   - Show before/after profiles
   - "This AI wrote my dating bio"

4. **Friends**
   - Share with friends
   - Get beta users
   - Collect feedback

---

Good luck! 🚀❤️
