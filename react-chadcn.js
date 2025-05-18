/* quickvibe/react-chadcn.js
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
       if (document.querySelector(`link[href="${href}"]`)) return ok();
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
  window.React ??= await loadJs(`https://esm.sh/react@${REACT_VERSION}?bundle`, "React");
  window.ReactDOM ??= await loadJs(`https://esm.sh/react-dom@${REACT_VERSION}/client?bundle`, "ReactDOM");
  if (!window.tailwindcss) {
    await loadJs(`https://cdn.jsdelivr.net/npm/@tailwindcss/browser@${TAILWIND_VERSION}`, "Tailwind Play-CDN");
  }
  // optional Babel runtime so users can author JSX directly
  if (BABEL_ENABLED && !window.Babel) {
    await loadJs(`https://cdn.jsdelivr.net/npm/@babel/standalone@${BABEL_VERSION}/babel.min.js`, "Babel Standalone (dev-only)");
  }
  window.chadcn ??= await loadJs(`https://cdn.jsdelivr.net/npm/shadcdn@${SHADCN_VERSION}/+esm`, "shadcn/ui bundle");

  // --- tiny error overlay ---------------------------------------------
  const { createRoot } = ReactDOM;
  const { Card, CardHeader, CardContent, Button } = chadcn;
  const el = React.createElement;                 // alias for brevity
  const host = Object.assign(document.createElement("div"), {
    id: "quickvibe-error-overlay-root",
  });
  document.body.appendChild(host);
  function Overlay() {
    const { useState, useEffect } = React;
    const [errs, setErrs] = useState([]);
    const [open, setOpen] = useState(false);
    useEffect(() => {
      const push = (t) => {
        setErrs((e) => [t, ...e]);
        setOpen(true);
      };
      const onErr = (m,u,l,c,e)=>push(e ? e.stack || e.toString() : m);
      addEventListener("error", onErr);
      const onRej = (e)=>push(e?.reason ? e.reason.stack || e.reason.toString() : e.toString());
      addEventListener("unhandledrejection", onRej);
      return () => {
        removeEventListener("error", onErr);
        removeEventListener("unhandledrejection", onRej);
      };
    }, []);
    if (!errs.length) return null;
    return el(
      "div",
      { className: "fixed bottom-2 left-2 right-2 z-50 text-xs" },
      el(
        Card,
        { className: "max-h-[40vh] overflow-auto" },
        el(
          CardHeader,
          { className: "flex items-center justify-between" },
          el("span", { className: "font-medium" }, `Errors (${errs.length})`),
          el(
            "div",
            { className: "flex gap-1" },
            // copy button
            el(
              Button,
              {
                variant: "outline",
                size: "icon",
                title: "Copy errors",
                onClick: () => navigator.clipboard.writeText(errs.join("\n\n")),
              },
              el(
                "svg",
                { viewBox: "0 0 24 24", className: "h-4 w-4" },
                el("path", {
                  d: "M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v16h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 18H8V7h11v16Z",
                  fill: "currentColor",
                })
              )
            ),
            // toggle button
            el(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => setOpen((o) => !o),
              },
              open ? "Hide" : "Show"
            )
          )
        ),
        open &&
          el(
            CardContent,
            { className: "space-y-2" },
            errs.map((e, i) =>
              el(
                "pre",
                { key: i, className: "whitespace-pre-wrap break-all" },
                e
              )
            )
          )
      )
    );
  }
  createRoot(host).render(el(Overlay));

  // --------------------------------------------------------------------
  document.dispatchEvent(new CustomEvent("quickvibe:ready"));
})();
