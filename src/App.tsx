import { useState } from 'react'
import type { FormEvent } from 'react'

function App() {
  const [guess, setGuess] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = guess.trim()
    if (!trimmed) return
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch(`/guess?q=${encodeURIComponent(trimmed)}`)
      const text = await res.text()
      setResult(text)
    } catch {
      setResult('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='min-h-dvh grid place-items-center px-4'>
      <div className='w-full max-w-3xl'>
        <h1 className='text-4xl font-semibold text-center mb-6'>Guess the word</h1>
        <form onSubmit={onSubmit} className='flex flex-col sm:flex-row gap-3'>
          <input
            className='w-full text-2xl px-5 py-4 rounded-lg bg-zinc-900 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500'
            type='text'
            placeholder='Type your guess...'
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            aria-label='Guess input'
          />
          <button className='shrink-0 text-lg px-5 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50' type='submit' disabled={submitting} aria-label='Submit guess'>
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </form>
        {result !== null && (
          <div className='mt-4 text-lg text-center' aria-live='polite'>
            {result}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
