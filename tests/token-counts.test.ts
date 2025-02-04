import OpenAI from 'openai'
import { promptTokensEstimate } from '../src'
import { type ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions'

type Message = OpenAI.Chat.ChatCompletionMessageParam
type Functions = ChatCompletionCreateParamsBase['functions']
type Tools = ChatCompletionCreateParamsBase['tools']

type Example = {
  messages: Message[]
  functions?: Functions
  tools?: Tools
  tokens: number
  validate?: boolean
}

const TEST_CASES: Example[] = [
  {
    messages: [{ role: 'user', content: 'hello' }],
    tokens: 8,
  },
  {
    messages: [{ role: 'user', content: 'hello world' }],
    tokens: 9,
  },
  {
    messages: [{ role: 'system', content: 'hello' }],
    tokens: 8,
  },
  {
    messages: [{ role: 'system', content: 'hello:' }],
    tokens: 9,
  },
  {
    messages: [
      { role: 'system', content: "# Important: you're the best robot" },
      { role: 'user', content: 'hello robot' },
      { role: 'assistant', content: 'hello world' },
    ],
    tokens: 27,
  },
  {
    messages: [{ role: 'user', content: 'hello' }],
    functions: [
      {
        name: 'foo',
        parameters: { type: 'object', properties: {} },
      },
    ],
    tokens: 31,
  },
  {
    messages: [{ role: 'user', content: 'hello' }],
    functions: [
      {
        name: 'foo',
        description: 'Do a foo',
        parameters: { type: 'object', properties: {} },
      },
    ],
    tokens: 36,
  },
  {
    messages: [{ role: 'user', content: 'hello' }],
    functions: [
      {
        name: 'bing_bong',
        description: 'Do a bing bong',
        parameters: {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
        },
      },
    ],
    tokens: 49,
  },
  {
    messages: [{ role: 'user', content: 'hello' }],
    functions: [
      {
        name: 'bing_bong',
        description: 'Do a bing bong',
        parameters: {
          type: 'object',
          properties: {
            foo: { type: 'string' },
            bar: { type: 'number', description: 'A number' },
          },
        },
      },
    ],
    tokens: 57,
  },
  {
    messages: [{ role: 'user', content: 'hello' }],
    tools: [
      {
        type: 'function',
        function: {
          name: 'bing_bong',
          description: 'Do a bing bong',
          parameters: {
            type: 'object',
            properties: {
              foo: {
                type: 'object',
                properties: {
                  bar: { type: 'string', enum: ['a', 'b', 'c'] },
                  baz: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    ],
    tokens: 68,
  },
  {
    messages: [{ role: 'user', content: 'hello' }],
    functions: [
      {
        name: 'bing_bong',
        description: 'Do a bing bong',
        parameters: {
          type: 'object',
          properties: {
            foo: {
              type: 'object',
              properties: {
                bar: { type: 'string', enum: ['a', 'b', 'c'] },
                baz: { type: 'boolean' },
              },
            },
          },
        },
      },
    ],
    tokens: 68,
  },
  {
    messages: [
      { role: 'user', content: 'hello world' },
      { role: 'function', name: 'do_stuff', content: `{}` },
    ],
    tokens: 15,
  },
  {
    messages: [
      { role: 'user', content: 'hello world' },
      {
        role: 'function',
        name: 'do_stuff',
        content: `{"foo": "bar", "baz": 1.5}`,
      },
    ],
    tokens: 28,
  },
  {
    messages: [
      {
        role: 'function',
        name: 'dance_the_tango',
        content: `{"a": { "b" : { "c": false}}}`,
      },
    ],
    tokens: 24,
  },
  {
    messages: [
      {
        role: 'assistant',
        content: '',
        function_call: {
          name: 'do_stuff',
          arguments: `{"foo": "bar", "baz": 1.5}`,
        },
      },
    ],
    tokens: 26,
  },
  {
    validate: false,
    messages: [
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: {
              name: 'get_current_weather',
              arguments: '{"location":"Boston"}',
            },
          },
          {
            id: 'call_2',
            type: 'function',
            function: {
              name: 'get_stock_price',
              arguments: '{"symbol":"AAPL"}',
            },
          },
        ],
      },
      {
        role: 'tool',
        content: 'It is currently 70 degrees and sunny in Boston, MA',
        tool_call_id: 'call_1',
      },
      {
        role: 'tool',
        content: 'The current price of AAPL is $150',
        tool_call_id: 'call_2',
      },
    ],
    tokens: 89,
  },
  {
    messages: [
      {
        role: 'assistant',
        content: '',
        function_call: {
          name: 'do_stuff',
          arguments: `{"foo":"bar", "baz":\n\n 1.5}`,
        },
      },
    ],
    tokens: 25,
  },
  {
    messages: [
      { role: 'system', content: 'Hello' },
      { role: 'user', content: 'Hi there' },
    ],
    functions: [
      {
        name: 'do_stuff',
        parameters: { type: 'object', properties: {} },
      },
    ],
    tokens: 35,
  },
  {
    messages: [
      { role: 'system', content: 'Hello:' },
      { role: 'user', content: 'Hi there' },
    ],
    functions: [
      { name: 'do_stuff', parameters: { type: 'object', properties: {} } },
    ],
    tokens: 35,
  },
  {
    messages: [
      { role: 'system', content: 'Hello:' },
      { role: 'system', content: 'Hello' },
      { role: 'user', content: 'Hi there' },
    ],
    functions: [
      { name: 'do_stuff', parameters: { type: 'object', properties: {} } },
    ],
    tokens: 40,
  },
  {
    messages: [{ role: 'user', content: 'hello' }],
    tools: [
      {
        type: 'function',
        function: {
          name: 'get_current_weather',
          description: 'Get the current weather in a given location',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: 'The city and state, e.g. San Francisco, CA',
              },
              unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
            },
            required: ['location'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'bing_bong',
          description: 'Do a bing bong',
          parameters: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              bar: { type: 'number', description: 'A number' },
            },
          },
        },
      },
    ],
    tokens: 108,
  },
  {
    messages: [
      { role: 'system', content: 'I want you to act as useful assistant.' },
      {
        role: 'user',
        content:
          'Tell me a joke about programmers and at the same time find out what is the weather in Prague',
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'generate_theme_joke',
          description: 'Generate a joke based on a given theme',
          parameters: {
            type: 'object',
            required: ['theme'],
            properties: {
              theme: {
                type: 'string',
                description:
                  "The theme for the joke, e.g. 'animals', 'space', 'sports', etc.",
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_weather',
          description:
            'Get the current weather in a given location in Celsius degrees',
          parameters: {
            type: 'object',
            required: ['location'],
            properties: {
              unit: {
                enum: ['celsius', 'fahrenheit'],
                type: 'string',
                default: 'celsius',
              },
              location: {
                type: 'string',
                description: 'The city and state, e.g. San Francisco, CA',
              },
            },
          },
        },
      },
    ],
    tokens: 159,
    validate: true,
  },
]

const TEST_CASES_TOOL_CALLS: Example[] = [
  {
    validate: false,
    messages: [
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: {
              name: 'get_current_weather',
              arguments: '{"location":"Boston"}',
            },
          },
        ],
      },
      {
        role: 'tool',
        content: '',
        tool_call_id: 'call_1',
      },
    ],
    tokens: 24,
  },
  {
    validate: false,
    messages: [
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: {
              name: 'ggg',
              arguments: '',
            },
          },
        ],
      },
      {
        role: 'tool',
        content: '',
        tool_call_id: 'call_1',
      },
    ],
    tokens: 17,
  },
  {
    validate: false,
    messages: [
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: {
              name: 'get_current_weather',
              arguments: '{"location":"Boston"}',
            },
          },
        ],
      },
      {
        role: 'tool',
        content: 'It is currently 70 degrees and sunny in Boston, MA',
        tool_call_id: 'call_1',
      },
    ],
    tokens: 36,
  },
  {
    validate: false,
    messages: [
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: {
              name: 'get_totally_different_weather_123',
              arguments: '{"location":"Boston"}',
            },
          },
        ],
      },
      {
        role: 'tool',
        content: '',
        tool_call_id: 'call_1',
      },
    ],
    tokens: 32,
  },
  {
    validate: false,
    messages: [
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: {
              name: 'get_totally_different_weather_123',
              arguments:
                '{"location":"Boston", "date": "yesterday", "time": "noon"}',
            },
          },
        ],
      },
      {
        role: 'tool',
        content: 'It is the same as yesterday',
        tool_call_id: 'call_1',
      },
    ],
    tokens: 51,
  },
  {
    validate: false,
    messages: [
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: {
              name: 'get_address',
              arguments:
                '{"location":"Paris", "date": "yesterday", "time": "noon"}',
            },
          },
        ],
      },
      {
        role: 'tool',
        content: 'The address is 123 Main St',
        tool_call_id: 'call_1',
      },
    ],
    tokens: 42,
  },

  {
    validate: false,
    messages: [
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: {
              name: 'get_weather_for_location',
              arguments: '{"location":"Boston"}',
            },
          },
          {
            id: 'call_2',
            type: 'function',
            function: {
              name: 'get_weather_for_location',
              arguments: '{"location":"Boston"}',
            },
          },
        ],
      },
      {
        role: 'tool',
        content: 'It is currently 70 degrees and sunny in Boston, MA',
        tool_call_id: 'call_1',
      },
      {
        role: 'tool',
        content: 'It is currently 70 degrees and sunny in Boston, MA',
        tool_call_id: 'call_2',
      },
    ],
    tokens: 93,
  },
  {
    validate: false,
    messages: [
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: {
              name: 'get_breakfast',
              arguments: '{"meal":"pancakes"}',
            },
          },
          {
            id: 'call_2',
            type: 'function',
            function: {
              name: 'get_taxi',
              arguments: '{"destination":"airport"}',
            },
          },
        ],
      },
      {
        role: 'tool',
        content: 'Your pancakes are ready',
        tool_call_id: 'call_1',
      },
      {
        role: 'tool',
        content: 'Your taxi is on the way',
        tool_call_id: 'call_2',
      },
    ],
    tokens: 78,
  },
  {
    validate: false,
    messages: [
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: {
              name: 'get_current_weather',
              arguments: '{"location":"Boston"}',
            },
          },
          {
            id: 'call_2',
            type: 'function',
            function: {
              name: 'get_current_weather',
              arguments: '{"location":"Boston"}',
            },
          },
          {
            id: 'call_3',
            type: 'function',
            function: {
              name: 'get_current_weather',
              arguments: '{"location":"Boston"}',
            },
          },
        ],
      },
      {
        role: 'tool',
        content: 'It is currently 70 degrees and sunny in Boston, MA',
        tool_call_id: 'call_1',
      },
      {
        role: 'tool',
        content: 'It is currently 70 degrees and sunny in Boston, MA',
        tool_call_id: 'call_2',
      },
      {
        role: 'tool',
        content: 'It is currently 70 degrees and sunny in Boston, MA',
        tool_call_id: 'call_3',
      },
    ],
    tokens: 124,
  },
  {
    validate: false,
    messages: [
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: {
              name: 'get_current_weather',
              arguments: '{"location":"Boston"}',
            },
          },
          {
            id: 'call_2',
            type: 'function',
            function: {
              name: 'get_current_weather',
              arguments: '{"location":"Boston"}',
            },
          },
          {
            id: 'call_3',
            type: 'function',
            function: {
              name: 'get_current_weather',
              arguments: '{"location":"Boston"}',
            },
          },
          {
            id: 'call_4',
            type: 'function',
            function: {
              name: 'get_current_weather',
              arguments: '{"location":"Boston"}',
            },
          },
        ],
      },
      {
        role: 'tool',
        content: 'It is currently 70 degrees and sunny in Boston, MA',
        tool_call_id: 'call_1',
      },
      {
        role: 'tool',
        content: 'It is currently 70 degrees and sunny in Boston, MA',
        tool_call_id: 'call_2',
      },
      {
        role: 'tool',
        content: 'It is currently 70 degrees and sunny in Boston, MA',
        tool_call_id: 'call_3',
      },
      {
        role: 'tool',
        content: 'It is currently 70 degrees and sunny in Boston, MA',
        tool_call_id: 'call_4',
      },
    ],
    tokens: 157,
  },
  {
    validate: false,
    messages: [
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: {
              name: 'get_current_weather',
              arguments: '{"location":"Boston"}',
            },
          },
          {
            id: 'call_2',
            type: 'function',
            function: {
              name: 'get_current_weather',
              arguments: '{"location":"Boston"}',
            },
          },
          {
            id: 'call_3',
            type: 'function',
            function: {
              name: 'get_current_weather',
              arguments: '{"location":"Boston"}',
            },
          },
          {
            id: 'call_4',
            type: 'function',
            function: {
              name: 'get_current_weather',
              arguments: '{"location":"Boston"}',
            },
          },
          {
            id: 'call_5',
            type: 'function',
            function: {
              name: 'get_current_weather',
              arguments: '{"location":"Boston"}',
            },
          },
        ],
      },
      {
        role: 'tool',
        content: 'It is currently 70 degrees and sunny in Boston, MA',
        tool_call_id: 'call_1',
      },
      {
        role: 'tool',
        content: 'It is currently 70 degrees and sunny in Boston, MA',
        tool_call_id: 'call_2',
      },
      {
        role: 'tool',
        content: 'It is currently 70 degrees and sunny in Boston, MA',
        tool_call_id: 'call_3',
      },
      {
        role: 'tool',
        content: 'It is currently 70 degrees and sunny in Boston, MA',
        tool_call_id: 'call_4',
      },
      {
        role: 'tool',
        content: 'It is currently 70 degrees and sunny in Boston, MA',
        tool_call_id: 'call_5',
      },
    ],
    tokens: 190,
  },
]

const TEST_CASES_WITH_FUNCTIONS = TEST_CASES.filter((t) => t.functions)
// Transform the test cases to use the new `tools` field
// This is a bit of a hack, but it's easier than rewriting the tests
const TRANSFORMED_TEST_CASES = TEST_CASES_WITH_FUNCTIONS.map(
  (t) =>
    ({
      ...t,
      tools: t.functions?.map((f) => ({ type: 'function', function: f })),
      functions: undefined,
    } as Example)
)

const validateAll = false
const openAITimeout = 10000

describe.each(
  TEST_CASES.concat(TRANSFORMED_TEST_CASES).concat(TEST_CASES_TOOL_CALLS)
)('token counts (%j)', (example) => {
  const validateTest = validateAll || example.validate ? test : test.skip
  validateTest(
    'test data matches openai',
    async () => {
      const openai = new OpenAI({
        apiKey: 'REMOVED_API_KEY',
      })

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: example.messages,
        //functions: example.functions as any,
        tools: example.tools as any,
        max_tokens: 200,
      })

      console.log(
        'response.usage?.prompt_tokens',
        response.usage?.prompt_tokens
      )

      expect(response.usage?.prompt_tokens).toBe(example.tokens)
    },
    openAITimeout
  )

  test('estimate is correct', async () => {
    expect(
      promptTokensEstimate({
        messages: example.messages,
        functions: example.functions,
        tools: example.tools,
      })
    ).toBe(example.tokens)
  })
})
