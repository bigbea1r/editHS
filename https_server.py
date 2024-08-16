import http.server
import ssl

server_address = ('', 8080)
httpd = http.server.HTTPServer(server_address, http.server.SimpleHTTPRequestHandler)

# Укажите путь к вашему сертификату и ключу
certfile = 'C:/Users/panarin_ov/Desktop/Test/server.crt'
keyfile = 'C:/Users/panarin_ov/Desktop/Test/server.key'

# Создание SSL контекста
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(certfile=certfile, keyfile=keyfile)

# Обертывание сокета
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

print("Serving on https://192.168.2.102:8080")
httpd.serve_forever()
