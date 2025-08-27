Write-Host "Medical Guidelines Document Scanner" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Scanning for PDF documents in pdfs folder..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Make sure all your PDFs are in: medical-guidelines\pdfs\" -ForegroundColor White
Write-Host ""

node upload-helper.js scan

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
