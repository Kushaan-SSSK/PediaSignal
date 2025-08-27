@echo off
echo Medical Guidelines Document Scanner
echo ===================================
echo.

echo Scanning for PDF documents in pdfs folder...
echo.
echo Make sure all your PDFs are in: medical-guidelines\pdfs\
echo.

node upload-helper.js scan

echo.
echo Press any key to exit...
pause >nul
