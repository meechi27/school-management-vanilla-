import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../js/mock-data.js';
import { renderHeader } from '../js/app.js';

function readIndexHtml() {
  return readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
}

describe('mock data', () => {
  it('exports the application name', () => {
    expect(app.name).toBe('School Management');
  });
});

describe('renderHeader', () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<header><h1 data-slot="app-name"></h1></header>';
  });

  it('writes the application name into the header slot', () => {
    renderHeader(document.querySelector('[data-slot="app-name"]'), app.name);

    expect(
      document.querySelector('[data-slot="app-name"]').textContent,
    ).toBe('School Management');
  });
});

describe('index.html shell', () => {
  it('contains one semantic header with exactly one h1 name slot', () => {
    const indexHtml = readIndexHtml();
    expect(indexHtml).toContain('<header');
    expect(indexHtml).toContain('data-slot="app-name"');
    expect(indexHtml.match(/<h1\b/g)).toHaveLength(1);
  });

  it('links the stylesheet and loads the module entry point', () => {
    const indexHtml = readIndexHtml();
    expect(indexHtml).toContain('href="/css/style.css"');
    expect(indexHtml).toContain(
      '<script type="module" src="/js/app.js"></script>',
    );
  });
});
