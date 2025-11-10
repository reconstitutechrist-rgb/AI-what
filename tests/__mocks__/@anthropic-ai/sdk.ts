/**
 * Mock Anthropic SDK for Testing
 * Provides test doubles for Anthropic API without making real API calls
 */

// Shared mock state that tests can control
let mockResponseText = '{}';
let mockShouldError = false;
let mockErrorMessage = '';

/**
 * Mock Message Stream - simulates Anthropic's streaming API
 */
class MockMessageStream {
  private chunks: any[];

  constructor(responseText: string) {
    this.chunks = [
      {
        type: 'content_block_delta',
        delta: { type: 'text_delta', text: responseText },
      },
      {
        type: 'message_stop',
      },
    ];
  }

  async *[Symbol.asyncIterator]() {
    for (const chunk of this.chunks) {
      yield chunk;
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

/**
 * Mock Messages API
 */
const mockMessages = {
  stream: jest.fn((params: any) => {
    if (mockShouldError) {
      throw new Error(mockErrorMessage);
    }
    return new MockMessageStream(mockResponseText);
  }),
};

/**
 * Mock Anthropic Class
 */
class MockAnthropic {
  messages = mockMessages;
  
  constructor(config: any) {
    // Constructor mock
  }
}

/**
 * Helper functions for tests to control mock behavior
 */
export const setMockResponse = (response: string) => {
  mockResponseText = response;
  mockShouldError = false;
};

export const setMockError = (message: string) => {
  mockShouldError = true;
  mockErrorMessage = message;
};

export const resetMock = () => {
  mockResponseText = '{}';
  mockShouldError = false;
  mockErrorMessage = '';
  mockMessages.stream.mockClear();
};

// Default export (what gets imported as Anthropic)
export default MockAnthropic;
