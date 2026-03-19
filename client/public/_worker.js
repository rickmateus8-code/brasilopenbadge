export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Serve static assets from the Pages deployment
    // This allows the SPA routing to work correctly
    if (url.pathname.startsWith('/api/')) {
      // If you had a backend worker, it would go here
      return new Response("API not implemented in this worker", { status: 404 });
    }

    // Default behavior: serve the static assets
    // The Cloudflare Pages runtime handles this automatically, 
    // but having this file can help force a re-evaluation of the SSL certificate
    return env.ASSETS.fetch(request);
  },
};
