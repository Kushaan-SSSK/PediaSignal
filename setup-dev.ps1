Write-Host "Setting up PediaSignal Development Environment" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

Write-Host "`n1. Creating .env.local file..." -ForegroundColor Yellow
if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.example" ".env.local"
    Write-Host "Created .env.local - Please edit it with your database credentials" -ForegroundColor Green
} else {
    Write-Host ".env.local already exists" -ForegroundColor Blue
}

Write-Host "`n2. Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "`n3. Setup Instructions:" -ForegroundColor Cyan
Write-Host "   - Edit .env.local with your database URL and OpenAI API key" -ForegroundColor White
Write-Host "   - For database, you can use:" -ForegroundColor White
Write-Host "     * Neon (neon.tech) - Free PostgreSQL" -ForegroundColor White
Write-Host "     * Supabase (supabase.com) - Free PostgreSQL" -ForegroundColor White
Write-Host "     * Or install PostgreSQL locally" -ForegroundColor White

Write-Host "`n4. Once database is set up, run:" -ForegroundColor Cyan
Write-Host "   npm run db:push" -ForegroundColor White

Write-Host "`n5. Start development server:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White

Write-Host "`nThe app will be available at http://localhost:5000" -ForegroundColor Green

Read-Host "`nPress Enter to continue"
