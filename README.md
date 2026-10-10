# 🔮 Decider Wheel

A mobile-first mystery decision web app. Create a decision with 2 to 12 choices, share the link with a friend on WhatsApp, and let them spin the Mystery Wheel.

**The big difference:** Traditional wheels show all the options on their segments. **Decider Wheel keeps every slice completely anonymous (`?`) until after the spin.**

---

## 🌟 Key Features

1. **Anonymous Mystery Wheel (Zero Spoilers)**
   - Slices display glowing mystery question marks (`?`) before the spin.
   - Options are kept strictly server-side — visiting DevTools or inspecting network requests will NOT reveal the choices before the spin.
2. **Server-Side Atomic Spin**
   - The winning choice is selected server-side at spin time.
   - Real-time physics animation glides and decelerates onto the winning segment.
   - Realistic peg ticking sound effects and celebratory fanfare synthesized via the Web Audio API (zero audio files needed).
   - Mobile haptics (`navigator.vibrate`) and confetti fireworks (`canvas-confetti`).
3. **One Spin Per Decision (Locked Outcome)**
   - Once spun, the outcome is permanently locked.
   - Refreshing or sharing the link shows the final decision and revealed choices. No re-rolls!
4. **Live Creator Tracking**
   - The creator can monitor their link (`/d/[id]?creator=true`).
   - If unspun, it displays a live radar indicator (*"Waiting for your friend to spin..."*).
   - The moment their friend spins, the creator view updates in real-time to celebrate the result.
   - A local history drawer saves created wheels on the creator's device.
5. **Mobile-First & WhatsApp Sharing**
   - One-tap *"Share via WhatsApp"* button with pre-formatted message.
   - Web Share API integration (`navigator.share`) with instant copy toast fallback.
   - Server-side OpenGraph metadata so WhatsApp displays rich preview cards with the decision title.
6. **Supabase Postgres Backend + Zero-Config Local Mode**
   - Full Supabase integration (`@supabase/supabase-js`).
   - SQL schema migration included in `supabase/schema.sql`.
   - Works immediately out-of-the-box with persistent fallback mode even before connecting credentials.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev -- -p 3005
```
Open [http://localhost:3005](http://localhost:3005) in your mobile or desktop browser.

---

## 🗄️ Supabase Configuration (Optional for Cloud Hosting)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open your Supabase **SQL Editor** and run the contents of [supabase/schema.sql](file:///c:/Users/DELL%20LATITUDE%205310/Documents/Antigravity/DeciderWheel/supabase/schema.sql).
3. Copy your project URL and Anon key into `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```
4. Restart your server. Decider Wheel will automatically detect Supabase and show **"Supabase Live"** in the top bar.

---

## 📱 Mobile Preview & WhatsApp Flow

1. On the home page, select a preset (e.g. *Dinner Decider*, *Movie Night*) or type your custom dilemma.
2. Click **Generate Mystery Wheel Link**.
3. Tap **Share via WhatsApp** or copy the link to send to your friend.
4. When your friend opens the link:
   - They see the mystery wheel with hidden segments.
   - They tap **SPIN THE WHEEL**.
   - The wheel animates, lands on the server-selected winner, confetti bursts, and all options morph open!
   - Result is locked permanently.
