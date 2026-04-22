"""
Test the screenshot help desk: image + problem description → targeted guidance.
"""
import io, json, numpy as np, urllib.request, urllib.parse
from PIL import Image

def make_dashboard():
    data = np.zeros((800, 600, 3), dtype=np.uint8)
    data[:, :] = [20, 25, 40]
    data[50:150, 30:200] = [99, 102, 241]
    return Image.fromarray(data)

def upload(problem_message=None):
    img = make_dashboard()
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    image_bytes = buf.getvalue()

    boundary = "----ScreenshotTest"
    parts = [
        ("--" + boundary + "\r\n"
         'Content-Disposition: form-data; name="file"; filename="screenshot.png"\r\n'
         "Content-Type: image/png\r\n\r\n").encode() + image_bytes + b"\r\n"
    ]
    if problem_message:
        parts.append(
            ("--" + boundary + "\r\n"
             'Content-Disposition: form-data; name="message"\r\n\r\n'
             + problem_message + "\r\n").encode()
        )
    parts.append(("--" + boundary + "--\r\n").encode())
    body = b"".join(parts)

    req = urllib.request.Request(
        "http://127.0.0.1:8000/upload-image",
        data=body,
        headers={"Content-Type": "multipart/form-data; boundary=" + boundary},
    )
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        result = json.loads(resp.read())
        print(f"\n--- Problem: '{problem_message}' ---")
        print(f"Classified as: {result['classification']}")
        print(f"Reply:\n{result['reply']}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    print("=== Screenshot Help Desk Tests ===")
    upload("I can't apply for this job")
    upload("how to reset my password")
    upload("my interviews are not showing")
    upload()   # No message → generic guidance
