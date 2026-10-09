import { useState } from "react";
import { Button } from "@cloudflare/kumo";

// A code block with a copy button. Pass the text as a string so the copy matches what is shown.
export function Code({ children }) {
  const [done, setDone] = useState(false);
  const copy = () => {
    const finish = () => { setDone(true); setTimeout(() => setDone(false), 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(children).then(finish, finish);
    else finish();
  };
  return (
    <div className="code">
      <pre><code>{children}</code></pre>
      <Button className="copybtn" size="sm" variant="secondary" onClick={copy}>{done ? "Copied" : "Copy"}</Button>
    </div>
  );
}
