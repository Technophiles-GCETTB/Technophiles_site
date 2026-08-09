const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const SiteSettings = require('../models/SiteSettings');
const { clearSettingsCache } = require('../middleware/injectUser');
const fs = require('fs');
const path = require('path');

const isAdmin = requireRole('superadmin');

// GET /admin/settings/seo
router.get('/seo', authenticate, isAdmin, async (req, res) => {
  try {
    const settings = await SiteSettings.findOne() || {};
    res.render('admin/seo', { title: 'SEO & Branding Settings', settings, user: req.user, query: req.query });
  } catch (err) {
    res.redirect('/admin');
  }
});

// POST /admin/settings/seo — save SEO settings
router.post('/seo', authenticate, isAdmin, async (req, res) => {
  try {
    const {
      siteName, tagline, seoTitle, seoDescription, seoKeywords,
      ogImage, twitterHandle, canonicalUrl,
      googleAnalyticsId, googleSiteVerification,
      footerText, collegeWebsite, accentColor
    } = req.body;

    await SiteSettings.findOneAndUpdate(
      {},
      {
        siteName, tagline, seoTitle, seoDescription, seoKeywords,
        ogImage, twitterHandle, canonicalUrl,
        googleAnalyticsId, googleSiteVerification,
        footerText, collegeWebsite,
        accentColor: accentColor || '#39FF14',
        updatedBy: req.user._id,
      },
      { upsert: true, new: true }
    );

    clearSettingsCache();
    res.redirect('/admin/settings/seo?msg=saved');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/settings/seo?error=1');
  }
});

// POST /admin/settings/logos — save logo URLs (stored as setting, NOT file upload)
router.post('/logos', authenticate, isAdmin, async (req, res) => {
  try {
    const { logoNavUrl, logoFaviconUrl } = req.body;
    await SiteSettings.findOneAndUpdate(
      {},
      { logoNavUrl, logoFaviconUrl, updatedBy: req.user._id },
      { upsert: true, new: true }
    );
    clearSettingsCache();
    res.redirect('/admin/settings/seo?msg=logos_saved');
  } catch (err) {
    res.redirect('/admin/settings/seo?error=1');
  }
});

module.exports = router;
