/* qickvibe/react-chadcn.js
   – Loads React, ReactDOM, shadcn/ui, Tailwind
   – Adds a minimalist, collapsible error overlay with copy-to-clipboard
*/
(async () => {
  // --- helpers ---------------------------------------------------------
  const loadCss = (href) =>
    new Promise((ok, err) => {
      if (document.querySelector(`link[href="${href}"]`)) return ok();
      const link = Object.assign(document.createElement("link"), {
        rel: "stylesheet",
        href,
        onload: ok,
        onerror: err,
      });
      document.head.appendChild(link);
    });

  // --- libs ------------------------------------------------------------
  if (!window.React)
    window.React = await import("https://esm.sh/react@18.3.1?bundle");

  if (!window.ReactDOM)
    window.ReactDOM = await import(
      "https://esm.sh/react-dom@18.3.1/client?bundle"
    );

  await loadCss(
    "https://cdn.jsdelivr.net/gh/llmjoi/loader@latest/dist/global.css"
  );

  if (!window.chadcn)
    window.chadcn = await import(
      "https://cdn.jsdelivr.net/gh/llmjoi/loader@latest/dist/shadcn.bundle.js"
    );

  // --- tiny error overlay ---------------------------------------------
  const { createRoot } = ReactDOM;
  const {
    Card,
    CardHeader,
    CardContent,
    Button,
  } = chadcn;

  const host = Object.assign(document.createElement("div"), {
    id: "llmjoi-error-overlay-root",
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
      const onErr = (m, u, l, c, e) =>
        push(e ? e.stack || e.toString() : m);
      const onRej = (e) =>
        push(
          e?.reason ? e.reason.stack || e.reason.toString() : e.toString()
        );

      addEventListener("error", onErr);
      addEventListener("unhandledrejection", onRej);
      return () => {
        removeEventListener("error", onErr);
        removeEventListener("unhandledrejection", onRej);
      };
    }, []);

    if (!errs.length) return null;

    return (
      <div className="fixed bottom-2 left-2 right-2 z-50 text-xs">
        <Card className="max-h-[40vh] overflow-auto">
          <CardHeader className="flex items-center justify-between">
            <span className="font-medium">Errors&nbsp;({errs.length})</span>
            <div className="flex gap-1">
              {/* copy */}
              <Button
                variant="outline"
                size="icon"
                title="Copy errors"
                onClick={() =>
                  navigator.clipboard.writeText(errs.join("\n\n"))
                }
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path
                    d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v16h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 18H8V7h11v16Z"
                    fill="currentColor"
                  />
                </svg>
              </Button>
              {/* toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen((o) => !o)}
              >
                {open ? "Hide" : "Show"}
              </Button>
            </div>
          </CardHeader>

          {open && (
            <CardContent className="space-y-2">
              {errs.map((e, i) => (
                <pre
                  key={i}
                  className="whitespace-pre-wrap break-all"
                >
                  {e}
                </pre>
              ))}
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  createRoot(host).render(React.createElement(Overlay));

  // --------------------------------------------------------------------
  document.dispatchEvent(new CustomEvent("quickvibe:ready"));
})();
