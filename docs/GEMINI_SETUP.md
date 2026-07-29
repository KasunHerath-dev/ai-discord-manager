# Gemini API Setup Guide

This guide helps you create and configure a Gemini API key for use with FasNet AI Discord Manager.

## What You'll Need

- A Google account
- Free or paid access to Google AI Studio

## Step 1: Go to Google AI Studio

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. You may be prompted to log in with your Google account

## Step 2: Create an API Key

1. Click **"Create API Key"** or **"Create new secret key"**
2. Choose to create it in a new project or an existing one
3. Google generates a new API key
4. Click **"Copy"** to copy the key

⚠️ **Keep this key secure!** Treat it like a password.

## Step 3: Save Your API Key

Save the key in a secure location (password manager recommended). You'll need it during FasNet's first-run setup.

**Never:**
- Commit the key to Git
- Share it in emails or messages
- Post it online
- Put it in screenshots

**If you accidentally expose it:**
1. Return to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Find the exposed key
3. Click the trash icon to delete it
4. Create a new key
5. Update FasNet with the new key

## Step 4: Check Free Tier Limits

Google offers free Gemini API access with these limits:

- **Rate limit:** 60 requests per minute
- **Tokens per minute:** 4 million
- **Daily requests:** 1,500 requests per day

To view your usage:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your API key
5. Check **Usage** to see current consumption

### Upgrading to Paid

If you need higher limits:

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Look for **"Upgrade to paid"** or **"Billing"**
3. Add a payment method
4. Your limits increase based on your plan

See [Google AI Studio pricing](https://ai.google.dev/pricing) for details.

## Step 5: Choose a Model

FasNet supports all Gemini models available through Google AI Studio:

**Recommended for most use cases:**
- `gemini-2.0-flash` - Latest, fast, and capable
- `gemini-1.5-flash` - Balanced performance and cost

**For complex plans:**
- `gemini-2.0-flash-exp` - Experimental, newest capabilities

**For cost control:**
- `gemini-1.5-flash` - Smaller and faster

During FasNet's first-run setup, you can specify the model. The default is `gemini-2.0-flash`.

To see available models, run:

```bash
curl -H "x-goog-api-key: YOUR_KEY" \
  "https://generativelanguage.googleapis.com/v1beta/models" | jq
```

## Step 6: Test Your API Key

You can test your API key using curl:

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Say hello"
          }
        ]
      }
    ]
  }'
```

If successful, you'll see a JSON response with the model's reply.

If you get a 403 or 401 error:
- Check that the API key is correct
- Ensure you copied the entire key
- Verify the key hasn't been deleted

## Step 7: Enter in FasNet Setup

1. Start FasNet: `npm start`
2. Open `http://127.0.0.1:8787`
3. Go through the first-run setup
4. When prompted, paste your Gemini API key
5. Select your preferred model
6. Click **"Test Connection"** to verify it works

## Troubleshooting

### 401 Unauthorized / 403 Forbidden

**Problem:** "Gemini API 401" or "Gemini API 403"

**Causes:**
- API key is incorrect or truncated
- API key was deleted from Google AI Studio
- API key has no permission for the model

**Solution:**
1. Verify the key is copied correctly (no extra spaces)
2. Check that the key hasn't been deleted
3. Create a new key if needed
4. Test the key using the curl command above

### Model Not Found

**Problem:** FasNet says "Model not available"

**Causes:**
- Model name is misspelled
- Model is no longer available
- You haven't upgraded to a paid tier for that model

**Solution:**
1. Check available models on [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Use a model from the "Recommended" list above
3. If using an experimental model, ensure you have access

### Rate Limit Exceeded

**Problem:** "429 Too Many Requests" from Gemini

**Causes:**
- You've exceeded free tier limits (60 requests/min, 1,500/day)
- Too many FasNet instances making requests simultaneously

**Solution:**
1. Check your usage in Google Cloud Console
2. Wait a few minutes before retrying
3. Upgrade to a paid tier for higher limits
4. Run only one FasNet instance at a time

### Token Limit Exceeded

**Problem:** "Resource exhausted" when planning large servers

**Causes:**
- Your server structure is too large for the model's context window
- Plan prompt is too detailed

**Solution:**
1. Try with a simpler prompt
2. Break large plans into smaller operations
3. Upgrade to a larger model

## Security Checklist

✓ **Do:**
- Store your API key in a password manager
- Use a unique key for FasNet
- Regenerate keys periodically
- Delete unused keys
- Monitor usage for unexpected activity
- Enable billing alerts if on a paid tier

✗ **Don't:**
- Commit API keys to Git
- Share keys in emails, messages, or screenshots
- Use the same key across multiple applications
- Leave your API key in code comments
- Paste your API key in public forums

## Next Steps

Once your Gemini API key is set up:

1. Set up your [Discord bot](DISCORD_BOT_SETUP.md)
2. Start FasNet and complete the first-run setup
3. See the main [README.md](../README.md) for next steps

## Additional Resources

- [Google AI Studio](https://aistudio.google.com)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Google Cloud Console](https://console.cloud.google.com)
- [Gemini Pricing](https://ai.google.dev/pricing)
