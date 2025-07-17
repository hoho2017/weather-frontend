// app/api/proxy/route.js
import https from 'https';
import http from 'http';

export async function GET(request) {
  // 从查询参数中获取 lat 和 lon
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  
  if (!lat || !lon) {
    return new Response(JSON.stringify({ error: 'Missing lat or lon parameters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const targetUrl = `http://47.96.139.248:8000/images?lat=${lat}&lon=${lon}`;

  // 这里根据目标接口是 http 还是 https 选择对应模块
  const client = targetUrl.startsWith('https') ? https : http;

  return new Promise((resolve, reject) => {
    client.get(targetUrl, (response) => {
      // 设置响应头，支持 Server-Sent Events
      const headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      };

      const stream = new ReadableStream({
        start(controller) {
          response.on('data', (chunk) => {
            controller.enqueue(chunk);
          });

          response.on('end', () => {
            controller.close();
          });

          response.on('error', (err) => {
            controller.error(err);
          });
        }
      });

      resolve(new Response(stream, { headers }));
    }).on('error', (err) => {
      resolve(new Response(JSON.stringify({ error: 'Proxy error', details: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }));
    });
  });
} 