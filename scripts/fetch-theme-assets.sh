#!/usr/bin/env bash
# Copies theme images that the saved page referenced but did not include
# (CSS backgrounds, avatar, footer logo, social icons, favicons) from the
# live server into ./public so the Astro build is fully self-hosted.
# Run once from the project root:  npm run fetch-assets
set -u
ORIGIN="${ORIGIN:-https://www.elitefitness.com}"
cd "$(dirname "$0")/../public"
FILES=(
  "/wp-content/themes/magazine-pro/images/247.png"
  "/wp-content/themes/magazine-pro/images/arraow.png"
  "/wp-content/themes/magazine-pro/images/arrow.png"
  "/wp-content/themes/magazine-pro/images/con-back-image.png"
  "/wp-content/themes/magazine-pro/images/content_bg01.jpg"
  "/wp-content/themes/magazine-pro/images/forum-posts-bg1.jpg"
  "/wp-content/themes/magazine-pro/images/forum-posts-bg2.jpg"
  "/wp-content/themes/magazine-pro/images/go.png"
  "/wp-content/themes/magazine-pro/images/header_top_bg.png"
  "/wp-content/themes/magazine-pro/images/header_topbg-01.png"
  "/wp-content/themes/magazine-pro/images/i.ico"
  "/wp-content/themes/magazine-pro/images/icon-direction-nav.png"
  "/wp-content/themes/magazine-pro/images/ima03.png"
  "/wp-content/themes/magazine-pro/images/list_icon_1.png"
  "/wp-content/themes/magazine-pro/images/red-arrow.png"
  "/wp-content/themes/magazine-pro/images/search_bg.png"
  "/wp-content/themes/magazine-pro/images/second-row-joint.jpg"
  "/wp-content/themes/magazine-pro/images/shadow.png"
  "/wp-content/themes/magazine-pro/images/avatar.jpg"
  "/wp-content/themes/magazine-pro/images/footer_logo.png"
  "/wp-content/plugins/social-media-widget/images/default/32/facebook.png"
  "/wp-content/plugins/social-media-widget/images/default/32/twitter.png"
  "/wp-content/uploads/2023/03/cropped-elite-logo-fav-512-32x32.jpg"
  "/wp-content/uploads/2023/03/cropped-elite-logo-fav-512-192x192.jpg"
  "/wp-content/uploads/2023/03/cropped-elite-logo-fav-512-180x180.jpg"
  "/wp-content/uploads/2016/02/elite-logo-w200px-h120px.png"
)
for f in "${FILES[@]}"; do
  mkdir -p ".$(dirname "$f")"
  if curl -fsSL "$ORIGIN$f" -o ".$f"; then echo "ok   $f"; else echo "miss $f"; rm -f ".$f"; fi
done
