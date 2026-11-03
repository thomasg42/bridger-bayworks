// Single source of truth for every fact the site prints. Edit here, then `node build.mjs`.
// Status of each fact lives in ../context/product-facts.md. Never add an UNCONFIRMED fact.

export const SITE = {
  name: 'Bridger Bayworks DIY Garage',
  shortName: 'Bridger Bayworks',
  legalName: 'Bridger Bayworks DIY Garage LLC',
  owner: 'Max',

  // PREVIEW address until Max picks a domain. At launch: set url to the real domain,
  // set customDomain (writes docs/CNAME), set launched: true, rebuild.
  url: 'https://bridgerbayworks.com',
  customDomain: 'bridgerbayworks.com',
  // false = every page is noindex and robots.txt disallows crawling, so the preview
  // can never compete with the real domain in Google.
  launched: false,

  phone: { display: '406-233-6598', e164: '+14062336598' },
  email: 'BridgerBayworks@gmail.com',
  address: {
    street: '201 S Weaver St, Building A',
    city: 'Belgrade',
    region: 'MT',
    zip: '59714',
    country: 'US',
  },
  mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=201+S+Weaver+St+Building+A+Belgrade+MT+59714',
  hoursNote: '7 days a week. Hours may vary.',
  social: {
    instagram: { handle: '@bridgerbayworks', url: 'https://www.instagram.com/bridgerbayworks/' },
    facebook: { handle: '@BridgerBayworks', url: 'https://www.facebook.com/BridgerBayworks' },
  },
  // Towns a customer would drive in from. Belgrade is the shop; the rest are nearby.
  areaServed: ['Belgrade', 'Bozeman', 'Manhattan', 'Three Forks', 'Four Corners', 'Gallatin Gateway'],

  // Where the reserve form POSTs. Empty = no backend yet: the form hands the visitor a
  // prefilled text/email to Max instead, so no request is ever silently dropped.
  leadEndpoint: 'https://tggai.app.n8n.cloud/webhook/bridger-bayworks-lead',

  // STATED by Max (text 2026-10-01). Publishing needs his OK. showPrices: false turns
  // every price on the site into "Ask us" without touching any page.
  showPrices: true,
  rates: {
    lift: 40,          // lift / shop time, per hour
    liftRegular: 35,   // per hour, when consistently over regularHours per month
    regularHours: 15,
    tools: 5,          // tool access, per hour
    impact: 5,         // 3/8" & 1/2" impact guns, per hour
    oilDisposal: 0,    // used oil disposal: free (Max, 2026-10-01; Thomas kept it free 2026-11-02)
    coolantDisposal: 5,
  },

  // "What's the job?" presets on the reserve form (Thomas, 2026-11-02). hours = the work itself;
  // bayHours = what goes on Max's calendar. Oil change: 1 hour max. Wheel bearings: a 5 hr job
  // plus 1 hr so nobody is rushed. Any other job: no time picker, we call them to set one.
  jobs: [
    { id: 'oil-change', label: 'Oil change', hours: 1, bayHours: 1 },
    { id: 'wheel-bearings', label: 'Wheel bearings', hours: 5, bayHours: 6 },
  ],

  // Online booking straight onto Max's Google Calendar, which n8n reads and writes
  // (Thomas, 2026-11-02). The site offers only times with nothing else on that calendar.
  booking: {
    timeZone: 'America/Denver',
    openHour: 9,         // 9 AM. Thomas: "I think it's 9 till 6". Confirm with Max.
    closeHour: 18,       // 6 PM: a booking must end by then
    firstDay: 2,         // tomorrow is already set, so on Monday the first bookable day is Wednesday
    days: 14,            // how far ahead the picker reaches
    diagnosticsHours: 1, // a diagnosis books one hour of shop time
    availabilityEndpoint: 'https://tggai.app.n8n.cloud/webhook/bridger-bayworks-availability',
  },

  // Sitemap lastmod + footer year.
  updated: '2026-11-02',
  // Bump on every deploy so phones don't keep a stale stylesheet/script.
  assetVersion: '20261102-booking',
};
