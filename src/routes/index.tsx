import { $, component$, useStore } from "@builder.io/qwik"
import type { RequestHandler } from "@builder.io/qwik-city"

export const onPost: RequestHandler = (async (requestEvent) => {
  const stream = new ReadableStream({
    async start(controller) {
      // Do work before streaming
      const formData = await requestEvent.parseBody()
      // Do work before stream starts
      const OPEN_API_KEY = requestEvent.env.get('OPEN_API_KEY')
      const prompt = formData.prompt
      const body = {
        'model': 'gpt-3.5-turbo',
        'messages': [{ 'role': 'user', 'content': prompt }],
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
  
  // const json = await res.json();
  // const data = json.choices[0].message.content;
  // return { data }
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
    text: ''
  })
  const handleSubmit = $(async (e: SubmitEvent) => {
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

    state.isLoading = false
  })

  return (
    <main class="max-w-4xl mx-auto p-4">
      <h1 class="text-6xl">Hi 👋</h1>

      <form
        method="post"
        class="grid gap-4"
        preventdefault:submit
        onSubmit$={handleSubmit}
      >
        <label for="prompt">
          Prompt
        </label>
        <textarea name="prompt" id="prompt">
          Tell me a funny joke
        </textarea>

        <button type="submit" aria-disabled={state.isLoading}>
          {state.isLoading ? 'Loading...' : 'Submit'}
        </button>
      </form>
      {state.text && (
        <article class="mt-4 border border-2 rounded-lg p-4 bg-[canvas]">
          <p>{state.text}</p>
        </article>
      )}
    </main>
  );
});