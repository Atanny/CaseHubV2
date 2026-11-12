// Static configuration and tiny helpers for the File Name Generator.

export const san = (s) => (s||'').toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-');

export const nn  = (i) => String(i+1).padStart(2,'0');

export const EMPTY = { bizFilename:'', bizAlt:'', entityDesignation:'', accountNum:'', pages:[''], badges:[''], teamMembers:[''], menuNames:[''], pdfNames:[''] };

export const DEFAULT_FORMAT = {
  logo:'{nob}-logo', favicon:'{nob}-favicon', blogLogo:'{nob}-blog-logo',
  asst:'Asst_{nob}_logo', introWhy:'{nob}-intro-why-choose',
  recentReviews:'{nob}-recent-reviews', videoSplash:'{nob}-video',
  videoSplashPage:'{nob}-video-{page}-{nn}', waveZip:'{nob}-wave',
  waveAssist:'{nob}-wave-assistant', heroCust:'{nob}-hero-{page}',
  heroBi:'{nob}-hero-{page}', heroSlider:'{nob}-hero-slider-{nn}',
  galleryNon:'{nob}-gallery-{nn}', gallerySpec:'{nob}-{page}-gallery-{nn}',
  before:'{nob}-before-{nn}', after:'{nob}-after-{nn}',
  badge:'{nob}-badge-{badge}', team:'{nob}-{member}',
  menu:'{nob}-menu-{nn}', menuNamed:'{nob}-menu-{menu}-{nn}',
  pageContent:'{nob}-{page}-{nn}', callout:'{nob}-callout-{page}-{nn}',
  pdf:'{nob}-{pdf}-pdf',
};
