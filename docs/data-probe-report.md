# M0 Data Probe Report — Helsinki / Kruununhaka

**Probed at:** 2026-11-13T04:11:20Z (GitHub Actions `ubuntu-latest`, Node v22.23.4)  
**Workflow:** [M0 probe](https://github.com/chihimlau/helsinki-8bit/actions/workflows/m0-probe.yml) on `main` (v5 / probe v2)  
**Raw artifact (local, gitignored):** `areas/helsinki-kruununhaka/raw/m0-probe-actions/`  
**Earlier local attempt (2026-11-11):** company PC could not reach `kartta.hel.fi` / Overpass — see connectivity dump under `raw/connectivity/`. Cloud probe below supersedes that for source decisions.

## One-sentence conclusion

**Helsinki 3D CityGML (LoD1/LoD2 WFS) cannot be the primary building source right now** (documented WFS returns HTTP 404); use **Helsinki avoindata 2D building footprints + register attributes** (`Rakennukset_alue_rekisteritiedot`) for footprints / RATU / VTJ-PRT / floor count, with **OSM** for roads/parks/water and as building fill-in.

## Numbers actually retrieved (Senate Square ~300×300 m)

Bbox (EPSG:3879 GK25, easting/northing): `25497224,6672847` → `25497502,6673181` (from WGS84 ≈ 24.9500–24.9550 E, 60.1685–60.1715 N).

| Source | Buildings in bbox | Height / floors | Notes |
|--------|-------------------|-----------------|-------|
| Helsinki 3D CityGML WFS | **0 (not fetched)** | n/a | GetCapabilities **404** |
| avoindata `Rakennukset_alue` | **39** | no height fields | RATU/VTJ-PRT present (~95%) |
| avoindata `Rakennukset_alue_rekisteritiedot` | **39** | `i_kerrlkm` present on **36/39** (3 missing); no metre height | same footprints + register; `i_kerrosala` is floor **area**, not height |
| OSM Overpass (ways+relations `building=*`) | **45** (36 ways + 9 relations) | `height` **2**; `building:levels` **38** | 7 more than avoindata count (multipart / coverage difference) |

**LoD2 ratio:** **unknown / n/a** — CityGML LoD2 was never returned.  
**CityGML missing-height count:** **n/a**.

### EPSG:3879 WFS bbox axis order

| Variant | Result |
|---------|--------|
| **A_xy_EPSG3879** (`easting,northing` + `EPSG:3879`) | **Works** — first hit: `numberMatched=39` for both layers; used for GetFeature |
| B / C / D (`northing,easting` / URN / EPSG:4326) | **Not tested in this run** — script stopped after first working variant |

**Recorded working order for this GeoServer WFS: easting, northing (`x,y`) with `EPSG:3879`.**

## Connectivity / endpoint status (Actions)

| Target | Result |
|--------|--------|
| `https://kartta.hel.fi/3d/citydb-wfs/wfs` GetCapabilities | **404** HTML |
| `https://kartta.hel.fi/3d/` download page | **200**; page text did **not** match “disabled / poissa käytöstä” heuristics |
| `https://kartta.hel.fi/ws/geoserver/avoindata/wfs` GetCapabilities | **fail once** (`ECONNRESET`); later DescribeFeatureType / GetFeature **200** |
| avoindata.suomi.fi CKAN (`helsingin-3d-rakennukset`, `helsingin-pintamalli`) | **403** — no LoD1 package metadata/size from this environment |
| Overpass `overpass-api.de` | **200** on first attempt (~39 s) |

## Field inspection (avoindata register layer)

Present and useful:

- **RATU** (`ratu`) — ~95% non-empty  
- **VTJ-PRT** (`vtj_prt` / `c_vtj_prt`) — ~95%  
- **Floor count** (`i_kerrlkm`) — 36/39 non-empty → estimate height ≈ `i_kerrlkm * 3.2` m when no metre height  
- Geometry in **EPSG:3879** when requested with `srsName=EPSG:3879`  
- Address fields (`katunimi_suomi`, `osoitenumero`, …)

Not present in these layers:

- CityGML **GMLID**  
- True building **height in metres**  
- **LoD1 / LoD2** roof geometry  

## Helsinki Cathedral

From avoindata `Rakennukset_alue_rekisteritiedot` (nearest church to landmark approx 60.1704, 24.9522):

| Field | Value |
|-------|--------|
| Landmark id (repo) | `hel-helsinki-cathedral` |
| avoindata feature `id` | **740432** |
| `tyyppi` | `Kirkko` |
| RATU | **211** |
| VTJ-PRT | **103027179C** |
| Address | Hallituskatu 7 |
| `i_kerrlkm` | 3 (underestimates real cathedral height — landmark will need special handling later) |
| `i_kerrosala` | 3528 |
| `c_rakennusluokka` | 0730 |
| Note | Another `Kirkko` in bbox is RATU 223 (Rauhankatu 18, small) — not the Cathedral |

**OSM object id for the Cathedral:** not resolved in this artifact (Overpass response tags/ids were not saved to disk; only aggregate counts). Re-query by name/`tourism`/`amenity=place_of_worship` in M1 or a short follow-up probe.

## Suggested merge approach (based on this probe)

1. **Buildings primary:** Helsinki avoindata `Rakennukset_alue_rekisteritiedot` footprints (EPSG:3879), id crosswalk via RATU / VTJ-PRT (not CityGML GMLID until CityGML returns).  
2. **Height:** `i_kerrlkm * 3.2` when set; else OSM `height` / `building:levels`; else default — count each bucket in pipeline stats.  
3. **OSM:** roads, parks, water, trees always; buildings only where avoindata missing or for multipart landmarks; keep `osmId` by footprint overlap, do not double-draw.  
4. **Roofs:** flat extrusion only until CityGML LoD2 or another 3D source is reachable.  
5. **Landmarks:** pin Cathedral to RATU `211` / VTJ-PRT `103027179C`; override height/appearance in M4.

## Fallback if avoindata also fails later

Use OSM buildings for the MVP bbox (already proven: 45 features, levels mostly filled). Document source mix in `?debug=1`.

## Problems and limits

1. **Helsinki 3D CityGML WFS is down/moved (404)** — cannot get LoD1/LoD2 meshes or GMLIDs from the documented URL.  
2. **avoindata.suomi.fi LoD1 packages returned 403** from Actions — cannot confirm KMZ/SKP size/availability this run.  
3. **No metre heights** in avoindata layers; floor count understates landmarks (Cathedral = 3 floors in register).  
4. GetCapabilities flaky (`ECONNRESET`) even when GetFeature works — probe/pipeline should tolerate that.  
5. Local company PC still blocked; all live fetches must stay on Actions / Cloud Agent.  
6. Axis-order variants B–D not re-validated after A succeeded.

## Re-run

```text
# GitHub → Actions → M0 probe → Run workflow (branch main)
# or after installing gh: gh workflow run m0-probe.yml --ref main
```

Artifact name: `m0-probe-output` → expect `m0-probe.json`, `m0-probe.md`, feature GeoJSON samples.
