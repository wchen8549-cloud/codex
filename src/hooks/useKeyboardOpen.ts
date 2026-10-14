import { useEffect, useState } from 'react';

export function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const refresh = () => {
      const element = document.activeElement;
      const editing = element instanceof HTMLTextAreaElement ||
        (element instanceof HTMLInputElement && !['checkbox', 'radio', 'button'].includes(element.type));
      setOpen(editing && window.innerHeight - viewport.height > 150);
    };
    viewport.addEventListener('resize', refresh);
    document.addEventListener('focusin', refresh); document.addEventListener('focusout', refresh);
    return () => { viewport.removeEventListener('resize', refresh); document.removeEventListener('focusin', refresh); document.removeEventListener('focusout', refresh); };
  }, []);
  return open;
}
