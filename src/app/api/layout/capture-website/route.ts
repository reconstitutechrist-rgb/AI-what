/**
 * Website Capture API Route
 *
 * Captures screenshots of competitor websites and extracts design information
 * using Puppeteer for headless browser rendering.
 */

import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { Browser, Page } from 'puppeteer';

// ============================================================================
// TYPES
// ============================================================================

interface CaptureRequest {
  url: string;
  viewport?: {
    width: number;
    height: number;
  };
  fullPage?: boolean;
  extractStyles?: boolean;
}

interface CaptureResponse {
  success: boolean;
  screenshotBase64?: string;
  extractedStyles?: Array<{ property: string; value: string }>;
  computedStyles?: {
    borderRadius?: string;
    boxShadow?: string;
  };
  error?: string;
}

// ============================================================================
// RATE LIMITING (simple in-memory)
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// ============================================================================
// URL VALIDATION
// ============================================================================

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitizeUrl(urlString: string): string {
  // Ensure https
  if (urlString.startsWith('http://')) {
    urlString = urlString.replace('http://', 'https://');
  }
  if (!urlString.startsWith('https://')) {
    urlString = 'https://' + urlString;
  }
  return urlString;
}

// ============================================================================
// BROWSER MANAGEMENT
// ============================================================================

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });
  }
  return browserInstance;
}

// Cleanup browser on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    if (browserInstance) {
      browserInstance.close().catch(() => {});
    }
  });
}

// ============================================================================
// STYLE EXTRACTION
// ============================================================================

async function extractPageStyles(
  page: Page
): Promise<{
  styles: Array<{ property: string; value: string }>;
  computedStyles: Record<string, string>;
}> {
  return page.evaluate(() => {
    const styles: Array<{ property: string; value: string }> = [];
    const elements = document.querySelectorAll('*');
    const sampled = Array.from(elements).slice(0, 100); // Limit to first 100 elements

    const propsToExtract = [
      'color',
      'background-color',
      'font-family',
      'font-size',
      'font-weight',
      'border-radius',
      'box-shadow',
    ];

    for (const element of sampled) {
      const computed = window.getComputedStyle(element);
      for (const prop of propsToExtract) {
        const value = computed.getPropertyValue(prop);
        if (value && value !== 'none' && value !== 'normal' && value !== 'rgba(0, 0, 0, 0)') {
          styles.push({ property: prop, value });
        }
      }
    }

    // Get computed styles from body
    const body = document.body;
    const bodyStyles = window.getComputedStyle(body);

    return {
      styles,
      computedStyles: {
        borderRadius: bodyStyles.getPropertyValue('border-radius'),
        boxShadow: bodyStyles.getPropertyValue('box-shadow'),
      },
    };
  });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<CaptureResponse>> {
  try {
    // Rate limiting
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Maximum 5 captures per hour.',
        },
        { status: 429 }
      );
    }

    // Parse request
    const body = (await request.json()) as CaptureRequest;
    const {
      viewport = { width: 1440, height: 900 },
      fullPage = false,
      extractStyles = true,
    } = body;

    // Validate URL
    let { url } = body;
    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: 'URL is required',
        },
        { status: 400 }
      );
    }

    url = sanitizeUrl(url);
    if (!isValidUrl(url)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid URL format',
        },
        { status: 400 }
      );
    }

    // Launch browser and capture
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      // Set viewport
      await page.setViewport(viewport);

      // Set user agent to appear as a normal browser
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Navigate with timeout
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait a bit for any animations to settle
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Capture screenshot
      const screenshotBuffer = await page.screenshot({
        fullPage,
        type: 'png',
      });
      const screenshotBase64 = Buffer.from(screenshotBuffer).toString('base64');

      // Extract styles if requested
      let extractedStyles: Array<{ property: string; value: string }> = [];
      let computedStyles: Record<string, string> = {};

      if (extractStyles) {
        const extracted = await extractPageStyles(page);
        extractedStyles = extracted.styles;
        computedStyles = extracted.computedStyles;
      }

      return NextResponse.json({
        success: true,
        screenshotBase64,
        extractedStyles,
        computedStyles,
      });
    } finally {
      await page.close();
    }
  } catch (error) {
    console.error('Website capture error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Check for common errors
    if (errorMessage.includes('net::ERR_NAME_NOT_RESOLVED')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not resolve the website address. Please check the URL.',
        },
        { status: 400 }
      );
    }

    if (errorMessage.includes('Timeout')) {
      return NextResponse.json(
        {
          success: false,
          error: 'The website took too long to load. Please try again.',
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: `Failed to capture website: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
