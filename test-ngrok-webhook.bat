@echo off
chcp 65001 >nul
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                🧪 ngrok Webhook Tester                       ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

set NGROK_URL=https://bf5f-2c0f-fc88-48-b02-6c70-2c28-20fd-e03a.ngrok-free.app

echo 🌐 Testing ngrok webhook: %NGROK_URL%
echo.

echo 🔍 Test 1: Health Check
curl -s "%NGROK_URL%/health" || echo ❌ Health check failed
echo.
echo.

echo 🔍 Test 2: Facebook Webhook Verification
curl -s "%NGROK_URL%/webhook?hub.mode=subscribe&hub.verify_token=facebook_verify_token_123&hub.challenge=test123" || echo ❌ Verification failed
echo.
echo.

echo 📋 Facebook Configuration:
echo    Callback URL: %NGROK_URL%/webhook
echo    Verify Token: facebook_verify_token_123
echo.

echo ✨ Testing completed!
pause
