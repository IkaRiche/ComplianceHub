import { Router } from 'itty-router';
import { validateUbl, flattenUbl } from '@compliance-hub/core-ubl';
import { ValidationError, ParseError } from '@compliance-hub/shared';
import { Env, ApiResponse, ValidateResponse } from './types.js';
import { validateApiKey, tierHasAccess } from './apiKeys.js';
import { generateComplianceReportPDF, calculateFileHash } from './pdfReport.js';

// Create router
const router = Router();

// Production URLs
const UPGRADE_URL = 'https://vida.bauklar.com/pricing';
const PAYMENT_URL = 'https://vida.bauklar.com/purchase/report';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Helper functions
function createResponse<T>(data: T, status = 200, env?: Env, quota?: any): Response {
  const response: ApiResponse<T> = {
    success: status < 400,
    data: status < 400 ? data : undefined,
    error: status >= 400 ? (typeof data === 'string' ? data : 'An error occurred') : undefined,
    meta: {
      version: env?.API_VERSION || '2026-01-12',
      timestamp: new Date().toISOString(),
      quota: quota ? {
        remaining: quota.remaining,
        resetAt: quota.resetAt,
      } : undefined,
    },
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// 402 Payment Required - MANDATORY FORMAT
function create402Response(message: string = 'Monthly quota exceeded'): Response {
  return new Response(JSON.stringify({
    error: 'quota_exceeded',
    message,
    upgrade_url: UPGRADE_URL,
  }), {
    status: 402,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// 403 Forbidden - Upgrade Required
function create403Response(feature: string): Response {
  return new Response(JSON.stringify({
    error: 'upgrade_required',
    message: `${feature} requires a paid plan`,
    upgrade_url: UPGRADE_URL,
  }), {
    status: 403,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

function createFileResponse(content: ArrayBuffer | string, filename: string, contentType: string): Response {
  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      ...corsHeaders,
    },
  });
}

async function parseMultipartFile(request: Request): Promise<{ file: File; formData: FormData }> {
  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('multipart/form-data')) {
    throw new Error('Expected multipart/form-data');
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file || !file.size) {
    throw new Error('No file provided');
  }

  return { file, formData };
}

// Routes

// Health check
router.get('/health', (request: Request, env: Env) => {
  return createResponse({
    status: 'healthy',
    version: env.API_VERSION,
    timestamp: new Date().toISOString()
  });
});

// Get quota information
router.get('/api/quota', async (request: Request, env: Env) => {
  try {
    const auth = await validateApiKey(request, env, false); // Don't consume quota

    return createResponse({
      tier: auth.tier || 'free',
      remaining: auth.remaining ?? 0,
      valid: auth.valid,
    });
  } catch (error) {
    console.error('Quota check error:', error);
    return createResponse('Failed to check quota', 500, env);
  }
});

// POST /api/validate - FREE or PAID
router.post('/api/validate', async (request: Request, env: Env) => {
  console.time('validate-total');

  try {
    // Validate API key and check quota
    const auth = await validateApiKey(request, env, true);

    if (!auth.valid) {
      if (auth.error === 'quota_exceeded') {
        return create402Response();
      }
      return createResponse(auth.error || 'Unauthorized', 401, env);
    }

    // Parse form data
    const { file, formData } = await parseMultipartFile(request);

    // Check file size
    const maxSize = parseInt(env.MAX_FILE_SIZE || '5242880'); // 5MB
    if (file.size > maxSize) {
      return createResponse(`File too large. Maximum size: ${maxSize} bytes`, 400, env);
    }

    // Get options
    const vida = formData.get('vida') === 'true';

    // Read and validate XML
    console.time('validate-xml');
    const xmlContent = await file.text();
    const result = await validateUbl(xmlContent, vida);
    console.timeEnd('validate-xml');

    console.timeEnd('validate-total');

    // Calculate status
    const score = result.vida?.score || 0;
    const status: ValidateResponse['status'] =
      result.valid && score >= 80 ? 'ready' :
        result.valid || score >= 50 ? 'needs_fixes' : 'not_compliant';

    // Return new response format
    const response: ValidateResponse = {
      vidaScore: score,
      status,
      errors: (result.errors || []).map(e => ({
        id: e.id || e.ruleId || 'UNKNOWN',
        severity: e.severity || 'ERROR',
        path: e.path || '/',
        message: e.message || 'Validation error',
        hint: e.hint,
      })),
      warnings: (result.warnings || []).map(w => ({
        id: w.id || w.ruleId || 'UNKNOWN',
        severity: w.severity || 'WARNING',
        path: w.path || '/',
        message: w.message || 'Warning',
        hint: w.hint,
      })),
    };

    return createResponse(response, 200, env, { remaining: auth.remaining });

  } catch (error) {
    console.timeEnd('validate-total');
    console.error('Validation error:', error);

    if (error instanceof ParseError) {
      return createResponse(error.message, 400, env);
    }

    if (error instanceof ValidationError) {
      return createResponse(error.message, 422, env);
    }

    return createResponse('Validation failed', 500, env);
  }
});

// POST /api/flatten - PAID ONLY
router.post('/api/flatten', async (request: Request, env: Env) => {
  console.time('flatten-total');

  try {
    // Validate API key
    const auth = await validateApiKey(request, env, true);

    if (!auth.valid) {
      if (auth.error === 'quota_exceeded') {
        return create402Response();
      }
      return createResponse(auth.error || 'Unauthorized', 401, env);
    }

    // Check paid tier access
    if (!tierHasAccess(auth.tier, 'flatten')) {
      return create403Response('CSV/JSON flattening');
    }

    // Parse form data
    const { file, formData } = await parseMultipartFile(request);

    // Check file size
    const maxSize = parseInt(env.MAX_FILE_SIZE || '5242880');
    if (file.size > maxSize) {
      return createResponse(`File too large. Maximum size: ${maxSize} bytes`, 400, env);
    }

    // Get options
    const denormalized = formData.get('denormalized') === 'true';
    const taxColumns = formData.get('taxColumns') === 'true';
    const format = (formData.get('format') as 'csv' | 'json') || 'csv';
    const returnJson = new URL(request.url).searchParams.get('json') === 'true';

    // Read and flatten XML
    console.time('flatten-xml');
    const xmlContent = await file.text();
    const result = await flattenUbl(xmlContent, {
      denormalized,
      taxColumns,
      format: returnJson ? 'json' : format,
    });
    console.timeEnd('flatten-xml');

    console.timeEnd('flatten-total');

    // Return appropriate format
    if (returnJson || format === 'json') {
      return createResponse(result, 200, env, { remaining: auth.remaining });
    } else {
      // Return CSV as file download
      const filename = `invoice_${Date.now()}.csv`;
      return createFileResponse(result.csv || '', filename, 'text/csv');
    }

  } catch (error) {
    console.timeEnd('flatten-total');
    console.error('Flattening error:', error);

    if (error instanceof ParseError) {
      return createResponse(error.message, 400, env);
    }

    return createResponse('Flattening failed', 500, env);
  }
});

// POST /api/report - Official Compliance Report (€99) - PAID ONLY
router.post('/api/report', async (request: Request, env: Env) => {
  console.time('report-total');

  try {
    // Validate API key
    const auth = await validateApiKey(request, env, true);

    if (!auth.valid) {
      if (auth.error === 'quota_exceeded') {
        return create402Response();
      }
      return createResponse(auth.error || 'Unauthorized', 401, env);
    }

    // Check paid tier access
    if (!tierHasAccess(auth.tier, 'report')) {
      return new Response(JSON.stringify({
        error: 'payment_required',
        message: 'Official Compliance Audit requires payment (€99)',
        payment_url: PAYMENT_URL,
      }), {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Parse form data
    const { file } = await parseMultipartFile(request);

    // Check file size
    const maxSize = parseInt(env.MAX_FILE_SIZE || '5242880');
    if (file.size > maxSize) {
      return createResponse(`File too large. Maximum size: ${maxSize} bytes`, 400, env);
    }

    // Read XML
    const xmlContent = await file.text();

    // Calculate file hash
    const fileHash = await calculateFileHash(xmlContent);

    // Validate with ViDA mode
    const result = await validateUbl(xmlContent, true);

    // Generate PDF
    console.time('generate-pdf');
    const pdfBuffer = generateComplianceReportPDF({
      validationResult: result,
      fileHash,
      timestamp: new Date().toISOString(),
    });
    console.timeEnd('generate-pdf');

    console.timeEnd('report-total');

    // Return PDF
    const filename = `ViDA-Compliance-Report-${Date.now()}.pdf`;
    return createFileResponse(pdfBuffer, filename, 'application/pdf');

  } catch (error) {
    console.timeEnd('report-total');
    console.error('Report generation error:', error);

    if (error instanceof ParseError) {
      return createResponse(error.message, 400, env);
    }

    return createResponse('Report generation failed', 500, env);
  }
});

// Combined validate + flatten (for backward compatibility, PAID ONLY for flatten)
router.post('/api/process', async (request: Request, env: Env) => {
  try {
    // Validate API key
    const auth = await validateApiKey(request, env, true);

    if (!auth.valid) {
      if (auth.error === 'quota_exceeded') {
        return create402Response();
      }
      return createResponse(auth.error || 'Unauthorized', 401, env);
    }

    // Check paid tier access for flatten
    if (!tierHasAccess(auth.tier, 'flatten')) {
      return create403Response('Combined validate + flatten');
    }

    // Parse form data
    const { file, formData } = await parseMultipartFile(request);

    const maxSize = parseInt(env.MAX_FILE_SIZE || '5242880');
    if (file.size > maxSize) {
      return createResponse(`File too large. Maximum size: ${maxSize} bytes`, 400, env);
    }

    const xmlContent = await file.text();

    // Get options
    const vida = formData.get('vida') === 'true';
    const denormalized = formData.get('denormalized') === 'true';
    const taxColumns = formData.get('taxColumns') === 'true';

    // Validate and flatten
    const [validation, flattened] = await Promise.all([
      validateUbl(xmlContent, vida),
      flattenUbl(xmlContent, { denormalized, taxColumns, format: 'json' })
    ]);

    return createResponse({
      validation,
      flattened,
    }, 200, env, { remaining: auth.remaining });

  } catch (error) {
    console.error('Processing error:', error);
    return createResponse('Processing failed', 500, env);
  }
});

// OPTIONS handler for CORS
router.options('*', () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
});

// 404 handler
router.all('*', () => createResponse('Not found', 404));

// Main worker handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return await router.handle(request, env, ctx);
    } catch (error) {
      console.error('Worker error:', error);
      return createResponse('Internal server error', 500, env);
    }
  },
};

// Export for local development
export { router };