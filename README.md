# AfterLife - Bereavement Support Platform

A compassionate AI-powered platform to help people navigate the difficult journey after losing a loved one.

## Features

- **AI Bereavement Guide** - 24/7 AI assistant for questions about UK bereavement process
- **Local Services Marketplace** - Find verified funeral directors, florists, stonemasons and more
- **Digital Memorials** - Create beautiful online tributes (coming soon)
- **Document Vault** - Securely store important documents (coming soon)
- **Task Checklist** - Never miss an important deadline (coming soon)

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- Netlify Functions (serverless)
- OpenAI GPT-4o-mini

## Deployment to Netlify

### Step 1: Create a new GitHub repo

1. Go to github.com and create a new repository called `afterlife`
2. Upload all these files to the repo

### Step 2: Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) and sign up with GitHub
2. Click **Add new site** → **Import an existing project**
3. Select your `afterlife` repo
4. Netlify will auto-detect settings from `netlify.toml`
5. Add environment variable:
   - `OPENAI_API_KEY` = your OpenAI API key
6. Click **Deploy**

### Step 3: Connect your domain

1. Go to Site settings → Domain management
2. Click **Add custom domain**
3. Enter `afterlife.ltd`
4. Follow instructions to update your GoDaddy DNS

## Local Development

```bash
npm install
npm run dev
```

For functions to work locally, install Netlify CLI:
```bash
npm install -g netlify-cli
netlify dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| OPENAI_API_KEY | Your OpenAI API key for the chat function |

## License

Proprietary - Afterlife Technologies Ltd
