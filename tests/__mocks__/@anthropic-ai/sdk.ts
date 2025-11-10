/**
 * Mock Anthropic SDK for Testing
 * Provides test doubles for Anthropic API without making real API calls
 */

export class MockMessageStream {
  private responses: any[];
  private currentIndex = 0;

  constructor(responses: any[]) {
    this.responses = responses;
  }

  async *[Symbol.asyncIterator]() {
    for (const response of this.responses) {
      yield response;
    }
  }

  async finalMessage() {
    return {
      usage: {
        input_tokens: 1000,
        output_tokens: 500,
        cache_read_input_tokens: 0,
      },
    };
  }
}

export class MockMessages {
  private mockResponse: string | null = null;
  private shouldError = false;
  private errorMessage = '';

  setMockResponse(response: string) {
    this.mockResponse = response;
    this.shouldError = false;
  }

  setMockError(message: string) {
    this.shouldError = true;
    this.errorMessage = message;
  }

  stream(params: any) {
    if (this.shouldError) {
      throw new Error(this.errorMessage);
    }

    const responseText = this.mockResponse || '{}';
    
    // Simulate streaming chunks
    const chunks = [
      {
        type: 'content_block_delta',
        delta: { type: 'text_delta', text: responseText },
      },
      {
        type: 'message_stop',
      },
    ];

    return new MockMessageStream(chunks);
  }
}

export default class Anthropic {
  messages: MockMessages;

  constructor(config: any) {
    this.messages = new MockMessages();
  }
}

// Export singleton for test control
export const mockAnthropicInstance = new Anthropic({ apiKey: 'test' });
