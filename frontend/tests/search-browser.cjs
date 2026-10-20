// Real application + backend/tests/serve_search_fixture.py on a temporary DB.
// Only error/timing checks intercept requests; successful payloads come from API.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

async function main() {
  const browser = await chromium.launch({ headless: true, ...(process.env.SEARCH_BROWSER_PATH ? { executablePath: process.env.SEARCH_BROWSER_PATH } : {}) });
  const base = process.env.SEARCH_TEST_BASE || 'http://127.0.0.1:5178';
  const output = process.env.SEARCH_TEST_OUTPUT;
  if (output) fs.mkdirSync(output, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Asia/Shanghai' });
    if (process.env.SEARCH_OFFLINE_FIXTURE) {
      const captured = JSON.parse(fs.readFileSync(process.env.SEARCH_OFFLINE_FIXTURE, 'utf8'));
      await page.route('http://127.0.0.1:8017/**', async route => {
        const headers = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,OPTIONS', 'access-control-allow-headers': '*' };
        if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        const url = new URL(route.request().url());
        const data = url.pathname === '/posts/search/'
          ? captured.searches[JSON.stringify([url.searchParams.get('q'), url.searchParams.get('page')])]
          : captured.paths[decodeURIComponent(url.pathname)];
        assert(data !== undefined, `Missing offline fixture for ${url}`);
        return route.fulfill({ headers, json: data });
      });
    }
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // No external comments or other third-party traffic needed for local checks.
    await page.route('https://giscus.app/**', route => route.abort());
    let queries = [];
    page.on('request', request => { if (request.url().includes('/posts/search/?')) queries.push(request.url()); });
    const input = page.getByRole('searchbox', { name: '搜索文章标题或正文' });
    const submit = page.getByRole('button', { name: '搜索文章', exact: true });
    const results = page.getByRole('region', { name: '文章搜索结果' });
    async function finished() { await page.waitForFunction(() => document.querySelector('.search-results')?.getAttribute('aria-busy') === 'false'); }
    async function search(text, button = false) {
      const expand = page.getByRole('button', { name: '展开文章搜索', exact: true });
      if (await expand.count()) await expand.click();
      await input.fill(text);
      if (button) await submit.click(); else await input.press('Enter');
      if (text.trim()) await finished();
      else await page.locator('.post-list-link').first().waitFor();
    }
    async function noOverflow(width) {
      await page.setViewportSize({ width, height: 950 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}px`);
      const sizes = await page.locator('.search-input-row').evaluate(el => ({ width: el.getBoundingClientRect().width, parent: el.closest('.posts-search').getBoundingClientRect().width }));
      assert.equal(sizes.width, sizes.parent);
    }
    await page.goto(`${base}/?keep=retained`);
    await page.locator('.post-list-item').first().waitFor();
    const ordinaryTitles = await page.locator('.post-list-title').allTextContents();
    assert.equal(ordinaryTitles[0], '置顶旧文');
    assert.equal(await results.count(), 0);
    assert.equal(await input.count(), 0);
    const expand = page.getByRole('button', { name: '展开文章搜索', exact: true });
    assert.equal(await expand.getAttribute('aria-expanded'), 'false');
    await expand.click();
    assert(await input.evaluate(el => el === document.activeElement));
    await input.press('Escape');
    assert(await expand.evaluate(el => el === document.activeElement));
    await expand.press('Enter');
    await page.waitForFunction(() => {
      const form = document.querySelector('.posts-search-form');
      return Math.abs(form.getBoundingClientRect().width - form.parentElement.getBoundingClientRect().width) < 1;
    });
    const formRect = await page.locator('.posts-search-form').boundingBox();
    const firstRect = await page.locator('.post-list-item').first().boundingBox();
    assert(formRect.y + formRect.height <= firstRect.y);
    assert.equal(await page.locator('.site-nav a').filter({ hasText: /search|搜索/i }).count(), 0);
    await input.fill('树 旋转');
    await page.waitForTimeout(150);
    assert.equal(queries.length, 0);
    await input.press('Enter');
    await finished();
    assert.equal(await input.inputValue(), '树 旋转');
    assert((await results.textContent()).includes('共 2 篇文章'));
    assert.deepEqual(await results.locator('h2').allTextContents(), ['旋转与树', '树的结构']);
    assert.equal(await page.locator('.post-list-link').count(), 0);
    assert.equal(await page.getByText('多个关键词用空格分隔，结果须包含全部关键词。').count(), 1);
    assert((await results.locator('mark').allTextContents()).includes('旋转'));
    const oldResultText = await results.textContent();
    const requestCount = queries.length;
    await input.fill('尚未提交');
    await page.waitForTimeout(100);
    assert.equal(queries.length, requestCount);
    assert.equal(await results.textContent(), oldResultText);
    assert(new URL(page.url()).searchParams.get('q') === '树 旋转');

    await search('分页', true);
    assert.equal(await results.locator('article').count(), 10);
    assert((await results.textContent()).includes('共 23 篇文章'));
    const pageOne = await results.locator('h2').allTextContents();
    await page.getByRole('link', { name: '下一页', exact: true }).click();
    await finished();
    assert.equal(new URL(page.url()).searchParams.get('page'), '2');
    assert((await results.textContent()).includes('第 2 / 3 页'));
    const pageTwo = await results.locator('h2').allTextContents();
    assert(pageTwo.every(title => !pageOne.includes(title)));
    const dateText = await results.locator('time').first().textContent();
    await results.locator('h2 a').first().click();
    await page.locator('.markdown-body').waitFor();
    assert((await page.locator('.page-eyebrow').textContent()).includes(dateText));
    await page.goBack();
    await finished();
    assert.equal(await input.inputValue(), '分页');
    assert.deepEqual(await results.locator('h2').allTextContents(), pageTwo);
    await page.reload();
    await finished();
    assert.deepEqual(await results.locator('h2').allTextContents(), pageTwo);
    await search('树');
    assert.equal(new URL(page.url()).searchParams.get('page'), '1');
    await page.goBack();
    await finished();
    assert.equal(new URL(page.url()).searchParams.get('page'), '2');
    await page.goForward();
    await finished();
    assert.equal(await input.inputValue(), '树');
    await page.getByRole('button', { name: '清除搜索' }).click();
    await page.locator('.post-list-link').first().waitFor();
    assert.deepEqual(await page.locator('.post-list-title').allTextContents(), ordinaryTitles);
    assert.equal(await page.locator('#posts-query').inputValue(), '');
    assert.equal(await page.getByRole('button', { name: '展开文章搜索', exact: true }).count(), 1);
    assert.equal(new URL(page.url()).search, '?keep=retained');
    await search('');
    assert.equal(await results.count(), 0);
    await search('找不到的独特关键词');
    assert.equal(await page.getByText('没有找到包含全部关键词的文章', { exact: true }).count(), 1);
    await search('仅标题词');
    assert.equal(await results.locator('.search-snippet').count(), 0);
    assert.equal(await results.locator('.search-tags').count(), 0);

    await page.goto(`${base}/?keep=retained&q=分页&page=999`);
    await finished();
    await page.waitForURL('**page=3');
    await finished();
    assert.equal(await results.locator('article').count(), 3);
    await page.goto(`${base}/?q=分页&page=bad`);
    await finished();
    await page.waitForURL('**page=1');
    await finished();
    await page.goto(`${base}/?q=分页&page=`);
    await finished();
    await page.waitForURL('**page=1');
    await finished();

    let failures = true;
    await page.route('**/posts/search/?**', async route => {
      if (route.request().method() === 'OPTIONS') return route.fallback();
      if (failures) return route.fulfill({ status: 503, headers: { 'access-control-allow-origin': '*' }, json: { detail: 'temporary fixture failure' } });
      return route.fallback();
    });
    await search('重试词');
    assert.equal(await input.inputValue(), '重试词');
    assert.equal(await page.getByText('搜索失败，请重试。', { exact: true }).count(), 1);
    assert.equal(await page.getByText('没有找到包含全部关键词的文章', { exact: true }).count(), 0);
    failures = false;
    await page.getByRole('button', { name: '重试搜索', exact: true }).click();
    await finished();
    assert.equal(await page.getByText('没有找到包含全部关键词的文章', { exact: true }).count(), 1);
    await page.unroute('**/posts/search/?**');

    let release;
    let intercepted;
    const held = new Promise(resolve => { intercepted = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/posts/search/?**', async route => {
      if (route.request().method() === 'OPTIONS') return route.fallback();
      const query = new URL(route.request().url()).searchParams.get('q');
      if (query !== '树') return route.fallback();
      intercepted();
      await gate;
      try { await route.fallback(); } catch { /* request was correctly aborted */ }
    });
    await input.fill('树');
    await input.press('Enter');
    await held;
    assert.equal(await page.getByText('正在搜索…', { exact: true }).count(), 1);
    assert(await submit.isDisabled());
    await search('旋转');
    assert((await results.textContent()).includes('“旋转”'));
    release();
    await page.waitForTimeout(150);
    assert((await results.textContent()).includes('“旋转”'));
    await page.unroute('**/posts/search/?**');
    let releaseClear;
    const clearGate = new Promise(resolve => { releaseClear = resolve; });
    let heldClear;
    const clearHeld = new Promise(resolve => { heldClear = resolve; });
    await page.route('**/posts/search/?**', async route => {
      if (route.request().method() === 'OPTIONS') return route.fallback();
      heldClear(); await clearGate;
      try { await route.fallback(); } catch { /* aborted on clear */ }
    });
    await input.fill('树'); await input.press('Enter'); await clearHeld;
    await page.getByRole('button', { name: '清除搜索' }).click();
    releaseClear();
    await page.locator('.post-list-link').first().waitFor();
    await page.waitForTimeout(150);
    assert.equal(await results.count(), 0);
    await page.unroute('**/posts/search/?**');

    await search('超长 搜索');
    for (const width of [1440, 768, 375, 320]) await noOverflow(width);
    await search('needle');
    await noOverflow(320);
    await search('<img');
    assert.equal(await results.locator('img, script').count(), 0);
    assert.equal(await page.evaluate(() => window.searchXss), undefined);
    assert((await results.locator('mark').allTextContents()).includes('<img'));
    await search('安全');
    assert((await results.locator('h2').textContent()).includes('<img src=x'));
    assert.equal(await results.locator('img, script').count(), 0);
    assert.equal(await page.evaluate(() => window.searchTitleXss), undefined);
    await search('C++ a.b % _');
    assert.equal(await results.locator('article').count(), 10);
    await page.setViewportSize({ width: 1440, height: 1000 });
    if (output) await page.screenshot({ path: path.join(output, 'search-desktop.png'), fullPage: true });
    await noOverflow(375);
    if (output) await page.screenshot({ path: path.join(output, 'search-mobile.png'), fullPage: true });
    await page.emulateMedia({ colorScheme: 'dark' });
    const colors = await results.locator('mark').first().evaluate(el => ({ bg: getComputedStyle(el).backgroundColor, fg: getComputedStyle(el).color }));
    assert.equal(colors.bg, 'rgb(104, 84, 34)');
    assert.equal(colors.fg, 'rgb(255, 244, 204)');
    await input.focus();
    await input.press('Tab');
    assert(await submit.evaluate(el => el === document.activeElement));
    assert.equal(await submit.getAttribute('aria-label'), '搜索文章');
    // Existing integrations still reachable against the same real backend.
    for (const route of ['/now', '/about']) {
      await page.goto(`${base}${route}`);
      await page.locator('h1').waitFor();
      assert.equal(await page.locator('.error-text').count(), 0);
    }
    assert.deepEqual(errors, []);
    console.log(`PASS ${process.env.SEARCH_OFFLINE_FIXTURE ? 'OFFLINE captured-response UI checks (not live backend)' : 'real backend'}: submit-only search, AND/title ranking, 23-result pagination, detail/back/date, refresh/direct URL/history, draft isolation, clear/pins/other params, zero/title-only/no-tags, invalid pages, error/retry, stale response guards, safe highlights, long text, 1440/768/375/320px, dark highlight colors, keyboard labels, Now/About routes.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
