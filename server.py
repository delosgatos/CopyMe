import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

class ThreadingSimpleServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

if __name__ == '__main__':
    port = 8888
    server = ThreadingSimpleServer(('0.0.0.0', port), NoCacheHandler)
    print(f"Serving multithreaded on port {port}")
    server.serve_forever()
