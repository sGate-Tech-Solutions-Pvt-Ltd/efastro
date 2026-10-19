// Replaces the inline onclick handlers and the 260 KB autoptimize bundle with
// the few behaviours the homepage actually uses.

const sidenav = document.getElementById("mySidenav");
const main = document.getElementById("main");

function openNav(e: Event) {
  e.stopPropagation();
  if (sidenav) sidenav.style.width = "230px";
  if (main) main.style.marginLeft = "230px";
  document.body.style.background = "grey";
}
function closeNav() {
  if (sidenav) sidenav.style.width = "0";
  if (main) main.style.marginLeft = "0";
  document.body.style.background = "white";
}

document.querySelectorAll("[data-open-nav]").forEach((el) => el.addEventListener("click", openNav));
document.querySelectorAll("[data-close-nav]").forEach((el) =>
  el.addEventListener("click", (e) => { e.preventDefault(); closeNav(); })
);
sidenav?.addEventListener("click", (e) => e.stopPropagation());
document.body.addEventListener("click", closeNav);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeNav(); closeLead(); } });

// Header search panel
const searchToggle = document.querySelector<HTMLButtonElement>("[data-search-toggle]");
const searchBox = document.getElementById("site-search");
searchToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = searchBox?.classList.toggle("is-open") ?? false;
  searchToggle.setAttribute("aria-expanded", String(open));
  if (open) searchBox?.querySelector("input")?.focus();
});
searchBox?.addEventListener("click", (e) => e.stopPropagation());

// AWeber lead popup
const light = document.getElementById("light");
const fade = document.getElementById("fade");
function closeLead() { light?.classList.remove("is-open"); fade?.classList.remove("is-open"); }
document.querySelectorAll("[data-open-lead]").forEach((el) =>
  el.addEventListener("click", (e) => { e.preventDefault(); light?.classList.add("is-open"); fade?.classList.add("is-open"); })
);
document.querySelectorAll("[data-close-lead]").forEach((el) =>
  el.addEventListener("click", (e) => { e.preventDefault(); closeLead(); })
);

// Back to top
const toTop = document.getElementById("sp-smart-post-back-to-top-btn");
const onScroll = () => toTop?.classList.toggle("is-visible", window.scrollY > 400);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();
const goTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
toTop?.addEventListener("click", goTop);
toTop?.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goTop(); } });
