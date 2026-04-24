import type { Scene } from "./fixtures"

export function AtomsV2Viewer(props: { scene: Scene }) {
  return (
    <section data-component="atoms-v2-viewer" class="atoms-v2-viewer">
      <div class="atoms-v2-panel atoms-v2-panel--sidebar">
        <div class="atoms-v2-viewer__search">Search templates...</div>
        <div class="atoms-v2-viewer__stack">
          <div class="atoms-v2-viewer__group">
            <span>Introduction</span>
            <button>First Contact</button>
            <button>Warm Introduction</button>
            <button>Formal Introduction</button>
          </div>
          <div class="atoms-v2-viewer__group">
            <span>Follow-up</span>
            <button>Friendly check-in</button>
            <button>Product recap</button>
            <button>Final nudge</button>
          </div>
        </div>
      </div>
      <div class="atoms-v2-panel atoms-v2-panel--canvas">
        <div class="atoms-v2-viewer__app">
          <div class="atoms-v2-viewer__brand">
            <span class="atoms-v2-mail" />
            <strong>{props.scene.viewer.app}</strong>
          </div>
          <div class="atoms-v2-viewer__tabs">
            <button class="is-active">{props.scene.viewer.status}</button>
            <button>Reply</button>
            <button>Template</button>
          </div>
          <div class="atoms-v2-viewer__gear" />
        </div>
        <div class="atoms-v2-viewer__body">
          <div class="atoms-v2-viewer__form">
            <div class="atoms-v2-viewer__switch">
              <button class="is-active">Subject</button>
              <button>Body</button>
            </div>
            <div class="atoms-v2-field">Enter email subject...</div>
            <div class="atoms-v2-rule" />
            <div class="atoms-v2-viewer__tone">
              <span>Formal</span>
              <div class="atoms-v2-slider">
                <div class="atoms-v2-slider__bar" />
                <div class="atoms-v2-slider__thumb" />
              </div>
              <span>Friendly</span>
            </div>
            <div class="atoms-v2-quote">“Here&apos;s a friendly update on the situation...”</div>
          </div>
          <div class="atoms-v2-viewer__preview">
            <div class="atoms-v2-viewer__preview-top">
              <span>Preview</span>
              <div class="atoms-v2-viewer__preview-actions">
                <button />
                <button />
              </div>
            </div>
            <div class="atoms-v2-viewer__preview-copy">
              <div>
                <span>From:</span>
                <strong>You</strong>
              </div>
              <div>
                <span>To:</span>
                <strong>recipient@example.com</strong>
              </div>
              <div class="atoms-v2-rule" />
              <strong>Your email subject will appear here</strong>
              <p>Start typing your email content...</p>
              <div class="atoms-v2-rule" />
              <p>Best regards,</p>
              <p>Your Name</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
