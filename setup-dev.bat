@echo off
echo Setting up PediaSignal Development Environment
echo =============================================

echo.
echo 1. Creating .env.local file...
if not exist .env.local (
    copy .env.example .env.local
    echo Created .env.local - Please edit it with your database credentials
) else (
    echo .env.local already exists
)

echo.
echo 2. Installing dependencies...
call npm install

echo.
echo 3. Setup Instructions:
echo    - Edit .env.local with your database URL and OpenAI API key
echo    - For database, you can use:
echo      * Neon (neon.tech) - Free PostgreSQL
echo      * Supabase (supabase.com) - Free PostgreSQL
echo      * Or install PostgreSQL locally
echo.
echo 4. Once database is set up, run:
echo    npm run db:push
echo.
echo 5. Start development server:
echo    npm run dev
echo.
echo The app will be available at http://localhost:5000
pause
