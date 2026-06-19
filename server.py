# StudyFlow Local Dev Server
import http.server
import socketserver
import webbrowser
import sys

PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

class MyHTTPServer(http.server.HTTPServer):
    def handle_error(self, request, client_address):
        # Suppress noisy broken pipe errors from browser refresh
        pass

def run_server():
    print(f"==================================================")
    print(f"StudyFlow Local Development Server Started")
    print(f"Local URL: http://localhost:{PORT}")
    print(f"==================================================")
    
    # Open browser automatically
    try:
        webbrowser.open(f"http://localhost:{PORT}")
    except Exception as e:
        print("Could not auto-open browser, please navigate manually.")

    # Start server
    try:
        with MyHTTPServer(("", PORT), Handler) as httpd:
            print("Press Ctrl+C to terminate.")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutdown request received. Server stopped.")
        sys.exit(0)
    except Exception as e:
        print(f"Error launching server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_server()
