// Headless checks against an isolated mocked API; no real database or credentials.
// PLAYWRIGHT_MODULE selects an existing installation; no production dependency.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

async function main() {
  const browser = await chromium.launch({ headless: true, ...(process.env.NOW_BROWSER_PATH ? { executablePath: process.env.NOW_BROWSER_PATH } : {}) });
  try {
    const page = await browser.newPage();
    const output = process.env.NOW_TEST_OUTPUT;
    if (output) fs.mkdirSync(output, { recursive: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let content = null;
    let cuts = [];
    let failRead = false;
    let writeStatus = 200;
    let writes = 0;
    await page.route('**/site/now', async route => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,PUT,OPTIONS', 'access-control-allow-headers': '*' } });
      }
      const headers = { 'access-control-allow-origin': '*' };
      if (route.request().method() === 'PUT') {
        writes++;
        await new Promise(resolve => setTimeout(resolve, 250));
        if (writeStatus !== 200) return route.fulfill({ status: writeStatus, headers, json: { detail: '模拟保存失败' } });
        assert.equal(route.request().headers()['x-admin-secret'], 'isolated-test-only');
        content = { ...route.request().postDataJSON(), content_updated_at: '2026-10-17T16:30:00Z' };
        return route.fulfill({ headers, json: content });
      }
      return route.fulfill({ status: failRead ? 503 : 200, headers, json: failRead ? { detail: '模拟加载失败' } : { content, cuts } });
    });
    const base = process.env.NOW_TEST_BASE || 'http://127.0.0.1:5178';
    async function noOverflow(width) {
      await page.setViewportSize({ width, height: 900 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `页面在 ${width}px 溢出`);
      assert(await page.locator('.site-nav').evaluate(element => {
        if (element.scrollWidth <= element.clientWidth) return true;
        if (getComputedStyle(element).overflowX !== 'auto') return false;
        element.scrollLeft = element.scrollWidth;
        const last = element.lastElementChild.getBoundingClientRect();
        const bounds = element.getBoundingClientRect();
        const reachable = last.right <= bounds.right + 1;
        element.scrollLeft = 0;
        return reachable;
      }), `导航在 ${width}px 无法容纳或滚动到末尾`);
    }
    await page.goto(`${base}/now`);
    await page.getByText('关注内容尚未公布。').waitFor();
    assert.equal(await page.locator('.site-nav a[href="/now"]').count(), 1);
    assert.equal(await page.getByRole('link', { name: '打开我的 Log ↗' }).count(), 0);
    await page.getByText('还没有发布的 Cut。').waitFor();
    if (output) await page.screenshot({ path: path.join(output, 'now-empty.png'), fullPage: true });

    failRead = true;
    await page.goto(`${base}/admin/now`);
    await page.getByRole('alert').waitFor();
    assert.equal(await page.getByRole('button', { name: '保存 Now', exact: true }).count(), 0);
    failRead = false;
    await page.getByRole('button', { name: '重新加载' }).click();
    await page.locator('#now-secret').fill('isolated-test-only');
    await page.locator('#now-overview').fill('## 测试概述\n\n**中文加粗** [危险链接](javascript:alert%281%29)\n\n<script>window.nowUnsafe = true</script>');
    for (let index = 0; index < 10; index++) {
      await page.getByRole('button', { name: /^添加关注项/ }).click();
      await page.locator(`#now-title-${index}`).fill(`测试关注 ${index + 1}`);
      await page.locator(`#now-description-${index}`).fill(`**说明 ${index + 1}**\n\n- 一段中文\n- [正常链接](https://example.org)`);
    }
    assert(await page.getByRole('button', { name: /^添加关注项/ }).isDisabled());
    await page.getByRole('button', { name: '第 1 项下移', exact: true }).click();
    assert.equal(await page.locator('#now-title-0').inputValue(), '测试关注 2');
    assert.match(await page.locator('#now-description-0').inputValue(), /说明 2/);
    await page.locator('#now-log-url').fill('javascript:alert(1)');
    await page.getByRole('button', { name: '保存 Now', exact: true }).click();
    await page.getByRole('alert').waitFor();
    assert.equal(writes, 0);
    await page.locator('#now-log-url').fill('https://app.simplenote.com/p/test-only');
    await page.locator('#now-log-description').fill('测试 Log 说明');
    for (const status of [401, 422, 503]) {
      writeStatus = status;
      await page.getByRole('button', { name: '保存 Now', exact: true }).click();
      await page.getByRole('button', { name: '正在保存…' }).waitFor();
      assert(await page.locator('#now-overview').isDisabled());
      await page.getByRole('alert').waitFor();
      assert.equal(await page.locator('#now-title-0').inputValue(), '测试关注 2');
      assert.match(await page.locator('#now-overview').inputValue(), /中文加粗/);
    }
    writeStatus = 200;
    await page.getByRole('button', { name: '保存 Now', exact: true }).click();
    await page.getByText('Now 已保存。内容与显示顺序已更新。').waitFor();
    assert.equal(writes, 4);
    await page.reload();
    await page.locator('#now-overview').waitFor();
    assert.equal(await page.locator('#now-title-0').inputValue(), '测试关注 2');
    assert.match(await page.locator('#now-description-0').inputValue(), /\*\*说明 2\*\*/);
    assert.equal(await page.locator('#now-secret').inputValue(), '');
    await noOverflow(375);

    cuts = [{ slug: '中文 slug', title: '中文长标题'.repeat(30), created_at: '2026-10-17T16:30:00Z', summary: null }];
    await page.goto(`${base}/now`);
    await page.locator('.now-focus-list li').first().waitFor();
    assert.equal(await page.locator('.now-focus-list > li').count(), 10);
    assert.equal(await page.locator('.now-focus-list h3').first().textContent(), '测试关注 2');
    assert.equal(await page.locator('.now-number').last().textContent(), '10');
    await page.locator('.now-focus-text strong').first().waitFor();
    assert.equal(await page.locator('a[href^="javascript:"]').count(), 0);
    assert.equal(await page.evaluate(() => window.nowUnsafe), undefined);
    assert.equal(await page.locator('.now-cut').count(), 1);
    assert.equal(await page.locator('.now-cut-summary').count(), 0);
    assert.match(await page.locator('.now-intro time').textContent(), /2026年10月18日/);
    assert.equal(await page.getByRole('link', { name: '打开我的 Log ↗' }).getAttribute('href'), content.log_url);
    assert.equal(await page.getByRole('link', { name: '查看全部 Cut →' }).getAttribute('href'), '/tags?tag=%E7%89%87%E6%AE%B5%E6%94%B6%E9%9B%86');
    cuts[0].summary = '已有摘要，正常显示。';
    cuts.push({ slug: 'previous', title: '上一篇 Cut', created_at: '2026-10-01T00:00:00Z', summary: '上一篇摘要不展示' });
    await page.reload();
    await page.locator('.now-cut-summary').waitFor();
    assert.equal(await page.locator('.now-cut').count(), 2);
    assert.equal(await page.locator('.now-cut-summary').count(), 1);
    for (const width of [1440, 768, 375, 320]) {
      await noOverflow(width);
      if (output && [1440, 375].includes(width)) await page.screenshot({ path: path.join(output, `now-${width}.png`), fullPage: true });
    }
    // Optional titles: move between visible entries, skipping blank slots without
    // overwriting their descriptions; public numbers stay contiguous.
    await page.goto(`${base}/admin/now`);
    await page.locator('#now-title-1').fill('  ');
    const blankDescription = await page.locator('#now-description-1').inputValue();
    await page.getByRole('button', { name: '第 1 项下移', exact: true }).click();
    assert.equal(await page.locator('#now-title-0').inputValue(), '测试关注 3');
    assert.equal(await page.locator('#now-title-1').inputValue(), '  ');
    assert.equal(await page.locator('#now-description-1').inputValue(), blankDescription);
    assert.equal(await page.locator('#now-title-2').inputValue(), '测试关注 2');
    assert(await page.getByRole('button', { name: '第 2 项下移', exact: true }).isDisabled());
    assert(await page.getByRole('button', { name: '第 10 项下移', exact: true }).isDisabled());
    await page.locator('#now-secret').fill('isolated-test-only');
    await page.getByRole('button', { name: '保存 Now', exact: true }).click();
    await page.getByText('Now 已保存。内容与显示顺序已更新。').waitFor();
    await page.goto(`${base}/now`);
    await page.getByRole('heading', { name: 'currently focus on', exact: true }).waitFor();
    await page.locator('.now-number').first().waitFor();
    assert.deepEqual(await page.locator('.now-number').allTextContents(), ['01', '02', '03', '04', '05', '06', '07', '08', '09']);
    assert.deepEqual((await page.locator('.now-focus-list h3').allTextContents()).slice(0, 2), ['测试关注 3', '测试关注 2']);
    await page.goto(`${base}/admin/now`);
    await page.locator('#now-description-1').waitFor();
    assert.equal(await page.locator('#now-description-1').inputValue(), blankDescription);
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: '移除第 2 项', exact: true }).click();
    assert.equal(await page.locator('.now-edit-focus').count(), 9);
    await page.getByRole('button', { name: /^添加关注项/ }).click();
    assert.equal(await page.locator('.now-edit-focus').count(), 10);
    for (let index = 0; index < 10; index++) await page.getByRole('button', { name: '移除第 1 项', exact: true }).click();
    assert.equal(await page.locator('.now-edit-focus').count(), 0);
    await page.locator('#now-secret').fill('isolated-test-only');
    await page.getByRole('button', { name: '保存 Now', exact: true }).click();
    await page.getByText('Now 已保存。内容与显示顺序已更新。').waitFor();
    await page.goto(`${base}/now`);
    await page.getByText('关注内容尚未公布。').waitFor();
    assert.equal(await page.locator('.now-number').count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: empty/populated pages; form failures and reload; optional 0-10 items, add/remove, blank-title retention, moving across gaps and contiguous public numbering; Now navigation; UTC-to-Shanghai date; Cut 0/1/2 and summaries; safe Markdown and Log; 1440/768/375/320px overflow and navigation.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
