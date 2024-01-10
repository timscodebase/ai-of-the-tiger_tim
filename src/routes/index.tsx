import { component$ } from "@builder.io/qwik"
import { routeAction$, Form } from "@builder.io/qwik-city";

export const usePromtAction = routeAction$(async (formData, requestEvent) => {
  const OPEN_API_KEY = requestEvent.env.get('OPEN_API_KEY')
  const prompt = formData.prompt
  const body = {
    'model': 'gpt-3.5-turbo',
    'messages': [{ 'role': 'user', 'content': prompt }]
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPEN_API_KEY}`
    },
    body: JSON.stringify(body)
  })
  const json = await res.json();
  const data = json.choices[0].message.content;
  return { data }
})

export default component$(() => {
  const action = usePromtAction();
  return (
    <main class="max-w-4xl mx-auto p-4">
      <h1 class="text-6xl">Hi 👋</h1>

      <Form action={action}>
        <label for="prompt">
          Prompt
        </label>
        <textarea name="prompt" id="prompt">
          Tell me a funny joke
        </textarea>

        <button type="submit" aria-disabled={action.isRunning}>
          {action.isRunning ? 'Loading...' : 'Submit'}
        </button>
      </Form>
    </main>
  );
});