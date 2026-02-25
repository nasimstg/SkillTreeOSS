# Security & Data Privacy Policy (Focusing on Supabase RLS)

Since you are handling user authentication (OAuth) and storing their progress, you need a document detailing how that data is protected.

* **Row Level Security (RLS):** Supabase uses PostgreSQL RLS. You need a document defining the exact policies. For example: *A user can only `SELECT` and `UPDATE` their own row in the `user_progress` table.* * **Data Minimization:** What exact data are you pulling from the GitHub/Google OAuth payload? (e.g., just email and display name).