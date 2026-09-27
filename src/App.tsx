import { useState, type ReactNode } from 'react'
import * as Sentry from '@sentry/react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function throwTestError(): never {
  throw new Error('Sentry test: uncaught error')
}

function captureTestException(): string {
  try {
    throw new Error('Sentry test: caught exception')
  } catch (error) {
    return Sentry.captureException(error)
  }
}

function captureTestMessage(): string {
  return Sentry.captureMessage('Sentry test: hello from App', 'info')
}

function traceTestSpan(): Promise<string> {
  return Sentry.startSpan(
    {
      name: 'sentry.test',
      op: 'test',
      attributes: { 'test.source': 'app.tsx' },
    },
    async (span) => {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 80)
      })
      return span.spanContext().spanId
    },
  )
}

function BrokenChild(): ReactNode {
  throw new Error('Sentry test: render error')
}

function App() {
  const [count, setCount] = useState(0)
  const [renderCrash, setRenderCrash] = useState(false)
  const [status, setStatus] = useState('点下面的按钮，把一条测试事件送到 Sentry。')

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
        <div className="sentry-tests">
          <h2>Sentry 测试</h2>
          <p className="sentry-status" role="status">
            {status}
          </p>
          <div className="sentry-actions">
            <button
              type="button"
              onClick={() => {
                setStatus('已抛出未捕获错误')
                throwTestError()
              }}
            >
              抛出未捕获错误
            </button>
            <button
              type="button"
              onClick={() => {
                const eventId = captureTestException()
                setStatus(`已上报捕获异常 ${eventId}`)
              }}
            >
              上报已捕获异常
            </button>
            <button
              type="button"
              onClick={() => {
                const eventId = captureTestMessage()
                setStatus(`已发送测试消息 ${eventId}`)
              }}
            >
              发送测试消息
            </button>
            <button
              type="button"
              onClick={() => {
                void traceTestSpan().then((spanId) => {
                  setStatus(`已创建测试 span ${spanId}`)
                })
              }}
            >
              创建测试 Span
            </button>
            <button type="button" onClick={() => setRenderCrash(true)}>
              触发渲染错误
            </button>
          </div>
          <Sentry.ErrorBoundary
            fallback={({ resetError }) => (
              <button
                type="button"
                onClick={() => {
                  setRenderCrash(false)
                  resetError()
                  setStatus('渲染错误已恢复')
                }}
              >
                渲染出错，点此恢复
              </button>
            )}
            onError={(_error, _componentStack, eventId) => {
              setStatus(`已捕获渲染错误 ${eventId}`)
            }}
          >
            {renderCrash ? <BrokenChild /> : null}
          </Sentry.ErrorBoundary>
        </div>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
