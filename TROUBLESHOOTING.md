# Troubleshooting Guide

## 🔧 "App thinks but doesn't send anything back"

If your app shows a loading/thinking state but never returns a response, here's what I've added and how to debug it:

### ✅ What I've Fixed

I've added comprehensive error handling that will now:

1. **Show user-friendly error messages** in the chat when something goes wrong
2. **Detect when no response is received** and notify you
3. **Provide specific error information** about what failed
4. **Log detailed errors** to the browser console for debugging

### 🎯 New Error Messages You'll See

#### No Response Received
```
⚠️ No response received from the AI. Please try again.
```
**What it means**: The AI service started but didn't return any actions.

#### Network Error
```
❌ Error: Network error: [details]

Please check your API keys in the worker configuration and try again.
```
**What it means**: Connection to the AI service failed.

#### API Error
```
❌ Error: API error (400/500): [details]

Please check your API keys in the worker configuration and try again.
```
**What it means**: The AI service returned an error (invalid request or server error).

### 🔍 Common Causes & Solutions

#### 1. **Missing or Invalid API Keys**

**Symptoms:**
- Error message about API keys
- 401/403 HTTP errors
- Network errors

**Solution:**
```bash
# Check your wrangler.toml file
cd /Users/jibril/Desktop/Hackathon/really-smart-board

# Look for these environment variables:
# OPENAI_API_KEY
# ANTHROPIC_API_KEY  
# GOOGLE_API_KEY

# Add them to your wrangler.toml or set them in Cloudflare dashboard
```

**Fix:**
1. Open `wrangler.toml`
2. Add your API keys:
```toml
[vars]
OPENAI_API_KEY = "sk-..."
ANTHROPIC_API_KEY = "sk-ant-..."
GOOGLE_API_KEY = "..."
```

Or use secrets:
```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put GOOGLE_API_KEY
```

#### 2. **Worker Not Running**

**Symptoms:**
- Network errors
- Connection refused
- `/stream` endpoint not found

**Solution:**
```bash
# Make sure the worker is running
cd /Users/jibril/Desktop/Hackathon/really-smart-board
npm run dev
```

You should see both:
- ✅ Vite dev server (frontend)
- ✅ Wrangler dev server (worker/backend)

#### 3. **Model Not Available**

**Symptoms:**
- API errors
- Rate limiting messages
- Model not found errors

**Solution:**
Check `worker/models.ts` to see which models are configured and ensure you have access to them.

#### 4. **Rate Limiting**

**Symptoms:**
- Works sometimes, fails other times
- 429 HTTP errors
- "Too many requests" messages

**Solution:**
- Wait a few minutes between requests
- Check your API usage limits
- Consider upgrading your API plan

#### 5. **Long Response Time**

**Symptoms:**
- Thinking for 30+ seconds
- Eventually times out
- No error shown

**Solution:**
The AI models can take time, especially with complex requests. Wait up to 60 seconds. If it consistently times out:
1. Try simpler prompts
2. Check your internet connection
3. Verify the AI service status

### 🛠️ Debugging Steps

#### Step 1: Open Browser Console
Press **F12** or **Cmd+Option+I** and look for:

**Good signs:**
```
✓ WebSocket connected
✓ Streaming started
✓ Action received: create
```

**Bad signs (will now show helpful errors):**
```
✗ Agent error: Network error...
✗ No actions received from the agent
✗ Failed to parse action: ...
```

#### Step 2: Check Network Tab
1. Open DevTools → Network tab
2. Filter for `/stream`
3. Look for the POST request
4. Check:
   - **Status**: Should be 200 OK
   - **Response**: Should show streaming data
   - **Time**: Should complete within 60s

#### Step 3: Check Worker Logs
If running locally:
```bash
# Worker logs will show in the terminal where you ran `npm run dev`
# Look for errors like:
# - Missing API keys
# - Model errors
# - Parse errors
```

#### Step 4: Test with Simple Prompt
Try a very simple request first:
```
"Draw a red circle"
```

If this works, gradually increase complexity.

### 📊 Error Types Reference

| Error Message | Cause | Solution |
|--------------|-------|----------|
| Network error | Can't reach worker | Check worker is running |
| API error (401) | Invalid API key | Update API keys |
| API error (429) | Rate limited | Wait or upgrade plan |
| API error (500) | AI service down | Check AI provider status |
| No response received | Model returned empty | Try different prompt |
| Parse error | Malformed AI response | Report as bug |
| Connection refused | Worker not running | Start worker with `npm run dev` |

### 🔄 Quick Fix Checklist

- [ ] Worker is running (`npm run dev`)
- [ ] Browser console shows no errors
- [ ] API keys are set correctly
- [ ] Network tab shows successful `/stream` request
- [ ] Tried simpler prompt
- [ ] Waited at least 30 seconds
- [ ] Cleared browser cache/localStorage
- [ ] Checked AI provider status page

### 💡 Pro Tips

1. **Always check the console first** - All errors are now logged with helpful details
2. **Use simple prompts for testing** - "Draw a square" is a good test
3. **Monitor the Network tab** - Watch the `/stream` request in real-time
4. **Check worker terminal** - Backend errors show there
5. **Clear data regularly** - Use the "Clear All Data" button if things get weird

### 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Copy the full error** from the browser console
2. **Note what prompt** you were using
3. **Check which model** is selected
4. **Verify environment**:
   - Node version: `node --version`
   - Browser: Chrome/Firefox/Safari
   - OS: Mac/Windows/Linux

### 🔬 Advanced Debugging

Enable verbose logging:

```javascript
// In browser console:
localStorage.setItem('debug', 'tldraw:*')
location.reload()
```

This will show detailed logs about everything happening in the agent system.

---

**The improvements I made will catch most issues automatically and show you helpful error messages in the chat interface. No more silent failures!** 🎉

