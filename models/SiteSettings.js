const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  // Branding
  siteName: { type: String, default: 'Technophiles' },
  tagline: { type: String, default: 'GCETTB Official Tech Club' },
  logoNavUrl: { type: String, default: '' },     // navbar logo URL
  logoFaviconUrl: { type: String, default: '' }, // favicon URL
  accentColor: { type: String, default: '#39FF14' },

  // SEO
  seoTitle: { type: String, default: 'Technophiles - GCETTB Official Tech Club' },
  seoDescription: { type: String, default: 'Join Technophiles - the official tech club of GCETTB. Events, Hackathons, Courses, Live Classes and more.' },
  seoKeywords: { type: String, default: 'technophiles, gcettb, tech club, events, hackathon, coding, courses' },
  ogImage: { type: String, default: '' },          // Open Graph / social share image
  twitterHandle: { type: String, default: '' },
  canonicalUrl: { type: String, default: '' },

  // Google / Analytics
  googleAnalyticsId: { type: String, default: '' },
  googleSiteVerification: { type: String, default: '' },

  // Footer
  footerText: { type: String, default: '' },
  collegeWebsite: { type: String, default: '' },

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Singleton — always use findOne / findOneAndUpdate
const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
module.exports = SiteSettings;
