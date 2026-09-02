import csv
import json
import sqlite3
import struct
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MISSION = Path(__file__).resolve().parents[1]
GPKG = ROOT / "data" / "raw" / "gadm41_VNM.gpkg"
COMMUNES = MISSION / "public" / "data" / "commune_master.csv"
OUTPUT = MISSION / "public" / "data" / "muong_ang_communes.geojson"


def read_uint(data, offset, endian):
    return struct.unpack_from(endian + "I", data, offset)[0], offset + 4


def read_double(data, offset, endian):
    return struct.unpack_from(endian + "d", data, offset)[0], offset + 8


def parse_point(data, offset, endian):
    x, offset = read_double(data, offset, endian)
    y, offset = read_double(data, offset, endian)
    return [x, y], offset


def parse_linestring(data, offset, endian):
    count, offset = read_uint(data, offset, endian)
    coords = []
    for _ in range(count):
      point, offset = parse_point(data, offset, endian)
      coords.append(point)
    return coords, offset


def parse_polygon(data, offset, endian):
    ring_count, offset = read_uint(data, offset, endian)
    rings = []
    for _ in range(ring_count):
      ring, offset = parse_linestring(data, offset, endian)
      rings.append(ring)
    return rings, offset


def parse_wkb(data, offset=0):
    byte_order = data[offset]
    endian = "<" if byte_order == 1 else ">"
    offset += 1
    geom_type, offset = read_uint(data, offset, endian)

    if geom_type == 3:
      return "Polygon", parse_polygon(data, offset, endian)[0]

    if geom_type == 6:
      polygon_count, offset = read_uint(data, offset, endian)
      polygons = []
      for _ in range(polygon_count):
        nested_type, polygon = parse_wkb(data, offset)
        if nested_type != "Polygon":
          raise ValueError(f"Expected Polygon inside MultiPolygon, got {nested_type}")
        polygons.append(polygon)
        nested_size = wkb_size(data, offset)
        offset += nested_size
      return "MultiPolygon", polygons

    raise ValueError(f"Unsupported WKB geometry type: {geom_type}")


def wkb_size(data, offset=0):
    byte_order = data[offset]
    endian = "<" if byte_order == 1 else ">"
    start = offset
    offset += 1
    geom_type, offset = read_uint(data, offset, endian)

    if geom_type == 3:
      rings, offset = read_uint(data, offset, endian)
      for _ in range(rings):
        points, offset = read_uint(data, offset, endian)
        offset += points * 16
      return offset - start

    if geom_type == 6:
      polygons, offset = read_uint(data, offset, endian)
      for _ in range(polygons):
        offset += wkb_size(data, offset)
      return offset - start

    raise ValueError(f"Unsupported WKB geometry type: {geom_type}")


def geometry_blob_to_geojson(blob):
    data = bytes(blob)
    if data[:2] != b"GP":
      return parse_wkb(data)

    flags = data[3]
    envelope_indicator = (flags >> 1) & 0b111
    envelope_sizes = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}
    wkb_offset = 8 + envelope_sizes[envelope_indicator]
    return parse_wkb(data, wkb_offset)


def main():
    with COMMUNES.open("r", encoding="utf-8-sig", newline="") as handle:
      master = list(csv.DictReader(handle))
    commune_by_gid = {row["gadm_id"]: row for row in master}
    placeholders = ",".join("?" for _ in commune_by_gid)

    query = f"""
      select GID_3, NAME_3, TYPE_3, ENGTYPE_3, geom
      from ADM_ADM_3
      where GID_3 in ({placeholders})
      order by GID_3
    """

    features = []
    with sqlite3.connect(GPKG) as con:
      for gid, name, admin_type, english_type, geom in con.execute(query, list(commune_by_gid)):
        geometry_type, coordinates = geometry_blob_to_geojson(geom)
        master_row = commune_by_gid[gid]
        features.append({
          "type": "Feature",
          "properties": {
            "gadm_id": gid,
            "name": master_row["commune_old"],
            "name_gadm": name,
            "admin_type": master_row["admin_type"] or admin_type,
            "engtype_gadm": english_type,
            "boundary_source": master_row["boundary_source"]
          },
          "geometry": {
            "type": geometry_type,
            "coordinates": coordinates
          }
        })

    missing = sorted(set(commune_by_gid) - {feature["properties"]["gadm_id"] for feature in features})
    if missing:
      raise SystemExit(f"Missing commune geometries: {', '.join(missing)}")

    OUTPUT.write_text(
      json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False, separators=(",", ":")),
      encoding="utf-8"
    )
    print(f"Wrote {len(features)} commune boundaries to {OUTPUT}")


if __name__ == "__main__":
    main()
