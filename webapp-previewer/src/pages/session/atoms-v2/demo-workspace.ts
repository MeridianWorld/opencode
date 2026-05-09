import type { WorkspaceData } from "./workspace"

const css = `
:root {
  color: #152033;
  background: #f4f7fb;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at 18% 12%, rgba(80, 128, 255, 0.12), transparent 28rem),
    linear-gradient(135deg, #f8fbff 0%, #eef3fa 54%, #f7f1e8 100%);
}

.shell {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr) 290px;
  gap: 24px;
  min-height: 100vh;
  padding: 28px;
}

.panel {
  border: 1px solid rgba(39, 52, 77, 0.1);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 24px 70px rgba(32, 42, 64, 0.1);
}

.brand,
.preview,
.composer {
  padding: 22px;
}

.brand h1 {
  margin: 12px 0 8px;
  font-size: 30px;
  letter-spacing: -0.04em;
}

.brand p,
.template p,
.preview p {
  color: #667085;
  line-height: 1.5;
}

.template {
  margin: 16px;
  padding: 16px;
  border: 1px solid #e6ebf2;
  border-radius: 20px;
  background: #fff;
}

.template strong,
.preview h2 {
  display: block;
  margin-bottom: 8px;
  color: #172033;
}

.main {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 18px;
}

.composer {
  display: grid;
  gap: 12px;
}

.composer input,
.composer textarea {
  width: 100%;
  border: 1px solid #dfe6ef;
  border-radius: 16px;
  padding: 14px 16px;
  font: inherit;
  color: #1f2a3d;
  background: #fff;
}

.composer textarea {
  min-height: 170px;
  resize: vertical;
}

.tone {
  display: flex;
  align-items: center;
  gap: 14px;
  color: #7a8597;
  font-size: 13px;
}

.track {
  position: relative;
  flex: 1;
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #dce6f4;
}

.track::before {
  content: "";
  position: absolute;
  inset: 0 34% 0 0;
  background: linear-gradient(90deg, #578cff, #1db29f);
}

.preview {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.meta {
  display: grid;
  gap: 6px;
  color: #748094;
  font-size: 13px;
}

.metric {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #edf1f7;
}

button {
  border: 0;
  border-radius: 999px;
  padding: 12px 18px;
  color: #fff;
  background: #2f6df6;
  font-weight: 700;
}
`.trim()

const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>EmailFlow</title>
    <style>${css}</style>
  </head>
  <body>
    <main class="shell">
      <aside class="panel brand">
        <span>EmailFlow</span>
        <h1>Draft warmer emails in one focused pass.</h1>
        <p>Pick a template, tune the tone, and preview the final message without leaving the builder.</p>
        <section class="template">
          <strong>First contact</strong>
          <p>Introduction and meeting request</p>
        </section>
        <section class="template">
          <strong>Warm introduction</strong>
          <p>Nice to connect with you</p>
        </section>
      </aside>
      <section class="main">
        <form class="panel composer">
          <input placeholder="Enter email subject..." value="Quick follow-up from our product team" />
          <textarea>Hi there,

I wanted to share a short update and make it easy to keep the conversation moving.</textarea>
          <div class="tone">
            <span>Formal</span>
            <span class="track"></span>
            <span>Friendly</span>
          </div>
          <button type="button">Generate polished draft</button>
        </form>
        <article class="panel preview">
          <h2>Your email preview</h2>
          <div class="meta">
            <span>From: You</span>
            <span>To: recipient@example.com</span>
            <span>Today, 10:04 AM</span>
          </div>
          <p>Hi there, here is a polished and friendly version of the update. It keeps the tone concise while making the next step obvious.</p>
        </article>
      </section>
      <aside class="panel preview">
        <h2>Analytics</h2>
        <div class="metric"><span>Readability</span><strong>92</strong></div>
        <div class="metric"><span>Open rate</span><strong>72%</strong></div>
        <div class="metric"><span>Response tone</span><strong>Friendly</strong></div>
      </aside>
    </main>
  </body>
</html>
`.trim()

export const demoWorkspace: WorkspaceData = {
  initial: "index.html",
  preview: {
    path: "index.html",
    label: "index.html",
    html,
  },
  tree: [
    { id: "index.html", label: "index.html", kind: "file", depth: 0 },
    { id: "styles.css", label: "styles.css", kind: "file", depth: 0 },
    { id: "app.js", label: "app.js", kind: "file", depth: 0 },
    { id: "README.md", label: "README.md", kind: "file", depth: 0 },
  ],
  docs: {
    "index.html": html,
    "styles.css": css,
    "app.js": [
      "const form = document.querySelector(\"form\")",
      "const button = document.querySelector(\"button\")",
      "",
      "button?.addEventListener(\"click\", () => {",
      "  form?.classList.add(\"is-polished\")",
      "})",
    ].join("\n"),
    "README.md": [
      "# EmailFlow demo workspace",
      "",
      "This virtual project is bundled into the frontend.",
      "It exists so the hosted root page can open directly into an Atoms-style workbench without asking for a local folder.",
    ].join("\n"),
  },
}
