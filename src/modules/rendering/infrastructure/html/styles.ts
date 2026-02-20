import type { RenderContext } from "@/types.js";

export function buildStyles(ctx: RenderContext): string {
  const theme = ctx.request.render?.theme ?? "discord-dark-like";

  const themePalette =
    theme === "discord-light-like"
      ? {
          bg: "#ffffff",
          panel: "#f2f3f5",
          text: "#2e3338",
          muted: "#747f8d",
          accent: "#5865f2",
          guildRail: "#e3e5e8",
          channelRail: "#f2f3f5",
          chat: "#ffffff",
          hover: "rgba(6, 6, 7, 0.04)",
          border: "#d9dce0",
          mentionBg: "rgba(88, 101, 242, 0.18)",
          mentionText: "#3a45b4",
          link: "#0068e0",
        }
      : theme === "high-contrast"
        ? {
            bg: "#000000",
            panel: "#111111",
            text: "#f5f5f5",
            muted: "#d4d4d4",
            accent: "#ffcc00",
            guildRail: "#000000",
            channelRail: "#111111",
            chat: "#000000",
            hover: "rgba(255, 255, 255, 0.08)",
            border: "#ffffff",
            mentionBg: "rgba(255, 204, 0, 0.25)",
            mentionText: "#ffe58a",
            link: "#79b8ff",
          }
        : theme === "minimal"
          ? {
              bg: "#ffffff",
              panel: "#f3f4f6",
              text: "#1f2328",
              muted: "#6b7280",
              accent: "#3b82f6",
              guildRail: "#f1f2f4",
              channelRail: "#fafafb",
              chat: "#ffffff",
              hover: "rgba(15, 23, 42, 0.03)",
              border: "#e5e7eb",
              mentionBg: "rgba(59, 130, 246, 0.14)",
              mentionText: "#1d4ed8",
              link: "#0b66c3",
            }
          : theme === "compact"
            ? {
                bg: "#2b2d31",
                panel: "#1e1f22",
                text: "#f2f3f5",
                muted: "#a8adb4",
                accent: "#57f287",
                guildRail: "#111214",
                channelRail: "#1e1f22",
                chat: "#2b2d31",
                hover: "rgba(6, 6, 7, 0.4)",
                border: "#111214",
                mentionBg: "rgba(87, 242, 135, 0.2)",
                mentionText: "#9efbc4",
                link: "#26a5ff",
              }
            : {
                bg: "#313338",
                panel: "#2b2d31",
                text: "#dbdee1",
                muted: "#949ba4",
                accent: "#5865f2",
                guildRail: "#1e1f22",
                channelRail: "#2b2d31",
                chat: "#313338",
                hover: "rgba(6, 6, 7, 0.2)",
                border: "#1e1f22",
                mentionBg: "rgba(88, 101, 242, 0.3)",
                mentionText: "#c9cdfb",
                link: "#00a8fc",
              };

  const avatarSize = ctx.request.render?.avatarSize ?? 40;

  return `
:root {
  --bg: ${themePalette.bg};
  --panel: ${themePalette.panel};
  --text: ${themePalette.text};
  --muted: ${themePalette.muted};
  --accent: ${themePalette.accent};
  --guild-rail: ${themePalette.guildRail};
  --channel-rail: ${themePalette.channelRail};
  --chat-bg: ${themePalette.chat};
  --hover: ${themePalette.hover};
  --border: ${themePalette.border};
  --mention-bg: ${themePalette.mentionBg};
  --mention-text: ${themePalette.mentionText};
  --link: ${themePalette.link};
  --layout-guild-width: 72px;
  --layout-channel-width: 260px;
  --layout-left: calc(var(--layout-guild-width) + var(--layout-channel-width));
  --avatar-size: ${avatarSize}px;
  --font-ui: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-mono: "Consolas", "Cascadia Mono", "Source Code Pro", monospace;
}
* {
  box-sizing: border-box;
}
html, body, #app {
  width: 100%;
  height: 100%;
}
body {
  margin: 0;
  background: var(--chat-bg);
  color: var(--text);
  font-family: var(--font-ui);
  padding-left: var(--layout-left);
  overflow: hidden;
}
body::before,
body::after {
  content: "";
  position: fixed;
  inset: 0 auto 0 0;
  pointer-events: none;
}
body::before {
  width: var(--layout-guild-width);
  background: var(--guild-rail);
  border-right: 1px solid var(--border);
}
body::after {
  left: var(--layout-guild-width);
  width: var(--layout-channel-width);
  background: var(--channel-rail);
  border-right: 1px solid var(--border);
}
body.accessibility {
  font-size: 17px;
  line-height: 1.7;
}
header {
  position: fixed;
  top: 0;
  left: var(--layout-left);
  right: 0;
  z-index: 100;
  height: 48px;
  background: var(--chat-bg);
  border-bottom: 1px solid var(--border);
}
.toolbar {
  width: 100%;
  height: 48px;
  margin: 0;
  padding: 0 16px;
  display: flex;
  gap: 12px;
  align-items: center;
  overflow: hidden;
}
.toolbar h1 {
  font-size: 16px;
  margin: 0;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.toolbar input {
  margin-left: auto;
  width: min(100%, 380px);
  border: 0;
  border-radius: 4px;
  padding: 8px 10px;
  background: color-mix(in srgb, var(--panel) 80%, #000 20%);
  color: var(--text);
  font-size: 14px;
}
.toolbar input::placeholder {
  color: var(--muted);
}
main {
  height: 100%;
  overflow: auto;
  padding: 56px 0 24px;
}
#alerts,
#messages {
  width: min(100%, 960px);
  margin: 0 auto;
  padding: 0 16px;
}
.readonly-banner {
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
  background: color-mix(in srgb, var(--panel) 85%, #000 15%);
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 10px;
}
.watermark {
  position: fixed;
  pointer-events: none;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: clamp(24px, 6vw, 64px);
  color: color-mix(in srgb, var(--accent) 22%, transparent);
  opacity: 0.2;
  transform: rotate(-26deg);
  z-index: 999;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.stats {
  margin-left: 6px;
  color: var(--muted);
  font-size: 12px;
  white-space: nowrap;
}
.toc {
  margin: 0 0 10px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: color-mix(in srgb, var(--panel) 84%, #000 16%);
  font-size: 12px;
}
.toc ul {
  margin: 8px 0 0;
  padding-left: 16px;
}
.toc a {
  color: var(--link);
  text-decoration: none;
}
.message {
  display: grid;
  grid-template-columns: calc(var(--avatar-size) + 16px) 1fr;
  gap: 0;
  border-radius: 4px;
  padding: 2px 0;
  margin: 0 -6px;
}
.message:hover {
  background: var(--hover);
}
.message > div:first-child {
  display: grid;
  place-items: start center;
  padding-top: 2px;
}
.avatar {
  width: var(--avatar-size);
  height: var(--avatar-size);
  border-radius: 50%;
  background: color-mix(in srgb, var(--panel) 76%, #000 24%);
  object-fit: cover;
  display: grid;
  place-items: center;
  color: var(--muted);
  font-weight: 700;
  font-size: 15px;
}
.message > div:last-child {
  min-width: 0;
  padding-right: 8px;
}
.author-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.author {
  font-weight: 600;
  font-size: 16px;
}
.time {
  color: var(--muted);
  font-size: 12px;
}
.content {
  margin-top: 2px;
  line-height: 1.375;
  overflow-wrap: anywhere;
  font-size: 16px;
}
.content p {
  margin: 0;
}
.content a {
  color: var(--link);
}
.content code {
  font-family: var(--font-mono);
  background: color-mix(in srgb, var(--panel) 75%, #000 25%);
  border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
  border-radius: 4px;
  padding: 0 4px;
  font-size: 14px;
}
.content pre {
  margin: 6px 0 0;
  padding: 10px;
  border-radius: 6px;
  overflow: auto;
  background: color-mix(in srgb, var(--panel) 82%, #000 18%);
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
}
.content pre code {
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 13px;
}
.content blockquote {
  margin: 6px 0 0;
  border-inline-start: 4px solid var(--muted);
  padding-inline-start: 10px;
  color: color-mix(in srgb, var(--text) 86%, var(--muted));
}
.discord-mention,
.discord-channel-mention {
  display: inline-block;
  padding: 0 2px;
  border-radius: 3px;
  background: var(--mention-bg);
  color: var(--mention-text);
  font-weight: 500;
}
.discord-inline-time {
  color: color-mix(in srgb, var(--text) 90%, var(--muted));
}
.discord-spoiler {
  color: transparent;
  background: color-mix(in srgb, var(--panel) 84%, #000 16%);
  border-radius: 3px;
  padding: 0 2px;
}
.discord-spoiler:hover {
  color: var(--text);
}
.badge {
  font-size: 10px;
  border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
  border-radius: 4px;
  padding: 1px 4px;
  color: var(--accent);
  font-weight: 700;
  letter-spacing: 0.02em;
}
.attachment-list {
  margin-top: 8px;
  display: grid;
  gap: 8px;
}
.attachment {
  width: min(100%, 520px);
  background: color-mix(in srgb, var(--panel) 84%, #000 16%);
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  border-radius: 8px;
  padding: 10px;
}
.attachment a {
  color: var(--link);
  text-decoration: none;
  font-weight: 500;
}
.attachment img,
.attachment video {
  max-width: min(100%, 500px);
  border-radius: 6px;
  display: block;
}
.embed {
  margin-top: 8px;
  width: min(100%, 580px);
  border-inline-start: 4px solid var(--accent);
  padding: 8px 10px;
  background: color-mix(in srgb, var(--panel) 86%, #000 14%);
  border-radius: 4px;
}
.emoji {
  width: 22px;
  height: 22px;
  vertical-align: middle;
}
.meta-list {
  margin: 8px 0 0;
  padding-left: 18px;
  color: var(--muted);
  font-size: 12px;
}
@media (max-width: 980px) {
  :root {
    --layout-channel-width: 220px;
  }
}
@media (max-width: 820px) {
  body {
    padding-left: 0;
  }
  body::before,
  body::after {
    display: none;
  }
  header {
    left: 0;
  }
  #alerts,
  #messages {
    width: 100%;
    padding: 0 10px;
  }
  .message { grid-template-columns: 34px 1fr; }
  :root { --avatar-size: 34px; }
}
${ctx.request.render?.customCss ?? ""}
`;
}
