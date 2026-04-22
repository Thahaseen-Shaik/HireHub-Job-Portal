"""Quick test for the /upload-image endpoint using synthetic PIL images."""
import io, json, numpy as np, urllib.request
from PIL import Image

def make_image(kind):
    data = np.zeros((800, 600, 3), dtype=np.uint8)
    if kind == "resume":
        data.fill(255)                               # white bg
        for i in range(50, 750, 20):
            data[i:i+3, 50:550] = [30, 30, 30]      # dark text lines
    elif kind == "dashboard":
        data[:, :] = [20, 25, 40]                   # dark bg
        data[50:150, 30:200] = [99, 102, 241]       # vivid purple card
        data[50:150, 220:390] = [16, 185, 129]      # vivid green card
    elif kind == "id_card":
        data.fill(240)                               # light bg
        data[200:400, 220:380] = [90, 90, 90]       # central dark blob
    return Image.fromarray(data)

def upload(kind):
    img = make_image(kind)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    image_bytes = buf.getvalue()

    boundary = "----TestBoundary7x"
    header = (
        "--" + boundary + "\r\n"
        'Content-Disposition: form-data; name="file"; filename="test.png"\r\n'
        "Content-Type: image/png\r\n\r\n"
    ).encode()
    footer = ("\r\n--" + boundary + "--\r\n").encode()
    body = header + image_bytes + footer

    req = urllib.request.Request(
        "http://127.0.0.1:8000/upload-image",
        data=body,
        headers={"Content-Type": "multipart/form-data; boundary=" + boundary},
    )
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        result = json.loads(resp.read())
        print(f"[{kind.upper():10}] -> Classification: {result['classification']}")
        print(f"             Reply preview: {result['reply'][:90]}...")
    except Exception as e:
        print(f"[{kind.upper():10}] ERROR: {e}")

if __name__ == "__main__":
    print("=== Image Classification Tests ===")
    upload("resume")
    upload("dashboard")
    upload("id_card")
    print("=== Done ===")
