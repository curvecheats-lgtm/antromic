@echo off
echo ============================================
echo ANTROMIC API DEPLOYMENT
echo ============================================
echo.
echo Installing Wrangler if needed...
npm install -g wrangler
echo.
echo Logging into Cloudflare...
wrangler login
echo.
echo Deploying Worker...
wrangler deploy
echo.
echo ============================================
echo DEPLOYMENT COMPLETE!
echo ============================================
echo.
echo Your API should be live at:
echo https://antromic-api.umiwinsupport.workers.dev
echo.
echo Test the health check:
echo https://antromic-api.umiwinsupport.workers.dev/api/health
echo.
pause
