# Beyond the Sky

*The universe is closer than you think.*

**Beyond the Sky** is an interactive web experience about what city lights hide from us. It starts with the real night sky
over Ankara; turn off the lights and the stars, the Milky Way and Andromeda that were invisible all along appear. Then you take
off from the rooftop and fly past the Solar System, the nearby stars and the galaxies, all the way to the edge of the
observable universe.

Every star's position, distance and brightness is computed from real catalogue data. Anything illustrative is labelled as
such on screen.

🔭 **Live:** [erenayyildiz0.github.io/beyond-the-sky](https://erenayyildiz0.github.io/beyond-the-sky/) · On a phone, turn on
the gyroscope and point your phone at the sky for the best experience. Add `?lang=en` for the English interface.

## Features

### Three acts

1. **Lights Out:** 29 November 2026, 9 pm, Kızılay, Ankara. 111 stars visible from the city. Press and hold, the lights go
   out, and the 3,189 stars, the Milky Way and Andromeda you would see under a dark sky appear.
2. **The Journey:** A seamless take-off from the rooftop past Earth, the Moon, the Solar System, Voyager 1, nearby stars, the
   Milky Way, the Local Group, galaxy clusters, the cosmic web and the cosmic microwave background. Free flight, guided
   stops, a distance ruler, and "Fly here" on any object you tap. The light counter shows what was happening on Earth and in
   space when the light from that distance set out.
3. **Your Light:** Enter your birth year and it finds the star whose light set out the year you were born and arrives on Earth
   tonight, then takes you home to stand beneath it.

### Explore mode

Open-ended free exploration after the story: info cards for stars and galaxies, search, a quick "Go to" menu, 7 missions and
sharing. The **Sizes** screen puts objects side by side at true scale, from a pulsar to the M87* black hole.

### Your own sky

- **Use my location:** The sky is recomputed in the browser for the device's location. The first dark, moonless night is
  chosen, and light pollution is set as city centre, suburb or countryside.
- **From a photo:** Take a photo of the sky from inside the app. Press and hold, the lights in your photo go out, and the real
  stars and Milky Way visible in that direction that night replace the sky in your photo.

### Also

- Turkish and English interface.
- Terms such as magnitude, light-year or Sgr A* are underlined with dots; tap for a plain-language explanation.
- Reduced-motion support, adaptive resolution and presentation-remote support.
- Installable app (PWA): "Install as an app" on Android and desktop, "Add to Home Screen" on iPhone. Once opened, it starts
  offline; the data you've already seen is kept on the device.
- Phone-friendly memory use: Earth, Moon, planet and CMB textures are loaded only when you get close to them and released
  when you fly away.
- No external network requests at runtime.

## How it works

The project has two parts:

- **Data pipeline (`pipeline/`, Python):** The HYG star catalogue, NASA imagery and galaxy catalogues are processed with
  Astropy. It picks the observing night, computes horizon coordinates for every star and works out which ones are visible from
  the city and from a dark site. The results are written to `web/public/data/` as JSON, binary files and textures, and are
  committed to the repository.
- **Web app (`web/`, TypeScript + three.js):** Reads that data and renders the sky, the flight and the universe-scale layers in
  the browser. When the location changes, the sky is recomputed with astronomy-engine.

The visibility model (naked-eye limiting magnitude ↔ sky brightness, Schaefer 1990) is implemented with the same formulas in
Python, TypeScript and GLSL, and the three are tested against each other.

## Tech stack

| Layer | Tools |
|---|---|
| Web | TypeScript, three.js, GLSL, Vite, Vitest, astronomy-engine |
| Data pipeline | Python 3.11+, Astropy, NumPy, pandas, Pillow, OpenEXR, pytest |
| Deployment | GitHub Actions → GitHub Pages |

## Project structure

```
beyond-the-sky/
├── pipeline/            # Python data pipeline
│   ├── bts/             # catalogue, sky, visibility, flight path, galaxies, textures
│   ├── tests/
│   ├── build.py         # builds all data
│   └── config.yaml      # location, date, SQM and catalogue settings
├── web/                 # browser app
│   ├── src/
│   │   ├── app/         # director, input, gyroscope, camera
│   │   ├── scenes/      # acts and Explore
│   │   ├── render/      # sky, stars, planets, galaxies, cosmic web
│   │   ├── science/     # coordinates, visibility, constants, relocation
│   │   ├── content/     # info cards, glossary, history anchors, credits
│   │   ├── ui/          # panels and controls
│   │   └── i18n/        # Turkish and English strings
│   ├── public/data/     # pipeline output
│   └── tests/
├── web/pwa/sw.js        # service worker template (filled in at build time)
├── pipeline/make_icons.py  # generates the app icons in web/public/icons/
├── docs/                # design document, extras, demo script
└── .github/workflows/   # GitHub Pages deployment
```

## Getting started

### Web app

The pipeline output is in the repository, so you don't need Python to run the app. Node.js 24 is recommended.

```bash
cd web
npm install
npm run dev          # http://localhost:5173
npm run dev:https    # to test the gyroscope on a phone (same network, HTTPS)
npm test
npm run build        # output: web/dist
npm run preview      # serve the production build locally
```

### Data pipeline (optional)

To regenerate the data or change the settings (date, location, catalogue limit):

```bash
cd pipeline
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python build.py --config config.yaml
pytest -q
```

The required catalogue and image files are downloaded into `pipeline/raw/` on the first run (this folder is not committed).
If the Black Marble night image can't be downloaded, `build.py` tells you where to get it manually. The city sky brightness
(SQM) is `sqm_city` in `config.yaml`.

### Deployment

On every push to `main`, [`.github/workflows/pages.yml`](.github/workflows/pages.yml) runs the tests, builds the app and
deploys it to GitHub Pages. In the repository settings, **Settings → Pages → Source** must be set to **GitHub Actions**.

The build also writes `dist/sw.js`, the service worker. Its cache versions are derived from file contents, so users only
re-download the data when the data actually changes. The service worker is registered only in production builds, never in
`npm run dev`.

## Usage

### Keyboard

| Key | Action |
|---|---|
| `Space` (hold) | Turn off the lights |
| `Enter` / `PageDown` | Next stop |
| `Backspace` / `PageUp` | Previous stop |
| `B` | Look back |
| `F` | Full screen |
| `M` | Mute / unmute |
| `R` | Restart |
| `D` | Science panel |

### URL parameters

| Parameter | Effect |
|---|---|
| `?lang=en` | English interface |
| `?az=295` | Starting direction in Act 1 (degrees) |
| `?debug=1` | Science panel open |
| `?z=15.3` | Start Act 2 at this scale |
| `?goto=m31` | Go to a stop or object (for a star: `hip:27989`) |
| `?born=2007` | Try Act 3 with this birth year |
| `?explore=1` | Go straight to Explore mode |
| `?compare=1` | Open the Sizes screen |
| `?autoplay=1` | Play from start to finish on its own (for screen recording) |
| `?presenter=1` | Automatic transitions off; advance with a presentation remote |

Talk track and backup plan for a live demo: [docs/DEMO.md](docs/DEMO.md) (in Turkish).

## Privacy

Your birth year is kept in memory only; it is never stored or sent anywhere, and "Start over" clears it. Your phone's
orientation, your location and any photo you take never leave the device and are not saved. There are no external network
requests at runtime; fonts, data and images are all local. The only things stored on the device are whether you've watched the
story, which hints you've seen and which missions you've completed (no personal data). Sharing happens only when you choose to
share.

## Known limitations

- Visibility is an **estimate**: a Schaefer-based limiting-magnitude conversion, a fixed extinction coefficient, a single
  zenith SQM value and a heuristic horizon glow. What you actually see depends on the person, the weather and dark adaptation.
- The city SQM value comes from the 2015 light pollution atlas; today's sky may be brighter.
- Atmospheric refraction is ignored (at most ~0.6° near the horizon). Proper motion is not applied.
- The sky is computed for a single chosen moment; it is not live. A night with the Moon below the horizon is chosen. Time is
  frozen during the flight.
- Star distances come from Hipparcos parallaxes and are uncertain for distant stars. Stars without a measured distance are
  placed on a distant shell. Years are rounded according to distance.
- Star brightness is boosted artificially as you move away ("Exposure increased").
- Real star data covers only the roughly 15,600 stars visible to the naked eye (a few thousand light-years). The rest of the
  Milky Way and the other galaxies are illustrations; only their directions, distances and the Sun's position in the galaxy are
  real.
- In the Solar System, orbits are drawn as circles and the planets are enlarged. Voyager 1's direction is approximate.
- The Milky Way sky layer comes from a NASA SVS map; its visibility is set by a heuristic function of SQM. The Andromeda smudge
  is also heuristic.
- The Earth image is a 2016 composite satellite image.
- The birth-year star is the naked-eye star whose distance matches within ±1 light-year; distance measurement errors can shift
  this by a few months to a year.
- Gyroscope direction depends on the phone's compass (magnetic north, calibration) and can be off by a few degrees.
- Brightness comparisons on Explore cards are in visible light (V band) and rely on Hipparcos distances, so they carry large
  uncertainty for distant stars. Spectral type comes from HYG and is not shown for composite spectra.
- Explore includes only the ~15,600 naked-eye stars; the countless faint stars in between are missing from the journey.
- Stellar surfaces (granulation, spots, corona, prominences) and black-hole accretion discs are illustrative; size, colour,
  limb darkening and light bending are computed. On the Sizes screen, full geodesic ray tracing is used within 10 Rs and a
  weak-field approximation outside it.
- The cosmic web beyond 2MRS is illustrative; the crowding near home in 2MRS is a selection effect of its flux limit and is
  thinned out when seen from afar.
- Points in the asteroid and Kuiper belts are drawn much larger than the objects themselves.
- In the history anchors, the date of each event is sourced; the moment the light set out is matched to an event within ±6% on
  historical timescales and ±15% in deep time. On star cards they are shown only for stars closer than 300 light-years.
- Light pollution is not measured at other locations; it is estimated on the Bortle scale from the class you choose (city
  centre, suburb, countryside). Asteroid positions are for the Ankara night.
- Sky and light detection in a photo can be wrong; the mask and alignment can be adjusted by hand. The lights going out in
  your photo is illustrative.

## Sources and licences

### Data
- HYG Database v4.1 — David Nash / astronexus ([github.com/astronexus/HYG-Database](https://github.com/astronexus/HYG-Database)). Licence: CC BY-SA 4.0; the derived `sky.json` is also shared under CC BY-SA 4.0.
- Deep Star Maps 2020 (Milky Way) — NASA Goddard SVS, Ernie Wright; Gaia DR2: ESA/Gaia/DPAC ([svs.gsfc.nasa.gov/4851](https://svs.gsfc.nasa.gov/4851)).
- Black Marble 2016 (night; 500 m/pixel C1 tile for Ankara) — NASA Earth Observatory / Suomi NPP VIIRS. Blue Marble Next Generation, November 2004 (day). NASA SVS 4720 / LRO (Moon). NASA/JPL/Space Science Institute Cassini PIA07782 (Jupiter). NASA images are in the public domain.
- Light pollution: World Atlas 2015 (Falchi et al. 2016), [lightpollutionmap.info](https://www.lightpollutionmap.info).
- Mercury, Venus, Mars, Saturn, Uranus and Neptune textures: Solar System Scope (CC BY 4.0), compiled from NASA mission imagery (Neptune: Voyager 2, 1989).
- Rotation axes: IAU WGCCRE 2015 (Archinal et al. 2018). Radii and Saturn's rings: NASA Planetary / Saturnian Rings Fact Sheet.
- Asteroid belt, Jupiter trojans and Kuiper belt: orbital elements from the NASA/JPL Small-Body Database (SBDB Query API), propagated to the observing night with a two-body Kepler solution.
- Voyager 1: JPL Horizons (id −31); one light-day on 18 November 2026 ([svs.gsfc.nasa.gov/15120](https://svs.gsfc.nasa.gov/15120)).
- Distances of Andromeda (M31) and the Triangulum Galaxy (M33): NASA Hubble Messier catalogue.
- 2MRS galaxy catalogue (Huchra et al. 2012, ApJS 199, 26): distance from redshift, H0 = 70 km/s/Mpc. Cluster members (< 2 Mpc in projection, velocity difference < 2,000 km/s) are compressed to the cluster's published distance ("Fingers of God" correction, illustrative). Cluster distances: Virgo — Mei et al. 2007; Fornax — Blakeslee et al. 2009; others cz/H0 (Struble & Rood 1999).
- Cosmic microwave background: ESA and the Planck Collaboration, CC BY-SA 3.0 IGO.
- Stellar radii: Sirius A — Liebert et al. 2005; Arcturus — Ramírez & Allende Prieto 2011; Aldebaran — Richichi & Roccatagliata 2005; Rigel — Moravveji et al. 2012; Betelgeuse — Joyce et al. 2020; Proxima — Boyajian et al. 2012; VY CMa — Wittkowski et al. 2012; others computed with Stefan–Boltzmann (bolometric correction: Flower 1996 / Torres 2010).
- Compact objects: PSR J0030+0451 (Riley et al. 2019, ApJL 887, L21), Cygnus X-1 (Miller-Jones et al. 2021, Science 371, 1046), Sirius B (Bond et al. 2017, ApJ 840, 70), Sgr A* (GRAVITY Collaboration 2022, A&A 657, L12; position Reid & Brunthaler 2004, ApJ 616, 872), orbit of S2 (GRAVITY Collaboration 2020, A&A 636, L5), M87* (EHT Collaboration 2019, ApJL 875, L6). Stars: TRAPPIST-1 (Agol et al. 2021), Alpha Centauri A (Kervella et al. 2017), Deneb (Schiller & Przybilla 2008), Antares (Ohnaka et al. 2013 + van Leeuwen 2007).

### Models and constants
- NELM–SQM conversion: Schaefer, B. E. (1990), PASP 102, 212. Airmass: Kasten & Young (1989), Applied Optics 28, 4735.
- B−V → temperature: Ballesteros (2012), EPL 97, 34008. Temperature → colour: Tanner Helland (2012).
- Sun's distance to the Galactic Centre: GRAVITY Collaboration (2019), ~8.18 kpc. Galactic frame: Astropy `Galactic` (IAU 1958).
- Milky Way dimensions: Bland-Hawthorn & Gerhard 2016; bar angle Wegg et al. 2015. Galaxy appearances are illustrative; position, orientation and size are real.
- Cosmology: Planck Collaboration 2020 (A&A 641, A6), flat ΛCDM, H0 = 67.66, Ωm = 0.3111; large-scale homogeneity Scrimgeour et al. 2012.
- Absolute V magnitude of the Sun 4.83 (Binney & Merrifield 1998). Coronal brightness profile Baumbach (1937). Black-hole images: Schwarzschild null geodesics.

### Fun facts

[ESA: Sirius B](https://www.esa.int/Science_Exploration/Space_Science/Weighing_the_Dog_Star_s_companion) · [NASA: Sirius B](https://science.nasa.gov/missions/hubble/astronomers-use-hubble-to-weigh-dog-stars-companion/) · [NASA: Vega](https://science.nasa.gov/solar-system/summer-triangle-corner-vega/) · [NASA APOD: When Vega is North](https://apod.nasa.gov/rjn/apod/ap150508.html) · [NASA: Betelgeuse](https://science.nasa.gov/missions/hubble-space-telescope/hubble-finds-that-betelgeuses-mysterious-dimming-is-due-to-a-traumatic-outburst) · [NASA: Pioneer 10](https://science.nasa.gov/missions/pioneer/pioneer-10-sends-last-signal/) · [Britannica: Algol](https://www.britannica.com/place/Algol-star) · [Sky & Telescope: Algol](https://skyandtelescope.org/stargazing-and-observing/behold-algol-star-secret/) · [NASA SVS: Pleiades](https://svs.gsfc.nasa.gov/14928) · [NASA: Messier 45](https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-45) · [ESA: Milky Way–Andromeda](https://www.esa.int/Science_Exploration/Space_Science/Hubble_and_Gaia_revisit_fate_of_our_galaxy) · [NASA: Voyager 1 and Gliese 445](https://www.nasa.gov/image-article/reaching-stars)

### History anchors

Sources for the events are in `web/src/content/history.ts` (NASA, ESA, Britannica, UNESCO, peer-reviewed papers).
Images: NASA (public domain; Apollo 8 and 11, STS-31, Voyager, the Webb launch, the Pale Blue Dot, Pluto, Uranus, Neptune,
Chicxulub, Shoemaker-Levy 9, SN 1987A, Kepler's supernova remnant, Hubble XDF; artist's impressions: protoplanetary disc,
Milky Way), ESA and Planck (CMB, CC BY-SA 3.0 IGO), Wikimedia Commons (public domain: Bayeux Tapestry, Fausto Zonaro, Rohan
Master, Copernicus 1543, Galileo 1610, Newton 1687; CC0: The Metropolitan Museum of Art; CC BY-SA 3.0: Teomancimit, Göbeklitepe).

### Software

Astropy (BSD-3), NumPy (BSD-3), three.js (MIT), astronomy-engine (MIT), Vite (MIT), Vitest (MIT), OpenEXR (BSD-3). Fonts (Fraunces, Inter): SIL Open Font License.

## Documentation

These documents are in Turkish:

- [docs/SPEC.md](docs/SPEC.md): design document (data, science, scenes, acceptance criteria)
- [docs/EXTRAS.md](docs/EXTRAS.md): features added later and deviations from the design
- [docs/DEMO.md](docs/DEMO.md): live demo talk track and backup plan
