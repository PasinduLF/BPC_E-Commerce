export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};

export default async function middleware(request) {
  // Get the user agent to check if the request is from a bot
  const userAgent = request.headers.get('user-agent') || '';
  
  // List of common search engine and social media bots
  const isBot = /googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|whatsapp/i.test(userAgent);

  const url = new URL(request.url);

  // If it's a static file extension, an API route, or NOT a bot, let Vercel handle it normally
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.match(/\.(js|css|ico|png|jpg|svg|json|txt|xml)$/) ||
    !isBot
  ) {
    return; // Pass through to the normal React app
  }

  // Rewrite the request to Prerender.io for bots
  const prerenderUrl = `https://service.prerender.io/${request.url}`;
  
  return fetch(prerenderUrl, {
    headers: {
      'X-Prerender-Token': 'LH9WItOlJmwE3JNDcpsl', // Your Prerender.io token
    },
  });
}
