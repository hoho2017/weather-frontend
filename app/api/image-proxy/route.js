// app/api/image-proxy/route.js
import https from 'https';
import http from 'http';

export async function GET(request) {
  // 从查询参数中获取图片路径
  const { searchParams } = new URL(request.url);
  const imagePath = searchParams.get('path');
  
  if (!imagePath) {
    return new Response(JSON.stringify({ error: 'Missing image path parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const targetUrl = `http://47.96.139.248:8000${imagePath}`;

  // 这里根据目标接口是 http 还是 https 选择对应模块
  const client = targetUrl.startsWith('https') ? https : http;

  return new Promise((resolve, reject) => {
    client.get(targetUrl, (response) => {
      // 设置响应头，支持图片
      const headers = {
        'Content-Type': response.headers['content-type'] || 'image/png',
        'Cache-Control': 'public, max-age=3600',
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
      resolve(new Response(JSON.stringify({ error: 'Image proxy error', details: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }));
    });
  });
} 