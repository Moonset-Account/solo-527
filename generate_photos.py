import urllib.request
import os

photos = [
    ('BOX001.jpg', 'vaccine cold box temperature logger delivery at CDC warehouse, professional cold chain logistics, hand signing receipt, temperature display showing 2-8 C'),
    ('BOX002.jpg', 'pharmaceutical cold chain delivery, insulated vaccine shipping containers, digital thermometer probe, warehouse worker checking temperature log'),
    ('BOX003.jpg', 'CDC cold storage receiving area, vaccine cooler boxes being inspected, temperature data logger in foreground, delivery documents on clipboard'),
    ('BOX004.jpg', 'cold chain verification, staff member scanning vaccine shipment barcode, thermal shipping containers, real-time temperature monitor display'),
    ('BOX005.jpg', 'vaccine distribution center, receiving clerk signing for cold chain delivery, gel pack cooler boxes, temperature chart recorder visible'),
    ('BOX006.jpg', 'pharmaceutical warehouse receiving dock, insulated shipper containers being opened, digital temperature indicator, delivery signature pad'),
    ('BOX007.jpg', 'cold chain vaccine delivery, healthcare worker checking temperature log on shipment, portable cold box, barcode scanner in use'),
    ('BOX008.jpg', 'medical cold storage, vaccine transport boxes with temperature monitoring labels, quality control staff reviewing delivery records'),
]

base_url = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt={}&image_size=landscape_4_3'
output_dir = 'static/photos'
os.makedirs(output_dir, exist_ok=True)

for filename, prompt in photos:
    print(f'Generating {filename}...')
    url = base_url.format(urllib.parse.quote(prompt))
    try:
        urllib.request.urlretrieve(url, os.path.join(output_dir, filename))
        size = os.path.getsize(os.path.join(output_dir, filename))
        print(f'  ✓ Saved ({size} bytes)')
    except Exception as e:
        print(f'  ✗ Failed: {e}')

print('\nDone! Generated photos:')
for f in os.listdir(output_dir):
    print(f'  - {f}')
