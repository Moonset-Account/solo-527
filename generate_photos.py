import urllib.request
import os

photos_dir = "static/photos"
os.makedirs(photos_dir, exist_ok=True)

photo_prompts = [
    ("BOX000001.jpg", "vaccine cold chain delivery signoff, hand holding temperature logger, vaccine boxes with cold chain labels, warehouse background, professional lighting"),
    ("BOX000002.jpg", "cold chain logistics worker signing delivery receipt, vaccine cooler boxes in background, temperature monitoring display, warehouse interior"),
    ("BOX000003.jpg", "vaccine shipment receiving at CDC, temperature data logger screen showing 2-8 C, staff checking cold boxes, clipboard with forms"),
    ("BOX000004.jpg", "cold chain delivery verification, worker scanning barcode on vaccine box, thermal shipping containers, digital thermometer display"),
    ("BOX000005.jpg", "pharmaceutical cold chain signoff, temperature recorder being inspected, insulated shipping containers, cold storage facility"),
]

base_url = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt={}&image_size=square_hd"

for filename, prompt in photo_prompts:
    print(f"Generating {filename}...")
    url = base_url.format(urllib.parse.quote(prompt))
    try:
        urllib.request.urlretrieve(url, os.path.join(photos_dir, filename))
        print(f"  ✓ Saved")
    except Exception as e:
        print(f"  ✗ Failed: {e}")

print("\nDone generating photos!")
