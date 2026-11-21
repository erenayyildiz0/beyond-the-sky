# Beyond the Sky — "Işıkları Söndür"

*The universe is closer than you think.*

Ankara'nın gerçek gece gökyüzünden başlayıp yıldızların arasından Andromeda galaksisine uçulan,
3 perdelik etkileşimli bir web deneyimi ve ardından süresiz bir Keşif modu. Ayrıntılar: [docs/SPEC.md](docs/SPEC.md).

## Kurulum

### Veri hattı (Python 3.11+)

```bash
cd pipeline
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python build.py --config config.yaml
pytest -q
```

### Web

```bash
cd web
npm install
npm run dev          # telefonda jiroskop testi: npm run dev:https
npm test
npm run build
```

## Bilinen sınırlamalar

_(M8'de SPEC §14'e göre doldurulacak.)_

## Kaynaklar ve lisanslar

_(M8'de SPEC §15'e göre doldurulacak.)_
