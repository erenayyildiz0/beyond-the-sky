"""CLI: indir → hesapla → yaz → önizle (SPEC §5)."""
import argparse

from bts.config import load_config


def main() -> None:
    ap = argparse.ArgumentParser(description="Beyond the Sky veri hattı")
    ap.add_argument("--config", default="config.yaml")
    args = ap.parse_args()
    cfg = load_config(args.config)
    print(f"Yapılandırma okundu: {cfg.location.name}")


if __name__ == "__main__":
    main()
