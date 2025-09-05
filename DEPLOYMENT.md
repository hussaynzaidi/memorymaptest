# Deployment Guide

This project is a Next.js application and can be deployed to various platforms.

## Option 1: Deploy to Vercel (Recommended)

1.  Push your code to GitHub
2.  Go to [vercel.com](https://vercel.com)
3.  Import your repository
4.  Vercel will automatically detect it's a Next.js project
5.  Deploy with one click

## Option 2: Deploy to Netlify

1.  Push your code to GitHub
2.  Go to [netlify.com](https://netlify.com)
3.  Connect your GitHub repository
4.  Set build command: `npm run build`
5.  Set publish directory: `.next`
6.  Deploy

## Option 3: Deploy to Railway

1.  Push your code to GitHub
2.  Go to [railway.app](https://railway.app)
3.  Create a new project from GitHub
4.  Railway will automatically detect and deploy your Next.js app

## Option 4: Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Then deploy to any Docker-compatible platform.

## Environment Variables

For production deployment, you might want to set these environment variables:

```bash
NODE_ENV=production
NEXT_PUBLIC_MAP_CENTER_LAT=31.4025255
NEXT_PUBLIC_MAP_CENTER_LNG=74.210633
```

## Custom Domain

After deployment, you can add a custom domain:

-   **Vercel**: Go to project settings > Domains
-   **Netlify**: Go to site settings > Domain management

## Performance Optimization

For better performance in production:

1.  **Enable compression** in your hosting platform
2.  **Set up CDN** for static assets
3.  **Enable caching** for map tiles
4.  **Use environment variables** for configuration

## Monitoring

Consider adding monitoring tools:

-   **Vercel Analytics** (if using Vercel)
-   **Google Analytics** for user tracking
-   **Sentry** for error tracking

## SSL/HTTPS

Most modern hosting platforms provide SSL certificates automatically. Ensure your deployment uses HTTPS for security.

## Troubleshooting

### Common Issues

1.  **Map not loading**: Check if the hosting platform allows external tile servers
2.  **Markers not saving**: Ensure localStorage is enabled in the browser
3.  **Performance issues**: Consider using a CDN for map tiles

### Support

If you encounter deployment issues:
1.  Check the hosting platform's documentation
2.  Verify all files are uploaded correctly
3.  Check browser console for errors
4.  Ensure all dependencies are installed 