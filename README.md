# EliteFitness homepage — Astro + Cloudflare

The WordPress (Genesis / Magazine Pro) homepage rebuilt as a static Astro site,
keeping the original markup, class names and theme stylesheet so it renders the same.

## Run

    npm install
    npm run fetch-assets   # one-time: copies missing theme images from the live server
    npm run dev            # http://localhost:4321
    npm run deploy         # build + wrangler deploy (Cloudflare Workers static assets)

Cloudflare Pages also works: build command `npm run build`, output directory `dist`.

## Structure

    src/data/home.ts           all homepage content (nav, carousel, articles, forum posts, footer)
    src/layouts/BaseLayout.astro  <head>, fonts, theme CSS, favicons
    src/components/            Header, TopSection, PostCarousel (Swiper), ExpertArticles,
                               ForumSections, Footer, LeadPopup (AWeber), BackToTop
    src/scripts/site.ts        sidenav, search toggle, popup, back-to-top
    src/styles/overrides.css   small fixes after removing WordPress plugin JS
    public/css/theme.css       original autoptimize theme stylesheet
    public/wp-content/...      theme images at their original paths (CSS references them)
    public/images/podcasts/    carousel thumbnails resized to 800px (~85 KB each, was 0.5–1.7 MB)

## Notes

- `fetch-assets` downloads images the saved page referenced but didn't include
  (forum-posts-bg1/2.jpg and other CSS backgrounds, avatar.jpg, footer_logo.png,
  social icons, favicons). Until it runs, those show as broken images.
- Article, forum, search and register links stay absolute to https://www.elitefitness.com,
  so the forum and archive keep working. If Astro serves the root domain, route
  `/forum/*`, `/articles/*` etc. to the WordPress/XenForo origin.
- Forum posts and articles are a static snapshot in `src/data/home.ts`. To keep them
  live, fetch from the WordPress REST API / XenForo API at build time and trigger
  rebuilds with a Cloudflare deploy hook on a cron.
- Removed: jQuery, the 260 KB autoptimize bundle, lazyload and caching-plugin scripts.
  Font Awesome 4.7 and Swiper are bundled from npm.
