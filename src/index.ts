import OpenAI from 'openai'
import { Tiktoken, getEncoding } from 'js-tiktoken'
import { FunctionDef, formatFunctionDefinitions } from './functions'

import {
  ChatCompletionCreateParams,
  ChatCompletionTool,
} from 'openai/resources/chat/completions'

type Message = OpenAI.Chat.ChatCompletionMessageParam
type AssistantMessage = OpenAI.Chat.ChatCompletionAssistantMessageParam
type Function = ChatCompletionCreateParams.Function
type ToolMessage = OpenAI.Chat.ChatCompletionToolMessageParam

type Tool = ChatCompletionTool

let encoder: Tiktoken | undefined

/**
 * Estimate the number of tokens a prompt will use.
 * @param {Object} prompt OpenAI prompt data
 * @param {Message[]} prompt.messages OpenAI chat messages
 * @param {Function[]} prompt.functions OpenAI function definitions
 * @param {Tool[]} prompt.tools OpenAI tools
 * @returns An estimate for the number of tokens the prompt will use
 */
export function promptTokensEstimate({
  messages,
  functions,
  tools,
}: {
  messages: Message[]
  functions?: Function[]
  tools?: Tool[]
}): number {
  const mappedFunctions = tools ? tools.map((t) => t.function) : functions

  // It appears that if functions are present, the first system message is padded with a trailing newline. This
  // was inferred by trying lots of combinations of messages and functions and seeing what the token counts were.
  let paddedSystem = false
  let tokens = messages
    .map((m) => {
      if (m.role === 'system' && mappedFunctions && !paddedSystem) {
        m = { ...m, content: m.content + '\n' }
        paddedSystem = true
      }
      return messageTokensEstimate(m as AssistantMessage)
    })
    .reduce((a, b) => a + b, 0)

  // Each completion (vs message) seems to carry a 3-token overhead
  tokens += 3

  // If there are functions, add the function definitions as they count towards token usage
  if (mappedFunctions) {
    tokens += functionsTokensEstimate(mappedFunctions as any as FunctionDef[])
  }

  // If there's a system message _and_ functions are present, subtract four tokens. I assume this is because
  // functions typically add a system message, but reuse the first one if it's already there. This offsets
  // the extra 9 tokens added by the function definitions.
  if (mappedFunctions && messages.find((m) => m.role === 'system')) {
    tokens -= 4
  }

  return tokens
}

/**
 * Count the number of tokens in a string.
 * @param s The string to count tokens in
 * @returns The number of tokens in the string
 */
export function stringTokens(s: string): number {
  if (!encoder) {
    encoder = getEncoding('cl100k_base')
  }
  return encoder.encode(s).length
}

/**
 * Estimate the number of tokens a message will use. Note that using the message within a prompt will add extra
 * tokens, so you might want to use `promptTokensEstimate` instead.
 * @param message An OpenAI chat message
 * @returns An estimate for the number of tokens the message will use
 */
export function messageTokensEstimate(message: AssistantMessage): number {
  // Tool uses references:
  // 1. https://community.openai.com/t/strange-token-cost-calculation-for-tool-calls/538914/11
  // 2. https://community.openai.com/t/a-non-deterministic-bug-but-still-needs-noting/562130
  const toolCalls = message.tool_calls
  let toolUses = ''
  if (toolCalls && toolCalls.length > 1) {
    toolUses = JSON.stringify({
      tool_uses: toolCalls.map((tc) => {
        return {
          recipient_name: `${tc.function.name}`,
          parameters: `${tc.function.arguments}`,
        }
      }),
    })
  } else if (toolCalls && toolCalls.length === 1) {
    toolUses = [
      toolCalls[0].function.name,
      toolCalls[0].function.arguments,
    ].join('')
  }

  const components = [
    message.role,
    message.content,
    message.name,
    message.function_call?.name,
    message.function_call?.arguments,
    toolUses,
  ].filter((v): v is string => !!v)
  let tokens = components.map(stringTokens).reduce((a, b) => a + b, 0)
  tokens += 3 // Add three per message
  if (message.name) {
    tokens -= 1 // Subtract one if there's a function name
  }
  if (message.function_call) {
    tokens += 3
  }
  if (message.tool_calls && message.tool_calls.length > 1) {
    tokens += 12 + message.tool_calls.length
  }
  if (message.tool_calls && message.tool_calls.length === 1) {
    tokens += stringTokens(message.tool_calls[0].function.name) + 2
  }

  return tokens
}

/**
 * Estimate the number of tokens a function definition will use. Note that using the function definition within
 * a prompt will add extra tokens, so you might want to use `promptTokensEstimate` instead.
 * @param funcs An array of OpenAI function definitions
 * @returns An estimate for the number of tokens the function definitions will use
 */
export function functionsTokensEstimate(funcs: FunctionDef[]) {
  const promptDefinitions = formatFunctionDefinitions(funcs)
  let tokens = stringTokens(promptDefinitions)
  tokens += 9 // Add nine per completion
  return tokens
}
