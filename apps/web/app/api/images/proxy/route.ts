import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint to fetch images from S3 (or any external source)
 * This bypasses CORS restrictions by fetching server-side
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    // Validate that the URL is from an allowed domain (security)
    const allowedDomains = [
      'justmy-dev-uploads.s3.us-east-2.amazonaws.com',
      'justmy-prod-uploads.s3.us-east-2.amazonaws.com',
      's3.amazonaws.com',
      's3.us-east-2.amazonaws.com',
      // Add other S3 buckets or allowed domains here
    ];

    try {
      const url = new URL(imageUrl);
      
      // Check if it's an S3 URL or matches allowed domains
      const isS3Url = url.hostname.includes('.s3.') || url.hostname.includes('s3.amazonaws.com');
      const isAllowed = allowedDomains.some(domain => 
        url.hostname.includes(domain)
      );

      if (!isAllowed && !isS3Url) {
        console.warn('Blocked image proxy request for domain:', url.hostname);
        return NextResponse.json(
          { error: 'Domain not allowed. Only S3 buckets are permitted.' },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error('Invalid URL in proxy request:', imageUrl, error);
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }

    // Fetch the image from S3
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'JustMy-Image-Proxy/1.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
