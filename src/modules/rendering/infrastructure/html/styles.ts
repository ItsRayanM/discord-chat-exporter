import type { RenderContext } from "@/types.js";

export function buildStyles(ctx: RenderContext): string {
  const theme = ctx.request.render?.theme ?? "discord-dark-like";

  const themePalette =
    theme === "discord-light-like"
      ? {
          /* Discord Light Theme — accurate values */
          bgPrimary: "#ffffff",
          bgSecondary: "#f2f3f5",
          bgSecondaryAlt: "#ebedef",
          bgTertiary: "#e3e5e8",
          bgModSubtle: "rgba(0,0,0,0.04)",
          bgModStrong: "rgba(0,0,0,0.08)",
          text: "#313338",
          textMuted: "#5c6370",
          textSecondary: "#4e5058",
          headerPrimary: "#060607",
          headerSecondary: "#4e5058",
          accent: "#5865f2",
          channelsDefault: "#5c6370",
          interactiveHover: "#313338",
          interactiveActive: "#060607",
          chatBg: "#ffffff",
          hover: "rgba(6, 6, 7, 0.04)",
          border: "rgba(0,0,0,0.08)",
          borderSubtle: "rgba(0,0,0,0.06)",
          mentionBg: "rgba(88, 101, 242, 0.15)",
          mentionText: "#5865f2",
          link: "#006ce7",
          scrollThumb: "#c1c3c7",
          scrollTrack: "transparent",
          inputBg: "#e3e5e8",
          codeBg: "#f2f3f5",
        }
      : theme === "high-contrast"
        ? {
            bgPrimary: "#000000",
            bgSecondary: "#111111",
            bgSecondaryAlt: "#0a0a0a",
            bgTertiary: "#000000",
            bgModSubtle: "rgba(255,255,255,0.06)",
            bgModStrong: "rgba(255,255,255,0.12)",
            text: "#f5f5f5",
            textMuted: "#d4d4d4",
            textSecondary: "#d4d4d4",
            headerPrimary: "#ffffff",
            headerSecondary: "#d4d4d4",
            accent: "#ffcc00",
            channelsDefault: "#d4d4d4",
            interactiveHover: "#ffffff",
            interactiveActive: "#ffffff",
            chatBg: "#000000",
            hover: "rgba(255, 255, 255, 0.08)",
            border: "#ffffff",
            borderSubtle: "rgba(255,255,255,0.16)",
            mentionBg: "rgba(255, 204, 0, 0.25)",
            mentionText: "#ffe58a",
            link: "#79b8ff",
            scrollThumb: "#666666",
            scrollTrack: "transparent",
            inputBg: "#111111",
            codeBg: "#111111",
          }
        : theme === "minimal"
          ? {
              bgPrimary: "#ffffff",
              bgSecondary: "#f3f4f6",
              bgSecondaryAlt: "#ebedef",
              bgTertiary: "#f1f2f4",
              bgModSubtle: "rgba(15, 23, 42, 0.03)",
              bgModStrong: "rgba(15, 23, 42, 0.06)",
              text: "#1f2328",
              textMuted: "#6b7280",
              textSecondary: "#6b7280",
              headerPrimary: "#1f2328",
              headerSecondary: "#6b7280",
              accent: "#3b82f6",
              channelsDefault: "#6b7280",
              interactiveHover: "#1f2328",
              interactiveActive: "#1f2328",
              chatBg: "#ffffff",
              hover: "rgba(15, 23, 42, 0.03)",
              border: "#e5e7eb",
              borderSubtle: "rgba(0,0,0,0.06)",
              mentionBg: "rgba(59, 130, 246, 0.14)",
              mentionText: "#1d4ed8",
              link: "#0b66c3",
              scrollThumb: "#c1c3c7",
              scrollTrack: "transparent",
              inputBg: "#f3f4f6",
              codeBg: "#f3f4f6",
            }
          : theme === "compact"
            ? {
                bgPrimary: "#2b2d31",
                bgSecondary: "#1e1f22",
                bgSecondaryAlt: "#232428",
                bgTertiary: "#1e1f22",
                bgModSubtle: "rgba(0,0,0,0.08)",
                bgModStrong: "rgba(0,0,0,0.16)",
                text: "#f2f3f5",
                textMuted: "#a8adb4",
                textSecondary: "#b5bac1",
                headerPrimary: "#f2f3f5",
                headerSecondary: "#b5bac1",
                accent: "#57f287",
                channelsDefault: "#949ba4",
                interactiveHover: "#dbdee1",
                interactiveActive: "#ffffff",
                chatBg: "#2b2d31",
                hover: "rgba(0, 0, 0, 0.06)",
                border: "rgba(255,255,255,0.06)",
                borderSubtle: "rgba(255,255,255,0.04)",
                mentionBg: "rgba(87, 242, 135, 0.2)",
                mentionText: "#9efbc4",
                link: "#00a8fc",
                scrollThumb: "#1a1b1e",
                scrollTrack: "#2b2d31",
                inputBg: "#383a40",
                codeBg: "#2b2d31",
              }
            : {
                /* Discord Dark Theme — exact Visual Refresh values */
                bgPrimary: "#313338",
                bgSecondary: "#2b2d31",
                bgSecondaryAlt: "#232428",
                bgTertiary: "#1e1f22",
                bgModSubtle: "rgba(0,0,0,0.08)",
                bgModStrong: "rgba(0,0,0,0.16)",
                text: "#dbdee1",
                textMuted: "#949ba4",
                textSecondary: "#b5bac1",
                headerPrimary: "#f2f3f5",
                headerSecondary: "#b5bac1",
                accent: "#5865f2",
                channelsDefault: "#949ba4",
                interactiveHover: "#dbdee1",
                interactiveActive: "#ffffff",
                chatBg: "#313338",
                hover: "rgba(0, 0, 0, 0.06)",
                border: "rgba(255,255,255,0.06)",
                borderSubtle: "rgba(255,255,255,0.04)",
                mentionBg: "rgba(88, 101, 242, 0.15)",
                mentionText: "#c9cdfb",
                link: "#00a8fc",
                scrollThumb: "#1a1b1e",
                scrollTrack: "#2b2d31",
                inputBg: "#383a40",
                codeBg: "#2b2d31",
              };

  const avatarSize = ctx.request.render?.avatarSize ?? 40;

  return `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap');

:root {
  /* Discord design tokens */
  --background-primary: ${themePalette.bgPrimary};
  --background-secondary: ${themePalette.bgSecondary};
  --background-secondary-alt: ${themePalette.bgSecondaryAlt};
  --background-tertiary: ${themePalette.bgTertiary};
  --background-modifier-hover: ${themePalette.hover};
  --background-modifier-selected: ${themePalette.bgModSubtle};
  --background-modifier-active: ${themePalette.bgModStrong};
  --text-normal: ${themePalette.text};
  --text-muted: ${themePalette.textMuted};
  --text-secondary: ${themePalette.textSecondary};
  --header-primary: ${themePalette.headerPrimary};
  --header-secondary: ${themePalette.headerSecondary};
  --brand-500: ${themePalette.accent};
  --channels-default: ${themePalette.channelsDefault};
  --interactive-hover: ${themePalette.interactiveHover};
  --interactive-active: ${themePalette.interactiveActive};
  --chat-bg: ${themePalette.chatBg};
  --background-message-hover: ${themePalette.hover};
  --border-subtle: ${themePalette.border};
  --border-faint: ${themePalette.borderSubtle};
  --mention-bg: ${themePalette.mentionBg};
  --mention-text: ${themePalette.mentionText};
  --text-link: ${themePalette.link};
  --scrollbar-thin-thumb: ${themePalette.scrollThumb};
  --scrollbar-thin-track: ${themePalette.scrollTrack};
  --input-background: ${themePalette.inputBg};
  --code-bg: ${themePalette.codeBg};

  /* Layout dimensions — exact Discord measurements */
  --guild-sidebar-width: 72px;
  --channel-sidebar-width: 240px;
  --members-sidebar-width: 240px;
  --header-height: 48px;

  /* Avatar */
  --avatar-size: ${avatarSize}px;

  /* Fonts — Discord font stack */
  --font-primary: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-display: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-headline: "ABC Ginto Nord", "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-code: "gg mono", "Source Code Pro", Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", Monaco, "Courier New", Courier, monospace;
}

/* ─── Reset ──────────────────────────────────────────────── */
* {
  box-sizing: border-box;
}
html, body, #app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
body {
  margin: 0;
  background: var(--chat-bg);
  color: var(--text-normal);
  font-family: var(--font-primary);
  font-size: 16px;
  line-height: 1.375;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}

/* ─── Scrollbar — Discord thin style ─────────────────────── */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background-color: var(--scrollbar-thin-track);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thin-thumb);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 4px;
  min-height: 40px;
}
::-webkit-scrollbar-corner {
  background-color: transparent;
}

/* ─── Discord Full UI Layout ─────────────────────────────── */
.discord-ui {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* ─── Server List (Guild Sidebar) ────────────────────────── */
.discord-ui .server-list {
  width: var(--guild-sidebar-width);
  min-width: var(--guild-sidebar-width);
  background: var(--background-tertiary);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 12px;
  gap: 8px;
  overflow-y: auto;
  overflow-x: hidden;
}
.discord-ui .server-list::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.discord-ui .server-pill-wrap {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  cursor: pointer;
}
.discord-ui .server-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  width: 4px;
  height: 40px;
  background: var(--header-primary);
  border-radius: 0 4px 4px 0;
  transform: translateY(-50%);
}
.discord-ui .server-pill {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background-primary);
  overflow: hidden;
  transition: border-radius 0.15s ease-out, background-color 0.15s ease-out;
}
.discord-ui .server-pill:hover {
  border-radius: 16px;
  background: var(--brand-500);
}
.discord-ui .server-icon {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: inherit;
}
.discord-ui .server-icon-placeholder {
  font-size: 18px;
  font-weight: 600;
  color: var(--header-primary);
}

/* ─── Channel List Sidebar ───────────────────────────────── */
.discord-ui .channel-list {
  width: var(--channel-sidebar-width);
  min-width: var(--channel-sidebar-width);
  background: var(--background-secondary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.discord-ui .channel-list-header {
  height: var(--header-height);
  padding: 0 16px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 15px;
  color: var(--header-primary);
  border-bottom: 1px solid var(--background-tertiary);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
  transition: background-color 0.1s ease;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.discord-ui .channel-list-header:hover {
  background: var(--background-modifier-hover);
}
.discord-ui .channel-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0 0 0 0;
}
.discord-ui .channel-category {
  padding: 18px 8px 0 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--channels-default);
  letter-spacing: 0.02em;
  cursor: default;
  line-height: 16px;
  display: flex;
  align-items: center;
}
.discord-ui .channel-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  margin: 1px 8px;
  border-radius: 4px;
  color: var(--channels-default);
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;
  transition: background-color 0.1s ease, color 0.1s ease;
}
.discord-ui .channel-item:hover {
  color: var(--interactive-hover);
  background: var(--background-modifier-hover);
}
.discord-ui .channel-item-active {
  color: var(--interactive-active);
  background: var(--background-modifier-selected);
}
.discord-ui .channel-hash {
  color: var(--channels-default);
  margin-right: 6px;
  font-weight: 400;
  font-size: 20px;
  line-height: 20px;
  flex-shrink: 0;
}

/* ─── Main Chat Area ─────────────────────────────────────── */
.discord-ui .main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--chat-bg);
}

/* ─── Header Toolbar ─────────────────────────────────────── */
.discord-ui .main-header {
  height: var(--header-height);
  min-height: var(--header-height);
  border-bottom: 1px solid var(--background-tertiary);
  background: var(--chat-bg);
  flex-shrink: 0;
}
.toolbar {
  width: 100%;
  height: var(--header-height);
  margin: 0;
  padding: 0 16px;
  display: flex;
  gap: 8px;
  align-items: center;
  overflow: hidden;
}
.toolbar h1,
.channel-title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--header-primary);
  line-height: 20px;
}
.toolbar input {
  margin-left: auto;
  width: min(100%, 240px);
  height: 28px;
  border: 0;
  border-radius: 4px;
  padding: 0 8px;
  background: var(--background-tertiary);
  color: var(--text-normal);
  font-size: 14px;
  font-family: var(--font-primary);
  outline: none;
}
.toolbar input::placeholder {
  color: var(--text-muted);
}
.toolbar input:focus {
  width: min(100%, 380px);
  transition: width 0.25s ease;
}
.stats {
  margin-left: 6px;
  color: var(--text-muted);
  font-size: 12px;
  white-space: nowrap;
}

/* ─── Main Content Scroll Area ───────────────────────────── */
.discord-ui .main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 0 24px;
}
.discord-ui .main-content #alerts,
.discord-ui .main-content #messages {
  width: 100%;
  margin: 0 auto;
  padding: 0 16px;
}
#alerts,
#messages {
  max-width: 100%;
  padding: 0 16px;
}

/* ─── Non-Discord-UI fallback layout ─────────────────────── */
body:not(.discord-ui-layout) {
  padding-left: 0;
}
body:not(.discord-ui-layout) header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: var(--header-height);
  background: var(--chat-bg);
  border-bottom: 1px solid var(--background-tertiary);
}
body:not(.discord-ui-layout) main {
  height: 100%;
  overflow: auto;
  padding: 56px 0 24px;
}

/* Active Discord UI layout */
body.discord-ui-layout {
  padding-left: 0;
  overflow: hidden;
}
body.discord-ui-layout::before,
body.discord-ui-layout::after {
  display: none;
}
body.accessibility {
  font-size: 17px;
  line-height: 1.7;
}

/* ─── Read-only Banner ───────────────────────────────────── */
.readonly-banner {
  padding: 8px 10px;
  border-radius: 4px;
  background: var(--background-secondary);
  border: 1px solid var(--border-subtle);
  font-size: 12px;
  color: var(--text-muted);
  margin: 0 16px 10px;
}

/* ─── Watermark ──────────────────────────────────────────── */
.watermark {
  position: fixed;
  pointer-events: none;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: clamp(24px, 6vw, 64px);
  color: var(--brand-500);
  opacity: 0.12;
  transform: rotate(-26deg);
  z-index: 999;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* ─── Table of Contents ──────────────────────────────────── */
.toc {
  margin: 0 16px 10px;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
  background: var(--background-secondary);
  font-size: 12px;
}
.toc ul {
  margin: 8px 0 0;
  padding-left: 16px;
}
.toc a {
  color: var(--text-link);
  text-decoration: none;
}
.toc a:hover {
  text-decoration: underline;
}

/* ─── Day Divider ────────────────────────────────────────── */
.divider {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 24px 16px 8px;
  height: 0;
  border-top: 1px solid var(--border-subtle);
  user-select: none;
}
.divider-content {
  position: absolute;
  background: var(--chat-bg);
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  line-height: 13px;
}

/* ─── Messages ───────────────────────────────────────────── */
.message {
  position: relative;
  display: grid;
  grid-template-columns: 72px 1fr;
  padding: 2px 48px 2px 0;
  min-height: 2.75rem;
  line-height: 1.375rem;
  word-wrap: break-word;
}
.message:hover {
  background: var(--background-message-hover);
}
.message-grouped {
  display: grid;
  grid-template-columns: 72px 1fr;
  padding: 0 48px 0 0;
  min-height: auto;
}
.message-grouped:hover {
  background: var(--background-message-hover);
}

/* Message avatar gutter */
.message-gutter {
  display: flex;
  justify-content: center;
  padding-top: 2px;
  width: 72px;
}
.message-compact-gutter {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  width: 72px;
  padding: 2px 8px 0 0;
  user-select: none;
}
.message-timestamp-compact {
  font-size: 11px;
  color: var(--text-muted);
  opacity: 0;
  cursor: default;
  font-weight: 500;
}
.message-grouped:hover .message-timestamp-compact {
  opacity: 1;
}

/* Message content */
.message-content-wrap {
  min-width: 0;
  padding-right: 16px;
}
.author-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  line-height: 1.375rem;
}
.author {
  font-weight: 500;
  font-size: 1rem;
  color: var(--header-primary);
  cursor: pointer;
  line-height: 1.375rem;
}
.author:hover {
  text-decoration: underline;
}
.time {
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.375rem;
  margin-left: 4px;
}

/* ─── Avatars ────────────────────────────────────────────── */
.avatar {
  width: var(--avatar-size);
  height: var(--avatar-size);
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-500);
  color: #fff;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
}
img.avatar {
  background: none;
}

/* ─── Content Styles ─────────────────────────────────────── */
.content {
  margin-top: 0;
  line-height: 1.375rem;
  overflow-wrap: anywhere;
  font-size: 1rem;
  color: var(--text-normal);
}
.content p {
  margin: 0;
}
.content a {
  color: var(--text-link);
  text-decoration: none;
}
.content a:hover {
  text-decoration: underline;
}
.content code {
  font-family: var(--font-code);
  background: var(--code-bg);
  border-radius: 3px;
  padding: 0.2em 0.4em;
  font-size: 85%;
  line-height: 1.125rem;
}
.content pre {
  margin: 6px 0 0;
  padding: 8px;
  border-radius: 4px;
  overflow: auto;
  background: var(--code-bg);
  border: 1px solid var(--border-faint);
  max-width: 90%;
}
.content pre code {
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 14px;
  line-height: 1.125rem;
}
.content blockquote {
  margin: 2px 0 0;
  border-inline-start: 4px solid var(--interactive-hover);
  padding-inline-start: 12px;
  color: var(--text-normal);
}

/* ─── Mentions ───────────────────────────────────────────── */
.discord-mention,
.discord-channel-mention {
  display: inline;
  padding: 0 2px;
  border-radius: 3px;
  background: var(--mention-bg);
  color: var(--mention-text);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 50ms ease-out, color 50ms ease-out;
}
.discord-mention:hover,
.discord-channel-mention:hover {
  background: var(--brand-500);
  color: #fff;
}
.discord-inline-time {
  background: rgba(255,255,255,0.06);
  border-radius: 3px;
  padding: 0 2px;
  color: var(--text-normal);
}
.discord-spoiler {
  color: transparent;
  background: var(--background-secondary);
  border-radius: 3px;
  padding: 0 2px;
  cursor: pointer;
}
.discord-spoiler:hover {
  color: var(--text-normal);
  background: rgba(255,255,255,0.12);
}

/* ─── Badges ─────────────────────────────────────────────── */
.badge {
  font-size: 10px;
  border: 1px solid var(--brand-500);
  border-radius: 4px;
  padding: 1px 4px;
  color: var(--brand-500);
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

/* ─── Attachments ────────────────────────────────────────── */
.attachment-list {
  margin-top: 4px;
  display: grid;
  gap: 4px;
}
.attachment {
  width: min(100%, 520px);
  background: var(--background-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 10px;
  overflow: hidden;
}
.attachment a {
  color: var(--text-link);
  text-decoration: none;
  font-weight: 500;
}
.attachment a:hover {
  text-decoration: underline;
}
.attachment img,
.attachment video {
  max-width: min(100%, 500px);
  border-radius: 4px;
  display: block;
}

/* ─── Embeds ─────────────────────────────────────────────── */
.embed {
  margin-top: 4px;
  width: min(100%, 520px);
  border-inline-start: 4px solid var(--background-tertiary);
  padding: 8px 16px 16px 12px;
  background: var(--background-secondary);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  color: var(--text-normal);
  font-size: 14px;
  line-height: 18px;
}
.embed-content-wrap {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.embed-main {
  flex: 1;
  min-width: 0;
}
.embed-author {
  display: flex;
  align-items: center;
  font-weight: 600;
  margin-bottom: 8px;
}
.embed-author-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 8px;
  object-fit: cover;
}
.embed-title {
  font-weight: 600;
  color: var(--text-normal);
  margin-bottom: 8px;
}
.embed-description {
  margin-bottom: 8px;
  white-space: pre-wrap;
  word-wrap: break-word;
}
.embed-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}
.embed-field {
  flex: 1 1 100%;
}
.embed-field.inline {
  flex: 1 1 calc(33.33% - 8px);
  min-width: 150px;
}
.embed-field-name {
  font-weight: 600;
  margin-bottom: 4px;
}
.embed-field-value {
  white-space: pre-wrap;
  word-wrap: break-word;
}
.embed-thumbnail {
  max-width: 80px;
  max-height: 80px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}
.embed-image {
  margin-top: 16px;
  max-width: 100%;
  border-radius: 4px;
}
.embed-footer {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
}
.embed-footer-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 8px;
  object-fit: cover;
}

/* ─── Emoji ──────────────────────────────────────────────── */
.emoji {
  width: 22px;
  height: 22px;
  vertical-align: middle;
  object-fit: contain;
}

/* ─── Reactions / Meta ───────────────────────────────────── */
.meta-list {
  margin: 4px 0 0;
  padding-left: 18px;
  color: var(--text-muted);
  font-size: 12px;
}
.reactions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
.reaction {
  display: inline-flex;
  align-items: center;
  background: var(--background-secondary);
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0.125rem 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-normal);
  cursor: pointer;
  user-select: none;
}
.reaction:hover {
  background: var(--background-modifier-hover);
  border-color: var(--border-subtle);
}
.reaction.me {
  background: var(--mention-bg);
  border-color: var(--brand-500);
}
.reaction-emoji {
  width: 1rem;
  height: 1rem;
  line-height: 1rem;
  margin-right: 0.375rem;
  object-fit: contain;
}
.reaction-count {
  min-width: 9px;
  text-align: center;
}

/* ─── Members Sidebar ────────────────────────────────────── */
.discord-ui .members-sidebar {
  width: var(--members-sidebar-width);
  min-width: var(--members-sidebar-width);
  background: var(--background-secondary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.discord-ui .members-header {
  padding: 24px 8px 0 16px;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--channels-default);
  line-height: 16px;
}
.discord-ui .members-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 0 20px;
}
.discord-ui .member-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 1px 8px;
  margin: 1px 8px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  height: 42px;
  transition: background-color 0.1s ease;
}
.discord-ui .member-row:hover {
  background: var(--background-modifier-hover);
}
.discord-ui .member-avatar-wrap {
  flex-shrink: 0;
  position: relative;
}
.discord-ui .member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}
.discord-ui .member-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--brand-500);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}
.discord-ui .member-name {
  color: var(--channels-default);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  line-height: 18px;
}
.discord-ui .member-bot {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  background: var(--brand-500);
  color: #fff;
  padding: 0 4px;
  border-radius: 3px;
  margin-left: 4px;
  height: 15px;
  line-height: 15px;
  display: inline-flex;
  align-items: center;
}

/* ─── Responsive ─────────────────────────────────────────── */
@media (max-width: 1100px) {
  .discord-ui .members-sidebar {
    display: none;
  }
}
@media (max-width: 820px) {
  .discord-ui .channel-list {
    width: 200px;
    min-width: 200px;
  }
  .message {
    grid-template-columns: 52px 1fr;
    padding-right: 16px;
  }
  .message-grouped {
    grid-template-columns: 52px 1fr;
    padding-right: 16px;
  }
  .message-gutter {
    width: 52px;
  }
  .message-compact-gutter {
    width: 52px;
  }
  :root {
    --avatar-size: 32px;
  }
}
@media (max-width: 600px) {
  .discord-ui .server-list {
    width: 0;
    min-width: 0;
    display: none;
  }
  .discord-ui .channel-list {
    width: 56px;
    min-width: 56px;
  }
  .discord-ui .channel-list-header {
    font-size: 0;
    justify-content: center;
  }
  .discord-ui .channel-nav .channel-category {
    display: none;
  }
  .discord-ui .channel-nav .channel-item {
    font-size: 0;
    justify-content: center;
    padding: 6px;
    margin: 1px 4px;
  }
  .discord-ui .channel-hash {
    font-size: 20px;
    margin: 0;
  }
}
${ctx.request.render?.customCss ?? ""}
`;
}
