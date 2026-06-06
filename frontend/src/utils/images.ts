const API_BASE = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image'

export const imagePresets = {
  pottery: [
    { prompt: 'handmade ceramic pottery mug on wooden table, warm studio lighting, close up', size: 'square_hd' },
    { prompt: 'pottery wheel with wet clay, hands shaping a bowl, ceramic workshop', size: 'square_hd' },
    { prompt: 'beautiful hand thrown ceramic vase, earth tones, shelf display', size: 'square_hd' },
    { prompt: 'pottery studio interior, shelves of finished ceramic works, warm sunlight', size: 'square_hd' }
  ],
  silver: [
    { prompt: 'handmade silver jewelry ring on velvet display, soft lighting, close up', size: 'square_hd' },
    { prompt: 'silversmith workbench with tools, metal sheet, hammer, jewelry making', size: 'square_hd' },
    { prompt: 'elegant handcrafted silver pendant with gemstone, white background', size: 'square_hd' },
    { prompt: 'silver bracelet being polished, jeweler workshop, detailed craftsmanship', size: 'square_hd' }
  ],
  leather: [
    { prompt: 'handmade leather wallet on dark wood table, stitching details, close up', size: 'square_hd' },
    { prompt: 'leather craft tools, stamps, thread, hide on workbench, workshop', size: 'square_hd' },
    { prompt: 'beautiful hand tooled leather bag with floral pattern, vintage style', size: 'square_hd' },
    { prompt: 'leather card holder being hand sewn, artisan workshop, warm light', size: 'square_hd' }
  ],
  artwork: [
    { prompt: 'student ceramic artwork, colorful glazed pottery, gallery display', size: 'square_hd' },
    { prompt: 'finished handmade silver earrings on display stand, elegant', size: 'square_hd' },
    { prompt: 'hand carved leather journal, custom design, artisan craft', size: 'square_hd' },
    { prompt: 'collection of handmade crafts, pottery, jewelry, leather goods', size: 'square_hd' }
  ],
  material: [
    { prompt: 'pottery clay tools set, carving tools, sponges, organized on workbench', size: 'square_hd' },
    { prompt: 'silver jewelry making kit, wires, beads, pliers, organized', size: 'square_hd' },
    { prompt: 'leather craft supplies, pieces of hide, needles, thread, dark background', size: 'square_hd' }
  ]
}

export function getImageUrl(category: string, index: number = 0): string {
  const presets = imagePresets[category as keyof typeof imagePresets] || imagePresets.pottery
  const preset = presets[index % presets.length]
  const encodedPrompt = encodeURIComponent(preset.prompt)
  return `${API_BASE}?prompt=${encodedPrompt}&image_size=${preset.size}`
}

export function getCourseCover(categoryCode: string, seed: number = 0): string {
  return getImageUrl(categoryCode, seed)
}

export function getArtworkImage(seed: number = 0): string {
  const presets = imagePresets.artwork
  const preset = presets[seed % presets.length]
  const encodedPrompt = encodeURIComponent(`${preset.prompt}, artwork id ${seed}`)
  return `${API_BASE}?prompt=${encodedPrompt}&image_size=${preset.size}`
}

export function getMaterialImage(sku: string, seed: number = 0): string {
  const category = sku.startsWith('POT') ? 'pottery' : sku.startsWith('SIL') ? 'silver' : 'leather'
  const presets = imagePresets.material
  const preset = presets[seed % presets.length]
  const encodedPrompt = encodeURIComponent(`${preset.prompt}, material package ${sku}`)
  return `${API_BASE}?prompt=${encodedPrompt}&image_size=${preset.size}`
}
