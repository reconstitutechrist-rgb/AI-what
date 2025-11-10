/**
 * AI Generation Logic for Full-App Route
 * Phase 5.2: Extracted for retry support
 * 
 * Separates AI generation logic from route handler to enable intelligent retries
 */

import Anthropic from '@anthropic-ai/sdk';
import { validateGeneratedCode, autoFixCode, type ValidationError } from '@/utils/codeValidator';
import type { ErrorCategory } from '@/utils/analytics';

export interface GenerationContext {
  anthropic: Anthropic;
  systemPrompt: string;
  messages: any[];
  modelName: string;
  correctionPrompt?: string;  // Added for retry with specific fixes
}

export interface GenerationResult {
  name: string;
  description: string;
  appType: string;
  changeType: string;
  changeSummary: string;
  files: Array<{ path: string; content: string; description: string }>;
  dependencies: Record<string, string>;
  setupInstructions: string;
  responseText: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  validationErrors: Array<{ file: string; errors: ValidationError[] }>;
  totalErrors: number;
  autoFixedCount: number;
}

export interface GenerationError extends Error {
  category: ErrorCategory;
  originalResponse?: string;
  validationDetails?: any;
}

/**
 * Generate full application from AI with validation
 */
export async function generateFullApp(
  context: GenerationContext,
  attemptNumber: number = 1
): Promise<GenerationResult> {
  const { anthropic, systemPrompt, messages, modelName, correctionPrompt } = context;
  
  // Add correction prompt if this is a retry
  const enhancedMessages = correctionPrompt && attemptNumber > 1
    ? [...messages, { role: 'user', content: correctionPrompt }]
    : messages;
  
  console.log(attemptNumber > 1 
    ? `🔄 Retry attempt ${attemptNumber} with correction prompt`
    : 'Generating full app with Claude Sonnet 4.5...'
  );
  
  // Use streaming API
  const stream = await anthropic.messages.stream({
    model: modelName,
    max_tokens: 16384,
    temperature: 0.7,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' }
      }
    ],
    messages: enhancedMessages
  });
  
  // Collect response
  let responseText = '';
  let inputTokens = 0;
  let outputTokens = 0;
  let cachedTokens = 0;
  
  try {
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        responseText += chunk.delta.text;
      }
      // Capture token usage from final message
      if (chunk.type === 'message_stop') {
        const finalMessage = await stream.finalMessage();
        inputTokens = finalMessage.usage.input_tokens || 0;
        outputTokens = finalMessage.usage.output_tokens || 0;
        // @ts-ignore - cache_read_input_tokens might not be in types yet
        cachedTokens = finalMessage.usage.cache_read_input_tokens || 0;
      }
    }
  } catch (streamError) {
    console.error('Streaming error:', streamError);
    const error = new Error(streamError instanceof Error ? streamError.message : 'Failed to receive AI response') as GenerationError;
    error.category = 'ai_error';
    throw error;
  }
  
  console.log('Generated response length:', responseText.length, 'chars');
  console.log('Estimated output tokens:', outputTokens);
  
  if (outputTokens > 15000) {
    console.warn('⚠️ Response approaching 16K token limit - may be truncated!');
  }
  
  if (!responseText) {
    const error = new Error('No response from Claude') as GenerationError;
    error.category = 'ai_error';
    throw error;
  }

  // ============================================================================
  // PARSE DELIMITER-BASED RESPONSE
  // ============================================================================
  
  const nameMatch = responseText.match(/===NAME===\s*([\s\S]*?)\s*===/);
  const descriptionMatch = responseText.match(/===DESCRIPTION===\s*([\s\S]*?)\s*===/);
  const appTypeMatch = responseText.match(/===APP_TYPE===\s*([\s\S]*?)\s*===/);
  const changeTypeMatch = responseText.match(/===CHANGE_TYPE===\s*([\s\S]*?)\s*===/);
  const changeSummaryMatch = responseText.match(/===CHANGE_SUMMARY===\s*([\s\S]*?)\s*===/);
  const dependenciesMatch = responseText.match(/===DEPENDENCIES===\s*([\s\S]*?)\s*===/);
  const setupMatch = responseText.match(/===SETUP===\s*([\s\S]*?)===END===/);
  
  if (!nameMatch || !descriptionMatch) {
    console.error('Failed to parse response');
    const error = new Error('Invalid response format from Claude - missing required delimiters') as GenerationError;
    error.category = 'parsing_error';
    error.originalResponse = responseText;
    throw error;
  }
  
  const name = nameMatch[1].trim().split('\n')[0].trim();
  const descriptionText = descriptionMatch[1].trim().split('\n')[0].trim();
  const appType = appTypeMatch ? appTypeMatch[1].trim().split('\n')[0].trim() : 'FRONTEND_ONLY';

  // Extract files
  const fileMatches = responseText.matchAll(/===FILE:([\s\S]*?)===\s*([\s\S]*?)(?====FILE:|===DEPENDENCIES===|===SETUP===|===END===|$)/g);
  const files: Array<{ path: string; content: string; description: string }> = [];
  
  for (const match of fileMatches) {
    const path = match[1].trim();
    const content = match[2].trim();
    files.push({
      path,
      content,
      description: `${path.split('/').pop()} file`
    });
  }
  
  console.log('Parsed files:', files.length);
  
  if (files.length === 0) {
    const error = new Error('No files generated in response') as GenerationError;
    error.category = 'parsing_error';
    error.originalResponse = responseText;
    throw error;
  }

  // ============================================================================
  // VALIDATION LAYER
  // ============================================================================
  console.log('🔍 Validating generated code...');
  
  const validationErrors: Array<{ file: string; errors: ValidationError[] }> = [];
  let totalErrors = 0;
  let autoFixedCount = 0;
  
  files.forEach(file => {
    if (file.path.endsWith('.tsx') || file.path.endsWith('.ts') || 
        file.path.endsWith('.jsx') || file.path.endsWith('.js')) {
      
      const validation = validateGeneratedCode(file.content, file.path);
      
      if (!validation.valid) {
        console.log(`⚠️ Found ${validation.errors.length} error(s) in ${file.path}`);
        totalErrors += validation.errors.length;
        
        const fixedCode = autoFixCode(file.content, validation.errors);
        if (fixedCode !== file.content) {
          console.log(`✅ Auto-fixed errors in ${file.path}`);
          file.content = fixedCode;
          autoFixedCount += validation.errors.filter(e => e.type === 'UNCLOSED_STRING').length;
          
          const revalidation = validateGeneratedCode(fixedCode, file.path);
          if (!revalidation.valid) {
            validationErrors.push({
              file: file.path,
              errors: revalidation.errors
            });
          }
        } else {
          validationErrors.push({
            file: file.path,
            errors: validation.errors
          });
        }
      }
    }
  });
  
  if (totalErrors > 0) {
    console.log(`📊 Validation Summary:`);
    console.log(`   Total errors found: ${totalErrors}`);
    console.log(`   Auto-fixed: ${autoFixedCount}`);
    console.log(`   Remaining: ${totalErrors - autoFixedCount}`);
  } else {
    console.log(`✅ All code validated successfully`);
  }
  
  // If validation failed on first attempt with unfixed errors, throw for retry
  if (validationErrors.length > 0 && attemptNumber === 1) {
    const error = new Error(`Validation failed: ${validationErrors.length} files with issues`) as GenerationError;
    error.category = 'validation_error';
    error.validationDetails = validationErrors;
    error.originalResponse = responseText;
    throw error;
  }
  
  // Parse dependencies
  const dependencies: Record<string, string> = {};
  if (dependenciesMatch) {
    const depsText = dependenciesMatch[1].trim();
    const depsLines = depsText.split('\n');
    for (const line of depsLines) {
      const [pkg, version] = line.split(':').map(s => s.trim());
      if (pkg && version) {
        dependencies[pkg] = version;
      }
    }
  }

  const changeType = changeTypeMatch ? changeTypeMatch[1].trim().split('\n')[0].trim() : 'NEW_APP';
  const changeSummary = changeSummaryMatch ? changeSummaryMatch[1].trim() : '';
  const setupInstructions = setupMatch ? setupMatch[1].trim() : 'Run npm install && npm run dev';
  
  return {
    name,
    description: descriptionText,
    appType,
    changeType,
    changeSummary,
    files,
    dependencies,
    setupInstructions,
    responseText,
    inputTokens,
    outputTokens,
    cachedTokens,
    validationErrors,
    totalErrors,
    autoFixedCount,
  };
}
