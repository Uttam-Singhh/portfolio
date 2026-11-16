/* ─────────────────────────────────────────────────────────────
   EDIT ME — everything the site says about you lives in this file.
   Change the text below, save, refresh. Nothing else needs touching.
   ───────────────────────────────────────────────────────────── */
window.PORTFOLIO = {
  // Your name: used for the page title, the logo letter and the copyright line.
  name: 'Uttam',

  // Optional large headline on the first screen. Leave '' for none.
  headline: '',

  // The two pictures above your name on the first screen: your anon avatar and you.
  // Set either to '' to hide it.
  faces: {
    anon: 'images/anon.jpg',
    real: 'images/uttam.jpg', // the selfie is 'images/uttam-selfie.jpg'
  },

  // The line under your name cycles through these.
  roles: ['polymath · engineer', 'crypto · AI · payments', 'loves monitoring the situations', 'techno optimistic'],

  // The one-line description on the first screen.
  tagline: 'Uttam is a polymath based in New York City building in crypto and AI',

  // Small status chip in the top-right corner.
  status: 'Open to ideas',

  about: {
    // Wrap words in *asterisks* to make them glow.
    statement:
      'A *polymath* based in New York City building in crypto, AI, and *payments*.',
    facts: [
      { label: 'Building in', value: 'Crypto · AI · Payments' },
      { label: 'Based in', value: 'New York City' },
    ],
  },

  // IMAGES: drop files into the images/ folder next to index.html, then put the
  // path in an `image` field, e.g. image: 'images/my-project.jpg'.
  // Landscape photos work best (they are cropped to 16:10). Leave it '' for a placeholder.

  // Three is the sweet spot. Add or remove freely.
  projects: [
    {
      title: 'Advance Faucet',
      blurb: 'Open source on GitHub.',
      tags: ['Open source'],
      year: '',
      image: '',
      link: 'https://github.com/Uttam-Singhh/Advance-Faucet',
    },
    {
      title: 'ETH Empower',
      blurb: 'Open source on GitHub.',
      tags: ['Open source'],
      year: '',
      image: '',
      link: 'https://github.com/Uttam-Singhh/ETHEmpower',
    },
    {
      title: 'Blockcompass',
      blurb: 'Open source on GitHub.',
      tags: ['Open source'],
      year: '',
      image: '',
      link: 'https://github.com/yorku-ease/blockcompass',
    },
  ],

  // Talks, panels, podcasts, press. Add as many as you like; the row scrolls sideways.
  // Delete everything between the [ ] to hide the section.
  talks: [
    { title: 'NFT NYC', event: 'Speaker', year: '', image: '', link: 'https://www.linkedin.com/posts/uttam-singh_nyc-timessquare-newyork-activity-7053264464799772672-hJdl' },
    { title: 'EthCC', event: 'Speaker', year: '', image: '', link: 'https://www.linkedin.com/feed/update/urn:li:activity:7075355263305736195' },
    { title: 'ETH Oxford', event: 'Speaker', year: '', image: '', link: 'https://www.linkedin.com/posts/uttam-singh_web3-blockchain-crypto-activity-7173606626359132160-ZK9F' },
  ],

  contact: {
    headline: "Let's build what's *next*.",
    email: 'uttamkhanduja@yahoo.in',
    socials: [
      { label: 'X', url: 'https://twitter.com/uttam_singhk' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/uttam-singh/' },
      { label: 'GitHub', url: 'https://github.com/Uttam-Singhh' },
      { label: 'YouTube', url: 'https://www.youtube.com/channel/UCKbY9fHz4y_tt2lWSe9bUJw' },
      { label: 'Linktree', url: 'https://linktr.ee/uttam_singhk' },
    ],
  },
};
