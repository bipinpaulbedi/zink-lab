const post = document.querySelector('[data-x-post]');
if (post) {
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: dark)');
  const fallback = post.querySelector('blockquote');
  let widgets;
  let currentTheme;
  const render = () => {
    const theme = root.dataset.theme || (system.matches ? 'dark' : 'light');
    if (!widgets || theme === currentTheme) return;
    currentTheme = theme;
    const host = document.createElement('div');
    post.querySelector('[data-x-frame]')?.remove();
    host.dataset.xFrame = '';
    post.append(host);
    fallback.hidden = false;
    widgets
      .createTweet(post.dataset.xPost, host, {
        theme,
        dnt: true,
        conversation: 'none',
      })
      .then((frame) => {
        if (host.isConnected && frame) fallback.hidden = true;
      })
      .catch(() => {});
  };
  new MutationObserver(render).observe(root, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  system.addEventListener('change', render);
  const script = document.createElement('script');
  script.src = 'https://platform.x.com/widgets.js';
  script.async = true;
  script.onload = () => {
    widgets = window.twttr.widgets;
    render();
  };
  document.head.append(script);
}
