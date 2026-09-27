# I'M FRIDGE — local dev server (only for testing; the game itself needs no server).
# Serves the folder on 127.0.0.1 and accepts POST /__snap?name=x (a PNG data URL) to save
# screenshots of the canvas (default folder: <system temp>/outoforder-snaps).
# Usage: python tools/devserver.py 8741 <snapshot folder>
import base64, http.server, os, sys, tempfile, urllib.parse

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8741
SNAPS = sys.argv[2] if len(sys.argv) > 2 else os.path.join(tempfile.gettempdir(), 'outoforder-snaps')


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        if u.path != '/__snap':
            self.send_error(404)
            return
        name = urllib.parse.parse_qs(u.query).get('name', ['snap'])[0]
        name = ''.join(ch for ch in name if ch.isalnum() or ch in '-_') or 'snap'
        body = self.rfile.read(int(self.headers.get('Content-Length', 0))).decode('ascii')
        data = base64.b64decode(body.split(',', 1)[-1])
        os.makedirs(SNAPS, exist_ok=True)
        path = os.path.join(SNAPS, name + '.png')
        with open(path, 'wb') as f:
            f.write(data)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(path.encode())

    def log_message(self, *a):
        pass


http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
