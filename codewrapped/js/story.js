import { compact, clamp, escapeText, formatDate } from './utils.js';
import { languageBars } from './charts.js';

function sanitizeUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' && /^(github\.com|avatars\.githubusercontent\.com)$/.test(parsed.hostname)) {
      return parsed.href;
    }
  } catch {}
  return '#';
}

export function analyze(data) {
  const own = data.repositories.filter(item => !item.fork);
  const stars = own.reduce((sum, item) => sum + item.stargazers_count, 0);
  const forks = own.reduce((sum, item) => sum + item.forks_count, 0);
  const languageMap = {};
  own.forEach(item => {
    if (!item.language) return;
    languageMap[item.language] ??= { count: 0, weight: 0 };
    languageMap[item.language].count++;
    languageMap[item.language].weight += Math.max(item.size, 1);
  });
  const languages = Object.entries(languageMap).map(([name, value]) => ({ name, ...value })).sort((a, b) => b.weight - a.weight);
  const total = languages.reduce((sum, item) => sum + item.weight, 0) || 1;
  const years = Math.max(1, (Date.now() - new Date(data.profile.created_at)) / 31557600000);
  const score = Math.round(clamp(18 + Math.log2(stars + 1) * 9 + Math.log2(forks + 1) * 5 + Math.min(own.length, 40) * .7 + Math.min(data.profile.followers, 1000) * .025 + Math.min(data.events.length, 40) * .35 + Math.min(years, 10) * 1.5, 1, 99));
  const archetype = stars > 100 || forks > 50 ? 'Architect' : languages.length >= 6 ? 'Explorer' : own.length >= 30 ? 'Builder' : own.filter(item => new Date(item.updated_at) > Date.now() - 31557600000).length >= 8 ? 'Creator' : 'Maintainer';
  const best = [...own].sort((a, b) => (b.stargazers_count * 4 + b.forks_count * 2 + new Date(b.updated_at) / 1e12) - (a.stargazers_count * 4 + a.forks_count * 2 + new Date(a.updated_at) / 1e12)).slice(0, 6);
  const top = languages[0]?.name || 'code';
  const name = data.profile.name || data.profile.login;
  const story = `${name} has spent ${Math.round(years)} ${Math.round(years) === 1 ? 'year' : 'years'} turning ideas into public work. Across ${own.length} original repositories, ${top} is the clearest thread—but the fuller story is one of ${archetype.toLowerCase()} energy, steady craft, and code that has earned ${compact.format(stars)} stars from the community.`;
  const achievements = [];
  if (own.length >= 20) achievements.push(['Prolific Builder', `Published ${own.length} original repositories`]);
  if (stars >= 10) achievements.push(['Community Signal', `Earned ${compact.format(stars)} stars across public work`]);
  if (languages.length >= 5) achievements.push(['Polyglot', `Created with ${languages.length} different languages`]);
  if (years >= 5) achievements.push(['Long Game', `Building in public for ${Math.floor(years)} years`]);
  if (!achievements.length) achievements.push(['Story in Motion', 'The next milestone is already being written']);
  const ordered = [...own].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const timeline = ordered.filter((item, index, list) => index === 0 || index === list.length - 1 || index === Math.floor(list.length / 2));
  const insights = [`${top} carries ${Math.round((languages[0]?.weight || 0) / total * 100)}% of the language footprint.`, `${best[0]?.name || 'Their work'} is the standout repository by community signal.`, `${data.events.length} public activities appeared in the most recent event window.`, `${Math.round(own.length / years)} repositories per year: a ${own.length / years > 5 ? 'high-velocity' : 'considered'} creative rhythm.`];
  return { own, stars, forks, languages, total, years, score, archetype, best, story, achievements, timeline, insights };
}

function repositoryCard(item, index) {
  return `<article class="repo-card tilt-card ${index === 0 ? 'featured' : ''}"><a href="${sanitizeUrl(item.html_url)}" target="_blank" rel="noreferrer"><span>Public repository ↗</span><h3>${escapeText(item.name)}</h3><p>${escapeText(item.description || 'A public project in this developer\'s evolving body of work.')}</p><div class="repo-meta"><span>${escapeText(item.language || 'Code')}</span><span>★ ${compact.format(item.stargazers_count)}</span><span>⑂ ${compact.format(item.forks_count)}</span></div></a></article>`;
}

export function storyMarkup(data, a) {
  const p = data.profile;
  const name = escapeText(p.name || p.login);
  const archetypeCopy = a.archetype === 'Architect' ? 'You create foundations other people want to build upon.' : a.archetype === 'Explorer' ? 'Curiosity moves you across languages, tools, and new terrain.' : a.archetype === 'Builder' ? 'You turn momentum into a broad, tangible body of work.' : a.archetype === 'Creator' ? 'Fresh ideas and active experiments define your public work.' : 'You value continuity, care, and keeping useful work alive.';
  return `
  <section class="story-section profile-hero reveal"><div><img class="avatar" src="${sanitizeUrl(p.avatar_url)}" width="112" height="112" alt="${escapeText(p.login)} profile picture"><div class="profile-meta">@${escapeText(p.login)} · joined ${formatDate(p.created_at)}</div><h2>${name}</h2>${p.bio ? `<p class="bio">${escapeText(p.bio)}</p>` : ''}<a class="text-link" href="${sanitizeUrl(p.html_url)}" target="_blank" rel="noreferrer">View on GitHub ↗</a></div></section>
  <section class="story-section narrative reveal"><span class="section-kicker">Chapter one · The developer</span><p class="big-story">${escapeText(a.story)}</p><div class="archetype"><span>Your archetype</span><strong>The ${a.archetype}</strong><p>${archetypeCopy}</p></div></section>
  <section class="story-section reveal"><div class="power-grid"><div><p class="score-label">Power Score</p><div class="score"><span class="count-up" data-count="${a.score}">0</span><small>/100</small></div></div><div class="power-copy"><h2>Quiet signals.<br>One clear number.</h2><p class="support-copy">A weighted view of craft, consistency, community, and range—not a ranking, but a snapshot of public impact.</p><div class="meter"><i class="animated-bar" style="--bar-width:${a.score}%"></i></div></div></div><div class="metrics"><div><strong class="count-up" data-count="${a.own.length}">0</strong><span>Original repositories</span></div><div><strong class="count-up" data-count="${a.stars}" data-compact="true">0</strong><span>Stars earned</span></div><div><strong class="count-up" data-count="${p.followers}" data-compact="true">0</strong><span>Followers</span></div><div><strong class="count-up" data-count="${a.languages.length}">0</strong><span>Languages</span></div></div></section>
  <section class="story-section section-surface reveal"><span class="section-kicker">Chapter three · Coding DNA</span><h2 class="chapter-title">A creative fingerprint,<br>written in languages.</h2><div class="dna-layout"><div class="dna-orb"><span>${escapeText(a.languages[0]?.name || 'Code')}</span></div><div class="dna-bars">${languageBars(a.languages, a.total)}</div></div></section>
  <section class="story-section repos reveal"><div class="section-head"><div><span class="section-kicker">Chapter four · Selected work</span><h2 class="chapter-title">Repositories that<br>carry the story.</h2></div><a class="text-link" href="${sanitizeUrl(p.html_url)}?tab=repositories" target="_blank" rel="noreferrer">See all →</a></div><div class="repo-grid">${a.best.map(repositoryCard).join('')}</div></section>
  <section class="story-section reveal"><span class="section-kicker">Chapter five · Milestones</span><h2 class="chapter-title">What the journey<br>has unlocked.</h2><div class="achievement-grid">${a.achievements.map((item, index) => `<article class="achievement-card tilt-card"><b>0${index + 1}</b><h3>${item[0]}</h3><p>${item[1]}</p></article>`).join('')}</div></section>
  <section class="story-section timeline reveal"><span class="section-kicker">The timeline</span><h2 class="chapter-title">From first repository<br>to current chapter.</h2>${a.timeline.map(item => `<div class="timeline-item"><time>${formatDate(item.created_at)}</time><i></i><article><h3>${escapeText(item.name)}</h3><p>${escapeText(item.description || `A new ${item.language || 'software'} project entered the story.`)}</p></article></div>`).join('')}</section>
  <section class="story-section insights reveal"><span class="section-kicker">A closer look</span><h2 class="chapter-title">Four things hiding<br>in plain sight.</h2>${a.insights.map((item, index) => `<article class="insight"><span>0${index + 1}</span><p>${escapeText(item)}</p></article>`).join('')}</section>
  <section class="story-section share-section"><div class="share-wrap reveal"><div class="share-card tilt-card"><div class="card-profile"><img src="${sanitizeUrl(p.avatar_url)}" alt="${escapeText(p.login)} GitHub avatar" width="68" height="68" crossorigin="anonymous"><small>CODEWRAPPED<br><span>@${escapeText(p.login)}</span></small></div><h2>${name}</h2><p>The ${a.archetype}</p><div class="share-score count-up" data-count="${a.score}">0</div><div class="share-stats"><span>${a.own.length} repos</span><span>${compact.format(a.stars)} stars</span><span>${a.languages.length} languages</span></div><div class="card-shine" aria-hidden="true"></div></div><div class="share-copy"><span class="section-kicker">That’s your story</span><h2>Built in public.<br>Ready to share.</h2><p>Your GitHub avatar is included in the high-resolution portrait. Tilt the preview, then download it as a share-ready PNG.</p><div class="share-actions"><button class="action-button primary" data-action="download">↓ Download card image</button><button class="action-button" data-action="copy">□ Copy link</button><button class="action-button" data-action="share">↗ Share</button></div></div></div></section>`;
}
