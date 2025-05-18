/* quickvibe/loaders/react-shadcn.js
   - Use by passing /prompts/react-shadcn.html to a chat LLM of your choice
   – Loads React, ReactDOM, shadcn/ui, Tailwind
   – Adds a minimalist, collapsible error overlay with copy-to-clipboard
*/
(async () => {
  // --- config ---------------------------------------------------------
  const REACT_VERSION = "19.1.0";
  const TAILWIND_VERSION = "4";
  const SHADCN_VERSION = "0.0.8";
  const BABEL_ENABLED = !window.__QUICKVIBE_NO_BABEL__;
  const BABEL_VERSION = "7";

  // --- helpers ---------------------------------------------------------
  const loadCss = (href) =>
     new Promise((resolve) => {
       if (document.querySelector(`link[href="${href}"]`)) return resolve();
       const link = Object.assign(document.createElement("link"), {
         rel: "stylesheet",
         href,
         onload: ok,
         onerror: () => {
           console.warn(
             `%cquickvibe%c failed to load CSS → ${href}`,
             "background:#0ea5e9;color:#fff;padding:2px 4px;border-radius:4px",
             ""
           );
           resolve();
         },
       });
       document.head.appendChild(link);
     });

  async function loadJs(url, label = url) {
    try {
      return await import(url);
    } catch (e) {
      console.error(
        `%cquickvibe%c failed to load ${label}\n${e}`,
        "background:#ef4444;color:#fff;padding:2px 4px;border-radius:4px",
        ""
      );
      throw e;
    }
  }

  // --- libs ------------------------------------------------------------
  const reactUrl = `https://esm.sh/react@${REACT_VERSION}?bundle`;
  const reactDomUrl = `https://esm.sh/react-dom@${REACT_VERSION}/client?bundle`;
  window.React ??= (await loadJs(reactUrl, "React")).default ?? (await import(reactUrl)).default;
  window.ReactDOM ??= (await loadJs(reactDomUrl, "ReactDOM")).default ?? (await import(reactDomUrl)).default;

  // optional Babel runtime so users can author JSX directly
  if (BABEL_ENABLED && !window.Babel) {
    await loadJs(`https://cdn.jsdelivr.net/npm/@babel/standalone@${BABEL_VERSION}/babel.min.js`, "Babel Standalone");   
    /*  -- disable broken worker & compile inline tags synchronously -- */
    Babel.disableScriptPreload = true; // skip prefetch
    // Transform every <script type="text/babel"> that isn't done yet
    Babel.transformScriptTags({
      noWorker: true, // <- MAIN THREAD compile (CSP-safe)
      presets: ['react'],
    });
  }

  if (!window.tailwindcss) {
    await loadJs(`https://cdn.jsdelivr.net/npm/@tailwindcss/browser@${TAILWIND_VERSION}`, "Tailwind Play-CDN");
  }

  window.shadcn ??= await loadJs(`https://cdn.jsdelivr.net/npm/shadcdn@${SHADCN_VERSION}/+esm`, "shadcn/ui bundle");

  // --- tiny error overlay ---------------------------------------------
  (() => {
    const errs = [];
    let open  = false;
   
    // host container
    const host = document.body.appendChild(
      Object.assign(document.createElement("div"), {
        id:  "quickvibe-error-overlay-root",
        className:
          "fixed bottom-2 left-2 right-2 z-50 text-xs space-y-0.5 font-sans",
      })
    );
   
    // card shell (Tailwind utility classes only)
    const card = host.appendChild(
      Object.assign(document.createElement("div"), {
        className:
          "max-h-[40vh] overflow-auto rounded-lg border border-slate-300/60 " +
          "bg-white/90 backdrop-blur shadow dark:bg-slate-800/80 " +
          (open ? "" : "hidden"),
      })
    );
   
    // header: title + buttons
    const hdr = card.appendChild(
      Object.assign(document.createElement("div"), {
        className:
          "flex items-center justify-between px-3 py-2 border-b " +
          "border-slate-200 dark:border-slate-700",
      })
    );
   
    const title = hdr.appendChild(
      Object.assign(document.createElement("span"), {
        className: "font-medium",
        textContent: "Errors (0)",
      })
    );
   
    // helper to make a tiny neutral button
    const btn = (svgPath, aria, onClick) => {
      const b = Object.assign(document.createElement("button"), {
        className:
          "h-6 w-6 flex items-center justify-center rounded border " +
          "border-slate-300 hover:bg-slate-100 dark:border-slate-600 " +
          "dark:hover:bg-slate-700 focus:outline-none",
        ariaLabel: aria,
        onclick: onClick,
      });
      b.innerHTML = `<svg viewBox="0 0 24 24" class="h-4 w-4">
                       <path d="${svgPath}" fill="currentColor"/>
                     </svg>`;
      return b;
    };
   
    // copy-to-clipboard
    hdr.appendChild(
      btn(
        "M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v16h14" +
          "a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 18H8V7h11v16Z",
        "Copy errors",
        () => navigator.clipboard.writeText(errs.join("\n\n"))
      )
    );
   
    // show/hide
    const toggleBtn = hdr.appendChild(
      btn("M6 9l6 6 6-6", "Toggle overlay", () => toggle(!open))
    );
   
    // log container
    const body = card.appendChild(
      Object.assign(document.createElement("div"), {
        className: "p-3 space-y-2",
      })
    );
   
    function push(e) {
      errs.unshift(e);
      title.textContent = `Errors (${errs.length})`;
      const pre = Object.assign(document.createElement("pre"), {
        className: "whitespace-pre-wrap break-all",
        textContent: e,
      });
      body.prepend(pre);
      toggle(true);
    }
   
    function toggle(state) {
      open = state;
      card.classList.toggle("hidden", !open);
      // flip chevron  (up/down)
      toggleBtn.firstElementChild.setAttribute(
        "d",
        open ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"
      );
    }
   
    addEventListener("error", (m, u, l, c, e) =>
      push(e ? e.stack || e.toString() : m)
    );
    addEventListener("unhandledrejection", (e) =>
      push(
        e?.reason ? e.reason.stack || e.reason.toString() : e.toString()
      )
    );
  })();

  document.dispatchEvent(new CustomEvent("quickvibe:ready"));
})();
