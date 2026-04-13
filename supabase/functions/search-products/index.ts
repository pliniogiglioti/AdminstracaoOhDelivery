import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const query = url.searchParams.get('q') ?? ''
  const ean = url.searchParams.get('ean') ?? ''

  try {
    let apiUrl: string

    if (ean) {
      apiUrl = `https://world.openfoodfacts.org/api/v2/product/${ean}.json`
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (json.status !== 1 || !json.product) {
        return new Response(JSON.stringify({ products: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const p = json.product
      return new Response(JSON.stringify({
        products: [{
          code: ean,
          name: p.product_name_pt || p.product_name || '',
          brand: (p.brands ?? '').split(',')[0].trim(),
          description: p.generic_name_pt || p.generic_name || '',
          imageUrl: p.image_url || '',
        }]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    apiUrl = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(query)}&fields=code,product_name,product_name_pt,brands,image_url,generic_name,generic_name_pt&page_size=20&countries_tags=en:brazil`
    const res = await fetch(apiUrl)
    const json = await res.json()

    const products = (json.products ?? [])
      .filter((p: Record<string, string>) => (p.product_name_pt || p.product_name) && p.code)
      .map((p: Record<string, string>) => ({
        code: p.code ?? '',
        name: p.product_name_pt || p.product_name || '',
        brand: (p.brands ?? '').split(',')[0].trim(),
        description: p.generic_name_pt || p.generic_name || '',
        imageUrl: p.image_url || '',
      }))

    return new Response(JSON.stringify({ products }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), products: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
