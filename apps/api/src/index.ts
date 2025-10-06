import { Router } from 'itty-router';
import { validateUbl, flattenUbl } from '@compliance-hub/core-ubl';
import { ValidationError, ParseError } from '@compliance-hub/shared';
import { Env, ApiResponse, ValidateRequestBody, FlattenRequestBody } from './types.js';
import { getUserId, checkQuota, getQuotaInfo } from './quota.js';

// Create router
const router = Router();

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
      version: env?.API_VERSION || '2025-10-06',
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

function createFileResponse(content: string, filename: string, contentType: string): Response {
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
    const userId = getUserId(request);
    const quotaInfo = await getQuotaInfo(userId, env);
    
    return createResponse({
      used: quotaInfo.used,
      remaining: quotaInfo.remaining,
      resetAt: quotaInfo.resetAt,
    });
  } catch (error) {
    console.error('Quota check error:', error);
    return createResponse('Failed to check quota', 500, env);
  }
});

// Validate UBL XML
router.post('/api/validate', async (request: Request, env: Env) => {
  console.time('validate-total');
  
  try {
    // Check quota
    const userId = getUserId(request);
    const quotaCheck = await checkQuota(userId, env);
    
    if (!quotaCheck.allowed) {
      return createResponse('Quota exceeded', 429, env, quotaCheck);
    }

    // Parse form data
    const { file, formData } = await parseMultipartFile(request);
    
    // Check file size
    const maxSize = parseInt(env.MAX_FILE_SIZE || '5242880'); // 5MB
    if (file.size > maxSize) {
      return createResponse(`File too large. Maximum size: ${maxSize} bytes`, 400, env, quotaCheck);
    }

    // Get options
    const vida = formData.get('vida') === 'true';
    
    // Read and validate XML
    console.time('validate-xml');
    const xmlContent = await file.text();
    const result = await validateUbl(xmlContent, vida);
    console.timeEnd('validate-xml');
    
    console.timeEnd('validate-total');
    
    return createResponse(result, 200, env, quotaCheck);
    
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

// Flatten UBL to CSV/JSON
router.post('/api/flatten', async (request: Request, env: Env) => {
  console.time('flatten-total');
  
  try {
    // Check quota
    const userId = getUserId(request);
    const quotaCheck = await checkQuota(userId, env);
    
    if (!quotaCheck.allowed) {
      return createResponse('Quota exceeded', 429, env, quotaCheck);
    }

    // Parse form data
    const { file, formData } = await parseMultipartFile(request);
    
    // Check file size
    const maxSize = parseInt(env.MAX_FILE_SIZE || '5242880');
    if (file.size > maxSize) {
      return createResponse(`File too large. Maximum size: ${maxSize} bytes`, 400, env, quotaCheck);
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
      return createResponse(result, 200, env, quotaCheck);
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

// Combined validate + flatten
router.post('/api/process', async (request: Request, env: Env) => {
  try {
    // Check quota (counts as 2 operations)
    const userId = getUserId(request);
    const quotaCheck1 = await checkQuota(userId, env);
    if (!quotaCheck1.allowed) {
      return createResponse('Quota exceeded', 429, env, quotaCheck1);
    }
    
    const quotaCheck2 = await checkQuota(userId, env);
    if (!quotaCheck2.allowed) {
      return createResponse('Quota exceeded', 429, env, quotaCheck2);
    }

    // Parse form data
    const { file, formData } = await parseMultipartFile(request);
    
    const maxSize = parseInt(env.MAX_FILE_SIZE || '5242880');
    if (file.size > maxSize) {
      return createResponse(`File too large. Maximum size: ${maxSize} bytes`, 400, env, quotaCheck2);
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
    }, 200, env, quotaCheck2);
    
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