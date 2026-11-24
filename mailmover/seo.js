'use strict';
// SEO for MailMover, built on the in-house Reacteo toolkit (vendor/reacteo.cjs, MIT).
// Everything is generated at serve time so no page file needs editing.
const R = require('./vendor/reacteo.cjs');

const SITE = 'https://mailmover.eu';
const NAME = 'MailMover';
const OG = SITE + '/og.png';
const OG_ALT = 'MailMover: move email between mailboxes';
const DESC = 'Move email between mailboxes. Copy or move every folder and message from Gmail, Microsoft 365, Outlook, IMAP and hosting accounts to a new mailbox, with a live progress view.';

const PAGES = {
  '/': { file: 'index.html', title: 'MailMover: move email between mailboxes', description: DESC, kind: 'app' },
  '/help.html': { file: 'help.html', title: 'Signing in to your mailbox: app passwords for Gmail and Microsoft 365 | MailMover', description: 'How to get the app password or sign-in details MailMover needs for Gmail, Google Workspace, Microsoft 365, Outlook.com and other mail providers.', kind: 'page', crumb: 'Help' },
  '/terms': { file: 'terms.html', title: 'Terms of Service | MailMover', description: 'The terms that apply when you use MailMover to move email between mailboxes.', kind: 'page', crumb: 'Terms' },
  '/privacy': { file: 'privacy.html', title: 'Privacy Policy | MailMover', description: 'What MailMover handles when you move email, what it does not keep, and your rights.', kind: 'page', crumb: 'Privacy' },
  '/security': { file: 'security.html', title: 'Security | MailMover', description: 'How MailMover protects your mailbox credentials and mail while a transfer runs.', kind: 'page', crumb: 'Security' },
  '/acceptable-use': { file: 'acceptable-use.html', title: 'Acceptable Use | MailMover', description: 'What you may and may not do with MailMover.', kind: 'page', crumb: 'Acceptable use' },
  '/legal': { file: 'legal.html', title: 'Legal | MailMover', description: 'Terms, privacy, security and acceptable use for MailMover.', kind: 'page', crumb: 'Legal' }
};

const org = { '@type': 'Organization', '@id': SITE + '/#org', name: NAME, url: SITE, logo: { '@type': 'ImageObject', url: SITE + '/icon-512.png', width: 512, height: 512 } };
const site = { '@type': 'WebSite', '@id': SITE + '/#site', name: NAME, url: SITE, description: DESC, publisher: { '@id': SITE + '/#org' }, inLanguage: 'en' };
const app = { '@type': 'WebApplication', '@id': SITE + '/#app', name: NAME, url: SITE, description: DESC, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', browserRequirements: 'Requires JavaScript', inLanguage: 'en', publisher: { '@id': SITE + '/#org' }, featureList: ['Copy or move mail between any two IMAP mailboxes', 'Gmail, Google Workspace, Microsoft 365, Outlook.com and hosting accounts', 'Dry run to check before anything is copied', 'Live progress with message counts and time left', 'Folders, flags and dates kept'] };

function jsonLd(p, url) {
  if (p.kind === 'app') return [{ '@context': 'https://schema.org', '@graph': [org, site, app] }];
  const page = { '@type': 'WebPage', '@id': url + '#page', url, name: p.title, description: p.description, isPartOf: { '@id': SITE + '/#site' }, inLanguage: 'en' };
  const crumbs = { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: p.crumb, item: url }] };
  return [{ '@context': 'https://schema.org', '@graph': [org, site, page, crumbs] }];
}

// Returns the page's head tags, or null for paths without SEO metadata.
function headFor(p, advanced) {
  if (advanced) return R.buildMetaTags({ title: 'MailMover Advanced', description: DESC, canonical: SITE + '/', noIndex: true, siteName: NAME, locale: 'en_GB' });
  const page = PAGES[p];
  if (!page) return null;
  const url = SITE + (p === '/' ? '/' : p);
  return R.buildMetaTags({ title: page.title, description: page.description, canonical: url, ogImage: OG, ogImageAlt: OG_ALT, siteName: NAME, locale: 'en_GB', twitterCard: 'summary_large_image', jsonLd: jsonLd(page, url) });
}

function stripHead(html) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, '').replace(/<meta\s+name=["']description["'][^>]*>\s*/i, '').replace(/<link\s+rel=["']canonical["'][^>]*>\s*/i, '');
}

const NOSCRIPT = '<noscript><h1>MailMover</h1><p>' + DESC + ' MailMover needs JavaScript turned on to run a transfer.</p></noscript>';

// Add the tags to a page that has already been read from disk.
function decorate(html, p, advanced) {
  let tags = headFor(p, advanced);
  if (!tags) return html;
  if (!/rel=["']icon["']/.test(html)) tags += '\n    <link rel="icon" type="image/png" href="/icon-512.png">\n    <link rel="apple-touch-icon" href="/apple-touch-icon.png">';
  let out = stripHead(html);
  out = out.replace('</head>', tags + '</head>');
  if (p === '/' && !advanced) out = out.replace('</body>', NOSCRIPT + '</body>');
  return out;
}

const AI = { allowSearch: true, allowUserInitiated: true, allowTraining: false, disallowPaths: ['/api/'] };

function robots() {
  return R.generateRobotsTxt({ hostname: SITE, rules: [{ userAgent: '*', allow: ['/'], disallow: ['/api/'] }], aiCrawlers: AI, sitemapUrls: [SITE + '/sitemap.xml'] });
}

function sitemap() {
  const urls = Object.keys(PAGES).filter(k => k !== '/legal').map(k => SITE + (k === '/' ? '/' : k));
  const today = new Date().toISOString().slice(0, 10);
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(u => '  <url><loc>' + u + '</loc><lastmod>' + today + '</lastmod></url>').join('\n') + '\n</urlset>\n';
}

function llms() {
  return R.generateLlmsTxt({
    name: NAME,
    summary: 'Web tool that copies or moves email from one mailbox to another, keeping folders, flags and dates, with a live progress view.',
    details: ['MailMover works with Gmail, Google Workspace, Microsoft 365, Outlook.com and any IMAP mailbox. You enter the old and new mailbox, run a check, then copy or move. A dry run shows what would happen before anything changes.', 'Passwords are used only for the transfer and are not stored.'],
    sections: [
      { title: 'Use it', links: [{ title: 'MailMover', url: SITE + '/', description: 'Start a transfer' }, { title: 'Signing in to your mailbox', url: SITE + '/help.html', description: 'App passwords and sign-in details for Gmail, Microsoft 365 and others' }] },
      { title: 'Policies', links: [{ title: 'Terms', url: SITE + '/terms' }, { title: 'Privacy', url: SITE + '/privacy' }, { title: 'Security', url: SITE + '/security' }, { title: 'Acceptable use', url: SITE + '/acceptable-use' }] }
    ]
  });
}

module.exports = { decorate, robots, sitemap, llms, PAGES };
