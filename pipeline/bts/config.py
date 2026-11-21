"""config.yaml → dataclass + doğrulama (SPEC §5.2)."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import yaml


@dataclass
class Location:
    name: str
    name_ablative: str
    lat_deg: float
    lon_deg: float
    height_m: float
    tz: str


@dataclass
class Observation:
    time: str = "auto"
    auto_local_hour: int = 21
    auto_search_days: int = 30
    max_moon_alt_deg: float = -10
    max_sun_alt_deg: float = -18


@dataclass
class Catalog:
    mag_limit: float = 7.0
    nodist_shell_ly: float = 3500


@dataclass
class Visibility:
    sqm_city: float = 18.0
    sqm_dark: float = 22.0
    glow_city_mag: float = 1.5
    glow_dark_mag: float = 0.5
    extinction_k: float = 0.25


@dataclass
class MilkyWay:
    source: str
    orientation_check_image: str
    out_sizes: list
    webp_quality: int = 88


@dataclass
class Earth:
    source: str
    out_sizes: list
    jpeg_quality: int = 85


@dataclass
class View:
    az_deg: float = 80
    horizon_screen_y: float = 0.80
    vfov_landscape_deg: float = 60
    vfov_portrait_deg: float = 90


@dataclass
class Voyager:
    ra_deg: float
    dec_deg: float
    dist_au: float


@dataclass
class Galaxy:
    key: str
    ra_deg: float
    dec_deg: float
    dist_ly: float
    draw_radius_ly: float
    incl_deg: float | None = None
    pa_deg: float | None = None


@dataclass
class Flight:
    path_constellation_hips: list
    path_target: str
    label_hips: list
    constellations: dict
    voyager1: Voyager
    galaxies: list


@dataclass
class Birth:
    mag_limit: float = 6.0
    max_ly: float = 160
    min_peak_alt_deg: float = 5
    up_alt_deg: float = 5
    prefer_up_tolerance_ly: float = 1.0
    first_year: int = 1900


@dataclass
class Config:
    location: Location
    observation: Observation
    catalog: Catalog
    visibility: Visibility
    milkyway: MilkyWay
    earth: Earth
    view: View
    flight: Flight
    birth: Birth
    output_dir: str
    preview_dir: str
    base_dir: Path = field(default_factory=Path.cwd)

    def path(self, rel: str) -> Path:
        """config.yaml'ın bulunduğu klasöre göreli yol."""
        return (self.base_dir / rel).resolve()


def load_config(path: str | Path) -> Config:
    path = Path(path)
    d = yaml.safe_load(path.read_text(encoding="utf-8"))
    fl = d["flight"]
    cfg = Config(
        location=Location(**d["location"]),
        observation=Observation(**d["observation"]),
        catalog=Catalog(**d["catalog"]),
        visibility=Visibility(**d["visibility"]),
        milkyway=MilkyWay(**d["milkyway"]),
        earth=Earth(**d["earth"]),
        view=View(**d["view"]),
        flight=Flight(
            path_constellation_hips=fl["path_constellation_hips"],
            path_target=fl["path_target"],
            label_hips=fl["label_hips"],
            constellations=fl["constellations"],
            voyager1=Voyager(**fl["voyager1"]),
            galaxies=[Galaxy(**g) for g in fl["galaxies"]],
        ),
        birth=Birth(**d["birth"]),
        output_dir=d["output_dir"],
        preview_dir=d["preview_dir"],
        base_dir=path.resolve().parent,
    )
    validate(cfg)
    return cfg


def validate(cfg: Config) -> None:
    loc, vis = cfg.location, cfg.visibility
    if not -90 <= loc.lat_deg <= 90 or not -180 <= loc.lon_deg <= 180:
        raise ValueError("location: enlem/boylam aralık dışında")
    if not vis.sqm_city < vis.sqm_dark:
        raise ValueError("visibility: sqm_city < sqm_dark olmalı")
    if not 0 < cfg.view.horizon_screen_y < 1:
        raise ValueError("view.horizon_screen_y 0 ile 1 arasında olmalı")
    if cfg.observation.time != "auto":
        from datetime import datetime
        t = datetime.fromisoformat(cfg.observation.time)
        if t.tzinfo is None:
            raise ValueError("observation.time saat dilimi ofseti içermeli (ör. +03:00)")
    if cfg.flight.path_target not in {g.key for g in cfg.flight.galaxies}:
        raise ValueError("flight.path_target galaxies içinde yok")
