"""
MediSentinel Application Icon Generator
Creates a multi-resolution Windows .ico file with Shield, Medical Cross & Telemetry Wave.
Uses pure Python standard library (no external dependencies required).
"""
import math
import os
import struct
import zlib


def create_png_rgba(width, height, draw_func):
    """Generate PNG bytes for an RGBA image using pure Python and zlib."""
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter byte: None
        for x in range(width):
            r, g, b, a = draw_func(x, y, width, height)
            raw_data.extend([int(r), int(g), int(b), int(a)])

    compressed = zlib.compress(bytes(raw_data), 9)

    def make_chunk(chunk_type, data):
        length = len(data)
        crc = zlib.crc32(chunk_type + data) & 0xFFFFFFFF
        return struct.pack(">I", length) + chunk_type + data + struct.pack(">I", crc)

    png_header = b"\x89PNG\r\n\x1a\n"
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    ihdr = make_chunk(b"IHDR", ihdr_data)
    idat = make_chunk(b"IDAT", compressed)
    iend = make_chunk(b"IEND", b"")

    return png_header + ihdr + idat + iend


def draw_medisentinel(x, y, w, h):
    """Draw a high-tech medical shield with health cross and glowing border."""
    nx = (x / (w - 1.0)) * 2.0 - 1.0
    ny = (y / (h - 1.0)) * 2.0 - 1.0

    # Top curved, bottom pointed V-shape
    if ny < -0.3:
        shield_top_limit = -0.85 + (nx * nx) * 0.2
        in_shield = ny >= shield_top_limit and abs(nx) <= 0.82
    else:
        t = (ny - (-0.3)) / 1.25
        allowed_w = 0.82 * (1.0 - (t ** 1.35))
        in_shield = abs(nx) <= max(0.0, allowed_w) and ny <= 0.92

    if not in_shield:
        return 0, 0, 0, 0

    if ny < -0.3:
        shield_top_inner = -0.75 + (nx * nx) * 0.2
        in_inner = ny >= shield_top_inner and abs(nx) <= 0.72
    else:
        t_in = (ny - (-0.3)) / 1.15
        allowed_w_in = 0.72 * (1.0 - (t_in ** 1.35))
        in_inner = abs(nx) <= max(0.0, allowed_w_in) and ny <= 0.82

    # Draw border (Emerald to Cyan Neon gradient)
    if not in_inner:
        grad_t = (ny + 1.0) / 2.0
        r = 16 * (1 - grad_t) + 6 * grad_t
        g = 220 * (1 - grad_t) + 182 * grad_t
        b = 130 * (1 - grad_t) + 220 * grad_t
        return r, g, b, 255

    # Inside Shield background
    bg_t = (ny + 1.0) / 2.0
    bg_r = int(10 + 15 * bg_t)
    bg_g = int(15 + 25 * bg_t)
    bg_b = int(30 + 40 * bg_t)

    # Medical Cross shape
    in_cross_h = abs(nx) <= 0.42 and abs(ny + 0.05) <= 0.12
    in_cross_v = abs(nx) <= 0.14 and abs(ny + 0.05) <= 0.42
    in_cross = in_cross_h or in_cross_v

    # Pulse / Heartbeat line
    pulse_y = 0.0
    if abs(nx) < 0.1:
        pulse_y = math.sin(nx * 30.0) * 0.25

    dist_to_pulse = abs(ny - 0.25 - pulse_y)
    is_pulse = dist_to_pulse <= 0.04 and abs(nx) <= 0.65

    if in_cross:
        dist_c = math.sqrt(nx * nx + (ny + 0.05) ** 2)
        if dist_c < 0.12:
            return 255, 255, 255, 255
        return 34, 197, 94, 255

    if is_pulse:
        return 56, 189, 248, 255

    return bg_r, bg_g, bg_b, 255


def generate_ico(output_path, sizes=(16, 32, 48, 64, 128, 256)):
    """Generate .ico file containing multiple resolution PNG frames."""
    frames = []
    for s in sizes:
        png_bytes = create_png_rgba(s, s, draw_medisentinel)
        frames.append((s, s, png_bytes))

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    header = struct.pack("<HHH", 0, 1, len(frames))
    offset = 6 + len(frames) * 16

    entries = []
    for w, h, data in frames:
        w_byte = 0 if w >= 256 else w
        h_byte = 0 if h >= 256 else h
        size_bytes = len(data)
        entry = struct.pack("<BBBBHHII", w_byte, h_byte, 0, 0, 1, 32, size_bytes, offset)
        entries.append(entry)
        offset += size_bytes

    with open(output_path, "wb") as f:
        f.write(header)
        for e in entries:
            f.write(e)
        for _, _, data in frames:
            f.write(data)

    print(f"[+] Successfully generated icon: {output_path} ({os.path.getsize(output_path)} bytes)")


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    generate_ico(os.path.join(script_dir, "assets", "app_icon.ico"))
    generate_ico(os.path.join(script_dir, "sih project", "frontend", "public", "app_icon.ico"))

