"""Copy the frozen map without the comparison rankings used only by Analysis."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    source = (ROOT / "site/data.js").read_text()
    data = json.loads(source.removeprefix("window.MEOW_ATLAS=").strip().removesuffix(";"))
    for key in ("featureOrder", "mapOrder"):
        del data[key]
    target = ROOT / "site/experience-data.js"
    target.write_text("window.MEOW_ATLAS=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(f"Experience data: {target.stat().st_size:,} bytes; frozen coordinates and metadata preserved")


if __name__ == "__main__":
    main()
