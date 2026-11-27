# Servidor local de la demo: igual que http.server, pero sin dejar que el navegador guarde copias viejas.
import sys, os, http.server
os.chdir(os.path.dirname(os.path.abspath(__file__)))
class Sin(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()
    def send_response(self, code, message=None):
        super().send_response(code, message)
    def do_GET(self):
        for c in ('If-Modified-Since', 'If-None-Match'):
            if c in self.headers: del self.headers[c]
        super().do_GET()
puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 4360
class Servidor(http.server.ThreadingHTTPServer):
    request_queue_size = 256
    daemon_threads = True
Servidor(('127.0.0.1', puerto), Sin).serve_forever()
