
## Deployment

Since this project uses serverless functions, the recommended hosting platform is [Vercel](https://vercel.com).

### 1. Prerequisites
Ensure you have the Vercel CLI installed (which is included in `npm install` dependencies if you used it, or install globally):
```bash
npm i -g vercel
```

### 2. Set Up Environment Variables
**Crucial Step:** Your API keys in `.env` are **not** automatically uploaded to Vercel for security reasons. You must add them to your Vercel project environment.

1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Select your project (`solar-scope`).
3.  Go to **Settings** > **Environment Variables**.
4.  Add the following keys (copy values from your local `.env` file):
    *   `OPENCAGE_API_KEY`
    *   `OPENWEATHER_API_KEY`
    *   `WEATHERAPI_API_KEY`

### 3. Deploy
Run the following command in your terminal to deploy to production:
```bash
vercel --prod
```
Follow the prompts. Once complete, it will give you a live URL (e.g., `https://solar-scope-yourname.vercel.app`).
