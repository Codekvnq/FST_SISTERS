# SQLite Setup Guide for FST Sisters Database

This guide covers Phase 1 of your project: setting up an offline-first SQLite database for the FST Sisters system.

## What this phase does

- Stores sisters, users, and documents locally in SQLite.
- Lets the app work without internet access.
- Keeps the project simple for development and testing.
- Prepares the system for a later Supabase sync layer.

## Step 1: Install dependencies

From the project root, run:

```bash
npm install
cd backend && npm install
```

## Step 2: Create the local database file

The first time the app runs, it should create a local SQLite database file such as:

```text
backend/data/fst-sisters.db
```

You do not need to create this file manually unless you want to prepare the folder first.

## Step 3: Configure environment variables

Create a file named `.env` in the backend folder if it does not exist yet.

Add:

```env
PORT=5000
JWT_SECRET=fst-sisters-dev-secret
DB_TYPE=sqlite
DB_FILE=./data/fst-sisters.db
```

## Step 4: Start the app

From the project root:

```bash
npm start
```

Open:

```text
http://localhost:5000
```

## Step 5: Seed sample data (optional)

If the database is empty, the app can seed demo users and sample sisters automatically.

You can also call the seed endpoint manually:

```text
http://localhost:5000/api/seed
```

## Recommended folder structure for this phase

```text
backend/
  data/
    fst-sisters.db
  models/
  routes/
  utils/
```

## Notes for later Supabase integration

When you move to online storage, the same app structure can be extended with:

- a Supabase connection layer,
- a sync service,
- a two-way sync between SQLite and Supabase.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | Change `PORT` in `.env` or stop the running process |
| Database file not created | Make sure the app starts once and the data folder exists |
| Login fails | Use the demo credentials from the seed data |
| Missing tables | Restart the app after the database initialization step |
