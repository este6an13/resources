import json
import os
from http.server import SimpleHTTPRequestHandler, HTTPServer
import urllib.parse

class ResourceHandler(SimpleHTTPRequestHandler):
    def get_data(self):
        resources_file = 'resources.json'
        if os.path.exists(resources_file):
            with open(resources_file, 'r', encoding='utf-8') as f:
                try:
                    return json.load(f)
                except json.JSONDecodeError:
                    return []
        return []

    def save_data(self, data):
        with open('resources.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

    def do_POST(self):
        if self.path == '/api/add':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                new_item = json.loads(post_data.decode('utf-8'))
                if 'title' not in new_item or 'url' not in new_item or 'tags' not in new_item:
                    self.send_error(400, "Invalid data format")
                    return

                data = self.get_data()
                
                # Check for duplicates by url
                if any(item.get('url') == new_item['url'] for item in data):
                    self.send_error(409, "Resource with this URL already exists")
                    return
                
                data.insert(0, new_item)
                self.save_data(data)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
            except Exception as e:
                self.send_error(500, f"Server Error: {str(e)}")
        else:
            super().do_POST()

    def do_PUT(self):
        if self.path == '/api/update':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                update_item = json.loads(post_data.decode('utf-8'))
                if 'url' not in update_item or 'tags' not in update_item:
                    self.send_error(400, "URL and tags required")
                    return

                data = self.get_data()
                updated = False
                for item in data:
                    if item.get('url') == update_item['url']:
                        item['tags'] = update_item['tags']
                        updated = True
                        break
                
                if updated:
                    self.save_data(data)
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
                else:
                    self.send_error(404, "Resource not found")
            except Exception as e:
                self.send_error(500, f"Server Error: {str(e)}")
        else:
            self.send_error(404, "Not Found")

    def do_DELETE(self):
        if self.path.startswith('/api/delete'):
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                delete_item = json.loads(post_data.decode('utf-8'))
                url_to_delete = delete_item.get('url')
                
                if not url_to_delete:
                    self.send_error(400, "URL required")
                    return

                data = self.get_data()
                new_data = [item for item in data if item.get('url') != url_to_delete]
                
                if len(data) != len(new_data):
                    self.save_data(new_data)
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
                else:
                    self.send_error(404, "Resource not found")
            except Exception as e:
                self.send_error(500, f"Server Error: {str(e)}")
        else:
            self.send_error(404, "Not Found")

if __name__ == '__main__':
    port = 8000
    server_address = ('', port)
    httpd = HTTPServer(server_address, ResourceHandler)
    print(f'Starting server on http://localhost:{port} ...')
    print('Press Ctrl+C to stop.')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    print('Server stopped.')
