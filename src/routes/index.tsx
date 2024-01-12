import { $, component$, useStore } from "@builder.io/qwik"
import type { RequestHandler } from "@builder.io/qwik-city"
import { PromptTemplate } from "@langchain/core/prompts";
import party from "party-js";
import { Input } from "~/components"

const template = `You're a professional fighting judge from Liverpool that speaks mostly with Cockney slang. Who would win in a fight between {opponent1} ("opponent1") and {opponent2}("opponent2")? Only tell me who would win and a short reason why.

Format the response like this:
"Winner: opponent1 or opponent2. reason: the reason they won."`
const promptTemplate = new PromptTemplate({
  template: template,
  inputVariables: ['opponent1', 'opponent2']
})

export const onPost: RequestHandler = (async (requestEvent) => {
    const OPEN_API_KEY = requestEvent.env.get('OPEN_API_KEY')
    const stream = new ReadableStream({
    async start(controller) {
      // Do work before streaming
      const formData = await requestEvent.parseBody()
        const opponent1 = formData.oppenent1
        const opponent2 = formData.oppenent2

        const prompt = await promptTemplate.format({
          opponent1: opponent1,
          opponent2: opponent2
        })

      const body = {
        'model': 'gpt-3.5-turbo',
        'messages': [{ 'role': 'user', 'content': prompt}],
        max_tokens: 300,
        temperature: 1,
        stream: true
      }
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPEN_API_KEY}`
        },
        body: JSON.stringify(body)
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let isStillStreaming = true

      while(isStillStreaming) {
        const {value, done} = await reader.read()
        const chunkValue = decoder.decode(value)

        /**
         * Captures any string after the text `data: `
         * @see https://regex101.com/r/R4QgmZ/1
         */
        const regex = /data:\s*(.*)/g
        let match = regex.exec(chunkValue)

        while (match !== null) {
          const payload = match[1]
          
          // Close stream
          if (payload === '[DONE]') {
            controller.close()
            break
          } else {
            try {
              const json = JSON.parse(payload)
              const text = json.choices[0].delta.content || ''

              // Send chunk of data
              controller.enqueue(text)
              match = regex.exec(chunkValue)
            } catch (error) {
              const nextChunk = await reader.read()
              const nextChunkValue = decoder.decode(nextChunk.value)
              match = regex.exec(chunkValue + nextChunkValue)
            }
          }
        }

        isStillStreaming = !done
      }
    }
  })
  requestEvent.send(new Response(stream))
})

function jsFormSubmit(form) {
  const url = new URL(form.action)
  const formData = new FormData(form)
  const searchParameters = new URLSearchParams(formData)

  const fetchOptions = {
    method: form.method
  }

  if (form.method.toLowerCase() === 'post') {
    fetchOptions.body = form.enctype === 'multipart/form-data' ? formData : searchParameters
  } else {
    url.search = searchParameters
  }

  return fetch(url, fetchOptions)
}

export default component$(() => {
  const state = useStore({
    isLoading: false,
    text: '',
    winner: ''
  })
  const handleSubmit = $(async (e: SubmitEvent) => {
    state.text = ''
    state.winner = ''
    state.isLoading = true

    const form = e.target as HTMLFormElement
    const res = await jsFormSubmit(form)

    if (!res.body) {
      state.isLoading = false
      return
    }
    
    // Parse streaming body
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let isStillStreaming = true

    while (isStillStreaming) {
      const { done, value } = await reader.read()
      const chunk = decoder.decode(value)
      state.text += chunk
      isStillStreaming = !done
    }

    const winnerPattern = /Winner:\s+(\w+).*/gi
    const match = winnerPattern.exec(state.text)
    state.winner = match?.length ? match[1].toLowerCase() : ''

    if (state.winner) {
      const winnerInput = document.querySelector(`textarea[name=${state.winner}]`) as HTMLTextAreaElement
      party.confetti(winnerInput, {
        count: 40,
        size: 2,
        spread: 15
      })
    }

    state.isLoading = false
  })

  return (
    <div class="max-w-4xl mx-auto p-4">
      <h1 class="text-6xl">AI of the Tiger 🐯</h1>
      <p class="text-neutral-100">An AI bot that will determain who would win in a battle between...</p>

      <form
        method="post"
        class="grid gap-4"
        preventdefault:submit
        onSubmit$={handleSubmit}
      >
        <div class="flex gap-4 grid-cols-2">
          <Input label="Oppenent 1" name="opponent1" value="A pirate" class={{
            rainbow: state.winner === 'opponent1'
          }}/>
          <Input label="Oppenent 2" name="opponent2" value="A Ninja" class={{
            rainbow: state.winner === 'opponent2'
          }}/>
        </div>

        <div>
          <button class="text-slate-50" type="submit" aria-disabled={state.isLoading}>
            {state.isLoading ? 'Loading...' : 'Submit'}
            </button>
        </div>
      </form>

      {state.text && (
        <article class="mt-4 border border-2 rounded-lg p-4 bg-[canvas]">
          <p>{state.text.slice(27)}</p>
        </article>
      )}
    </div>
  );
});