#!/usr/bin/env bash
# Copies theme images that the saved page referenced but did not include
# (CSS backgrounds, avatar, footer logo, social icons, favicons) from the
# live server into ./public so the Astro build is fully self-hosted.
# Destinations are opaque /assets/... paths, not the WordPress source
# layout, so the CMS's directory structure never ends up in page source.
# Run once from the project root:  npm run fetch-assets
set -u
ORIGIN="${ORIGIN:-https://www.elitefitness.com}"
cd "$(dirname "$0")/../public"

# "source path on the WP origin" -> "destination path under ./public"
FILES=(
  "/wp-content/themes/magazine-pro/images/247.png:/assets/theme/images/247.png"
  "/wp-content/themes/magazine-pro/images/arraow.png:/assets/theme/images/arraow.png"
  "/wp-content/themes/magazine-pro/images/arrow.png:/assets/theme/images/arrow.png"
  "/wp-content/themes/magazine-pro/images/con-back-image.png:/assets/theme/images/con-back-image.png"
  "/wp-content/themes/magazine-pro/images/content_bg01.jpg:/assets/theme/images/content_bg01.jpg"
  "/wp-content/themes/magazine-pro/images/forum-posts-bg1.jpg:/assets/theme/images/forum-posts-bg1.jpg"
  "/wp-content/themes/magazine-pro/images/forum-posts-bg2.jpg:/assets/theme/images/forum-posts-bg2.jpg"
  "/wp-content/themes/magazine-pro/images/go.png:/assets/theme/images/go.png"
  "/wp-content/themes/magazine-pro/images/header_top_bg.png:/assets/theme/images/header_top_bg.png"
  "/wp-content/themes/magazine-pro/images/header_topbg-01.png:/assets/theme/images/header_topbg-01.png"
  "/wp-content/themes/magazine-pro/images/i.ico:/assets/theme/images/i.ico"
  "/wp-content/themes/magazine-pro/images/icon-direction-nav.png:/assets/theme/images/icon-direction-nav.png"
  "/wp-content/themes/magazine-pro/images/ima03.png:/assets/theme/images/ima03.png"
  "/wp-content/themes/magazine-pro/images/list_icon_1.png:/assets/theme/images/list_icon_1.png"
  "/wp-content/themes/magazine-pro/images/red-arrow.png:/assets/theme/images/red-arrow.png"
  "/wp-content/themes/magazine-pro/images/search_bg.png:/assets/theme/images/search_bg.png"
  "/wp-content/themes/magazine-pro/images/second-row-joint.jpg:/assets/theme/images/second-row-joint.jpg"
  "/wp-content/themes/magazine-pro/images/shadow.png:/assets/theme/images/shadow.png"
  "/wp-content/themes/magazine-pro/images/avatar.jpg:/assets/theme/avatar.jpg"
  "/wp-content/themes/magazine-pro/images/footer_logo.png:/assets/theme/footer_logo.png"
  "/wp-content/plugins/social-media-widget/images/default/32/facebook.png:/assets/icons/facebook.png"
  "/wp-content/plugins/social-media-widget/images/default/32/twitter.png:/assets/icons/twitter.png"
  "/wp-content/uploads/2023/03/cropped-elite-logo-fav-512-32x32.jpg:/assets/favicons/cropped-elite-logo-fav-512-32x32.jpg"
  "/wp-content/uploads/2023/03/cropped-elite-logo-fav-512-192x192.jpg:/assets/favicons/cropped-elite-logo-fav-512-192x192.jpg"
  "/wp-content/uploads/2023/03/cropped-elite-logo-fav-512-180x180.jpg:/assets/favicons/cropped-elite-logo-fav-512-180x180.jpg"
  "/wp-content/uploads/2016/02/elite-logo-w200px-h120px.png:/assets/favicons/elite-logo-w200px-h120px.png"
  "/wp-content/plugins/ditty-news-ticker/includes/libs/fontawesome-6.4.0/webfonts/fa-brands-400.ttf:/assets/theme/vendor/fontawesome/webfonts/fa-brands-400.ttf"
  "/wp-content/plugins/ditty-news-ticker/includes/libs/fontawesome-6.4.0/webfonts/fa-brands-400.woff2:/assets/theme/vendor/fontawesome/webfonts/fa-brands-400.woff2"
  "/wp-content/plugins/ditty-news-ticker/includes/libs/fontawesome-6.4.0/webfonts/fa-regular-400.ttf:/assets/theme/vendor/fontawesome/webfonts/fa-regular-400.ttf"
  "/wp-content/plugins/ditty-news-ticker/includes/libs/fontawesome-6.4.0/webfonts/fa-regular-400.woff2:/assets/theme/vendor/fontawesome/webfonts/fa-regular-400.woff2"
  "/wp-content/plugins/ditty-news-ticker/includes/libs/fontawesome-6.4.0/webfonts/fa-solid-900.ttf:/assets/theme/vendor/fontawesome/webfonts/fa-solid-900.ttf"
  "/wp-content/plugins/ditty-news-ticker/includes/libs/fontawesome-6.4.0/webfonts/fa-solid-900.woff2:/assets/theme/vendor/fontawesome/webfonts/fa-solid-900.woff2"
  "/wp-content/plugins/ditty-news-ticker/includes/libs/fontawesome-6.4.0/webfonts/fa-v4compatibility.ttf:/assets/theme/vendor/fontawesome/webfonts/fa-v4compatibility.ttf"
  "/wp-content/plugins/ditty-news-ticker/includes/libs/fontawesome-6.4.0/webfonts/fa-v4compatibility.woff2:/assets/theme/vendor/fontawesome/webfonts/fa-v4compatibility.woff2"
  "/wp-content/plugins/post-carousel/public/assets/img/preloader.svg:/assets/theme/vendor/post-carousel/img/preloader.svg"
)
for entry in "${FILES[@]}"; do
  src="${entry%%:*}"
  dest="${entry#*:}"
  mkdir -p ".$(dirname "$dest")"
  if curl -fsSL "$ORIGIN$src" -o ".$dest"; then echo "ok   $dest"; else echo "miss $dest"; rm -f ".$dest"; fi
done
