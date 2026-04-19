# ⚖️ DIAZ LAW — Official Website

**Lawyer and Notary Public · Private Practitioner**  
Atty. Jushua Mari Lumague Diaz

---

## 🌐 Live Features

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Landing page with services and CTA |
| Appointment | `/appointment` | Public booking form (no login needed) |
| Contact | `/contact` | Contact info + Send a Message form |
| About | `/about` | Attorney profile, education, areas of practice |
| **Admin** | `/admin-diazlaw-portal` | 🔒 Secret admin dashboard |

---

## 🧰 Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + CSS Variables (Dark/Light mode)
- **Database:** Supabase (PostgreSQL — free tier)
- **Deployment:** Vercel (free tier)
- **Fonts:** Playfair Display + Source Sans 3 (Google Fonts)

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/diaz-law.git
cd diaz-law
```

### 2. Set up Supabase (free)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a **New Project**
3. Go to the **SQL Editor** and run this script:

```sql
-- Appointments table
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  address TEXT NOT NULL,
  age INT NOT NULL,
  issue_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  appointment_date DATE,
  notes TEXT
);

-- Contact messages table
CREATE TABLE contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for the booking form)
CREATE POLICY "Allow public insert appointments"
  ON appointments FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public insert messages"
  ON contact_messages FOR INSERT TO anon WITH CHECK (true);

-- Allow admin reads (using anon key — keep admin URL private)
CREATE POLICY "Allow anon read appointments"
  ON appointments FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon read messages"
  ON contact_messages FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon update appointments"
  ON appointments FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anon update messages"
  ON contact_messages FOR UPDATE TO anon USING (true);
```

4. Go to **Project Settings → API**
5. Copy your **Project URL** and **anon public key**

### 3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Install and run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌍 Deploy to Vercel (Free)

1. Push this project to a **GitHub repository**
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy** ✅

Your site will be live at `https://your-project.vercel.app`

---

## 🔒 Admin Dashboard

The admin dashboard is accessed via a **secret URL**:

```
https://your-site.vercel.app/admin-diazlaw-portal
```

**Share this link privately** with Atty. Diaz and the secretary only.

### Admin Features:
- 📊 Stats overview (total, pending, confirmed, completed, unread messages)
- 📋 Appointments table with search + status filter
- 📅 Set appointment date per client
- ✏️ Add secretary notes (internal only)
- 📤 Export appointments to CSV
- 💬 Messages inbox with unread indicators
- 📧 Reply to messages directly via email

---

## 📁 Project Structure

```
diaz-law/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Home
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Global styles + CSS variables
│   │   ├── appointment/page.tsx        # Booking form
│   │   ├── contact/page.tsx            # Contact + message form
│   │   ├── about/page.tsx              # Attorney profile
│   │   └── admin-diazlaw-portal/
│   │       └── page.tsx                # Admin dashboard (secret)
│   ├── components/
│   │   ├── Navbar.tsx                  # Top nav with dark mode toggle
│   │   ├── Footer.tsx                  # Footer with contact info
│   │   └── ThemeProvider.tsx           # Dark/light mode context
│   └── lib/
│       ├── supabase.ts                 # Supabase client + types
│       └── constants.ts               # Issue types dropdown + status colors
├── .env.example                        # Environment variable template
├── tailwind.config.js
├── next.config.js
└── tsconfig.json
```

---

## 📞 Contact Info (in the website)

| Channel | Details |
|---------|---------|
| Phone | 0995 263 8355 |
| Email | jushuamari@gmail.com |
| Facebook | [Jushua Mari Lumague Diaz](https://www.facebook.com/jushuamari.diaz) |

---

## 📝 License

Private project for DIAZ LAW. All rights reserved.
