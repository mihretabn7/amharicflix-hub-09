# 🎬 AmharicFlix Hub

A premium, high-performance movie streaming and discovery platform dedicated to Amharic cinema. AmharicFlix combines a modern React frontend with a powerful Supabase backend and YouTube Data API integration to provide a seamless cinematic experience.

## 🌟 Key Features

- **Dynamic Movie Discovery:** Automated fetching and categorization of Ethiopian movies via YouTube Data API v3.
- **Advanced Watch Tracking:** Intelligent view counting and user watch-history tracking with server-side validation.
- **Genre Intelligence:** Community-driven genre suggestions and popularity ranking.
- **User Engagement:** Integrated movie rating system, reporting tools, and social sharing.
- **Responsive Design:** A "Netflix-style" cinematic UI optimized for both desktop and mobile devices.

## 🚀 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **UI Components** | Shadcn UI, Lucide React, Framer Motion |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions) |
| **API Integration** | YouTube Data API v3 |
| **State Management** | TanStack Query (React Query) |

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/mihretabn7/amharicflix-hub-09.git
cd amharicflix-hub-09
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Development Server
```bash
npm run dev
```

## ⚙️ Backend Architecture

### Supabase Edge Functions
The project utilizes serverless Edge Functions for critical background tasks:
- **`fetch-ethiopian-movies`**: Automated pipeline that searches, validates, and imports movie data from YouTube.
- **`track_movie_view_with_country`**: Optimized RPC function for real-time watch-count increments.

### Database Schema
- **`movies`**: Stores metadata, YouTube IDs, and global view counts.
- **`user_movie_history`**: Tracks individual user progress and duration.
- **`genre_suggestions`**: Manages community-driven genre tagging.

## 📄 License
This project is proprietary. All rights reserved.
