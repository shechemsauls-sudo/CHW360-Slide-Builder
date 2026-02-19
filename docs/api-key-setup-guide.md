# CHW360 — API Key Setup Guide

This document walks you through obtaining the API keys needed for CHW360's AI slide builder and YouTube integration. Each section includes step-by-step instructions.

**Time estimate:** ~20–30 minutes total for all keys.

---

## Table of Contents

1. [YouTube Data API Key](#1-youtube-data-api-key)
2. [xAI (Grok) API Key](#2-xai-grok-api-key) — LLM Provider
3. [Stability AI API Key](#3-stability-ai-api-key) — Image Generation
4. [Replicate API Key](#4-replicate-api-key) — Image Generation
5. [Leonardo AI API Key](#5-leonardo-ai-api-key) — Image Generation

---

## 1. YouTube Data API Key

Used for embedding and pulling YouTube video data into slides.

### Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with a Google account (any Gmail works — ideally the organization account)
3. **Create a project:**
   - Click the project dropdown at the top of the page (next to "Google Cloud")
   - Click **"New Project"**
   - Name it `CHW360` (or similar) and click **Create**
   - Make sure the new project is selected in the dropdown
4. **Enable the YouTube API:**
   - In the left sidebar, go to **APIs & Services > Library**
   - Search for **"YouTube Data API v3"**
   - Click on it, then click **Enable**
5. **Create an API key:**
   - Go to **APIs & Services > Credentials**
   - Click **"+ Create Credentials" > "API Key"**
   - Your key will be displayed — copy it
6. **(Recommended) Restrict the key:**
   - Click **"Edit API Key"** (or click the key name)
   - Under **API restrictions**, select **"Restrict key"**
   - Choose **"YouTube Data API v3"** from the dropdown
   - Click **Save**

**Send Matthew:** The API key (starts with `AIza...`)

---

## 2. xAI (Grok) API Key

Used as an additional LLM option for slide content generation alongside OpenAI and Claude.

### Steps

1. Go to [xAI Console](https://console.x.ai/)
2. Sign in or create an account (you can use your X/Twitter account)
3. Once logged in, you'll land on the dashboard
4. Go to **"API Keys"** in the left sidebar
5. Click **"Create API Key"**
6. Name it `CHW360` and click **Create**
7. Copy the key immediately — it won't be shown again

**Pricing note:** xAI offers $25/month free API credits to start. After that, usage is pay-as-you-go. For slide generation volume, costs should be minimal.

**Send Matthew:** The API key

---

## 3. Stability AI API Key

Used for image generation (Stable Diffusion 3, SDXL). Produces high-quality, stylistically diverse images.

### Steps

1. Go to [Stability AI Platform](https://platform.stability.ai/)
2. Click **"Sign Up"** or **"Log In"**
   - You can sign up with Google or email
3. Once logged in, go to **Account > API Keys** (or visit [platform.stability.ai/account/keys](https://platform.stability.ai/account/keys))
4. Click **"Create API Key"**
5. Name it `CHW360` and click **Create**
6. Copy the key (starts with `sk-...`)

**Pricing note:** New accounts receive 25 free credits. SD3 costs ~3–4 credits per image. Additional credits can be purchased as needed.

**Send Matthew:** The API key (starts with `sk-...`)

---

## 4. Replicate API Key

Used for image generation via hosted models (Flux, SDXL, and hundreds of other open-source models). One key gives access to many different image styles.

### Steps

1. Go to [Replicate](https://replicate.com/)
2. Click **"Sign in"** — you can use your **GitHub account** (easiest) or sign up with email
3. Once logged in, click your profile icon (top right) > **"API Tokens"**
   - Or go directly to [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
4. Click **"Create Token"**
5. Name it `CHW360`
6. Copy the token (starts with `r8_...`)

**Pricing note:** Pay-per-use only (no monthly fee). Image generation typically costs $0.01–0.05 per image depending on the model. Very cost-effective for batch generation.

**Send Matthew:** The API token (starts with `r8_...`)

---

## 5. Leonardo AI API Key

Used for image generation with Leonardo's fine-tuned models. Strong at photorealistic and stylized imagery.

### Steps

1. Go to [Leonardo AI](https://leonardo.ai/)
2. Click **"Launch App"** and create an account (Google sign-in available)
3. Once in the app, click your profile icon (bottom-left) > **"Settings"**
4. Scroll down to the **"API"** section
5. Click **"Generate API Key"** (or it may say "Get API Access")
6. Copy the key

**Pricing note:** Free tier includes 150 tokens/day (roughly 30 images). Paid plans start at $10/month for higher volume.

**Send Matthew:** The API key

---

## Summary Checklist

| Key | Where to get it | What to send |
|-----|----------------|--------------|
| YouTube Data API v3 | [Google Cloud Console](https://console.cloud.google.com/) | Key starting with `AIza...` |
| xAI (Grok) | [xAI Console](https://console.x.ai/) | API key |
| Stability AI | [Stability Platform](https://platform.stability.ai/) | Key starting with `sk-...` |
| Replicate | [Replicate](https://replicate.com/account/api-tokens) | Token starting with `r8_...` |
| Leonardo AI | [Leonardo App](https://app.leonardo.ai/) > Settings | API key |

**How to send:** Please send each key to Matthew via direct message (email or text). Do not share API keys in shared documents or group chats.

---

*If you run into any issues with any of these steps, just screenshot where you're stuck and send it to Matthew — happy to walk you through it.*
