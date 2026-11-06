/**
 * NOCTIS — Brand Scrollytelling Configuration
 * Pure Vanilla JavaScript configuration object.
 * All section heights, chapter ranges, frame counts, frame paths and callout positions.
 */

window.NOCTIS_CONFIG = {
  // Brand Design Tokens
  tokens: {
    asphalt: '#07080A',
    graphite: '#121418',
    fog: '#8A8F98',
    bone: '#EDEAE4',
    xenon: '#CFE3FF',
    taillight: '#E1251B',
    hairline: 'rgba(237, 234, 228, 0.12)'
  },

  // Preloader settings
  preloader: {
    initialFramesToLoad: 40 // Hero frames 1–40 required before page reveal
  },

  // Hero Scrollytelling Section
  hero: {
    wrapperHeight: '600vh',
    frameCount: 448, // Real frame count from joined clips 1 + 2 + 3 (minus duplicate seam frames)
    desktopPathPattern: 'assets/frames/hero/frame_%s.webp',
    mobilePathPattern: 'assets/frames/hero-mobile/frame_%s.webp',
    lerpFactor: 0.15,
    speedMax: 118, // KM/H
    distanceMax: 4.2, // KM
    fadeToBlackStart: 0.95, // Canvas fades to solid black over the final 5%
    chapters: [
      {
        id: 'hero-ch1',
        start: 0.00,
        end: 0.12,
        hudNumber: '01/04',
        type: 'intro',
        title: 'NOCTIS',
        subtitle: 'The city is asleep.',
        hint: 'SCROLL TO WAKE IT'
      },
      {
        id: 'hero-ch2',
        start: 0.22,
        end: 0.40,
        hudNumber: '02/04',
        type: 'statement',
        line: "It doesn't need the city's light."
      },
      {
        id: 'hero-ch3',
        start: 0.50,
        end: 0.68,
        hudNumber: '03/04',
        type: 'statement',
        line: 'It brings its own.'
      },
      {
        id: 'hero-ch4',
        start: 0.80,
        end: 1.00,
        hudNumber: '04/04',
        type: 'outro',
        title: 'GT-E',
        specs: '0–100 KM/H 3.1S · 640 KM RANGE · DUAL MOTOR',
        linkText: 'Discover the GT-E',
        linkHref: '#lineup'
      }
    ]
  },

  // Section 2: Statement
  statement: {
    label: '02 — ENGINEERING',
    sentence: 'Every part was designed to disappear into one line of light.'
  },

  // Section 3: Dismantle Scrollytelling Section
  dismantle: {
    wrapperHeight: '350vh',
    frameCount: 150, // Real frame count of dismantle sequence
    desktopPathPattern: 'assets/frames/dismantle/frame_%s.webp',
    mobilePathPattern: 'assets/frames/dismantle-mobile/frame_%s.webp',
    lerpFactor: 0.15,
    sectionTitle: 'Look closer.',
    calloutThreshold: 0.70, // Callouts begin fading in after 70% scroll progress
    callouts: [
      {
        id: 'body',
        start: 0.70,
        dotX: 47, // % from left
        dotY: 34, // % from top
        labelX: 24, // % from left
        labelY: 26, // % from top
        tag: 'BODY',
        desc: 'Carbon composite monocoque'
      },
      {
        id: 'battery',
        start: 0.76,
        dotX: 52,
        dotY: 66,
        labelX: 62,
        labelY: 76,
        tag: 'BATTERY',
        desc: '110 kWh structural pack'
      },
      {
        id: 'drive',
        start: 0.82,
        dotX: 74,
        dotY: 58,
        labelX: 78,
        labelY: 42,
        tag: 'DRIVE',
        desc: 'Dual axial-flux motors, 680 kW'
      },
      {
        id: 'light',
        start: 0.88,
        dotX: 23,
        dotY: 53,
        labelX: 12,
        labelY: 64,
        tag: 'LIGHT',
        desc: 'Single-line LED signature'
      }
    ]
  },

  // Section 4: Lineup (Hover Accordion)
  lineup: {
    sectionNumber: '03 — THE LINEUP',
    sectionTitle: 'Five ways to drive the night.',
    defaultOpenIndex: 0,
    hoverDebounceMs: 80,
    models: [
      {
        id: 'gt-e',
        number: '01',
        name: 'GT-E',
        tagline: 'The grand tourer.',
        specs: [
          { label: 'RANGE', value: '640 km' },
          { label: '0–100 KM/H', value: '3.1 s' },
          { label: 'POWER', value: '680 kW' }
        ],
        image: 'assets/cars/gt-e.webp',
        alt: 'NOCTIS GT-E matte graphite grand tourer coupe',
        swatches: ['#121418', '#EDEAE4', '#07080A', '#2D3139']
      },
      {
        id: 's',
        number: '02',
        name: 'S',
        tagline: 'Four doors, no compromise.',
        specs: [
          { label: 'RANGE', value: '600 km' },
          { label: '0–100 KM/H', value: '3.6 s' },
          { label: 'POWER', value: '520 kW' }
        ],
        image: 'assets/cars/s.webp',
        alt: 'NOCTIS S four-door sport sedan in satin bone white',
        swatches: ['#EDEAE4', '#121418', '#383D45', '#1E232A']
      },
      {
        id: 'x',
        number: '03',
        name: 'X',
        tagline: 'Higher, never heavier.',
        specs: [
          { label: 'RANGE', value: '560 km' },
          { label: '0–100 KM/H', value: '4.2 s' },
          { label: 'POWER', value: '480 kW' }
        ],
        image: 'assets/cars/x.webp',
        alt: 'NOCTIS X SUV with coupe roofline in midnight blue',
        swatches: ['#0E1726', '#121418', '#202630', '#D5D8DC']
      },
      {
        id: 'r',
        number: '04',
        name: 'R',
        tagline: 'Built for the track.',
        specs: [
          { label: 'RANGE', value: '420 km' },
          { label: '0–100 KM/H', value: '2.4 s' },
          { label: 'POWER', value: '900 kW' }
        ],
        image: 'assets/cars/r.webp',
        alt: 'NOCTIS R two-seat track coupe with fixed rear wing in satin black with thin red accents',
        swatches: ['#0B0C0E', '#E1251B', '#22252B', '#EAEAEA']
      },
      {
        id: 'one',
        number: '05',
        name: 'ONE',
        tagline: 'The future, early.',
        specs: [
          { label: 'RANGE', value: 'Concept' },
          { label: '0–100 KM/H', value: 'Concept' },
          { label: 'POWER', value: 'Concept' }
        ],
        image: 'assets/cars/one.webp',
        alt: 'NOCTIS ONE concept hypercar in liquid silver',
        swatches: ['#D0D4DA', '#07080A', '#686E78', '#CFE3FF']
      }
    ]
  },

  // Section 5: Reserve
  reserve: {
    headline: 'Drive the night.',
    body: 'Production commences Autumn 2026. Handcrafted in limited allocations.',
    ctaText: 'RESERVE YOUR NOCTIS'
  }
};

