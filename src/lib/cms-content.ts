import DOMPurify from 'dompurify';

export interface NormalizedCmsContent {
  title: string;
  html: string;
}

/**
 * CMS editors often paste HTML from Word/Google Docs, which carries inline
 * colours, fonts, spacing and class names. Those attributes win over the
 * site's theme, so strip them and keep only semantic markup. The site CSS is
 * then the single source of truth for typography, colour and spacing.
 */
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'del',
  'ins',
  'mark',
  'small',
  'sub',
  'sup',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  'a',
  'blockquote',
  'hr',
  'code',
  'pre',
  'table',
  'caption',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'colgroup',
  'col',
  'img',
  'figure',
  'figcaption',
  'div',
  'span',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'aside',
  'details',
  'summary',
];

const ALLOWED_ATTR = [
  'href',
  'src',
  'alt',
  'title',
  'target',
  'rel',
  'colspan',
  'rowspan',
  'scope',
  'start',
  'reversed',
  'value',
  'loading',
  'decoding',
];

let hooksInstalled = false;

function installHooks() {
  if (hooksInstalled) return;

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  hooksInstalled = true;
}

export function normalizeCmsContent(
  html: string,
  fallbackTitle: string
): NormalizedCmsContent {
  // The pages are fetched client-side, but this module is also evaluated
  // during prerendering. DOMPurify needs a DOM, so defer until the browser.
  if (typeof window === 'undefined') {
    return { title: fallbackTitle, html: '' };
  }

  installHooks();

  const sanitized = DOMPurify.sanitize(html || '', {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });

  const document = new DOMParser().parseFromString(sanitized, 'text/html');
  const body = document.body;

  // Prefer the document's own heading and remove it from the body so the
  // page does not render two H1s. Any other H1s are demoted to H2.
  let title = fallbackTitle;
  const firstElement = body.firstElementChild;
  if (firstElement?.tagName === 'H1') {
    title = firstElement.textContent?.trim() || fallbackTitle;
    firstElement.remove();
  }

  body.querySelectorAll('h1').forEach((heading) => {
    const replacement = document.createElement('h2');
    replacement.innerHTML = heading.innerHTML;
    heading.replaceWith(replacement);
  });

  // Wide CMS tables should scroll instead of breaking the page layout.
  body.querySelectorAll('table').forEach((table) => {
    if (table.parentElement?.classList.contains('cms-table-wrap')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'cms-table-wrap';
    table.parentNode?.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });

  return { title, html: body.innerHTML };
}
