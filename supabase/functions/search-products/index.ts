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
  const ean = url.searchParams.get('ean') ?? ''
  const query = url.searchParams.get('q') ?? ''

  const token = Deno.env.get('COSMOS_TOKEN')
  if (!token) {
    return new Response(JSON.stringify({ error: 'COSMOS_TOKEN nao configurado' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const headers = {
    'X-Cosmos-Token': token,
    'Content-Type': 'application/json',
    'User-Agent': 'ohdelivery-admin/1.0',
  }

  try {
    // Busca por EAN
    if (ean) {
      const res = await fetch(`https://api.cosmos.bluesoft.com.br/gtins/${ean}`, { headers })

      if (res.status === 404) {
        return new Response(JSON.stringify({ products: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (!res.ok) {
        return new Response(JSON.stringify({ error: `Cosmos ${res.status}`, products: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const data = await res.json()
      return new Response(JSON.stringify({
        products: [{
          code: ean,
          name: data.description ?? '',
          brand: data.brand?.name ?? '',
          description: data.description ?? '',
          imageUrl: data.thumbnail ?? data.picture ?? '',
        }]
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Busca por texto
    if (query) {
      const res = await fetch(
        `https://api.cosmos.bluesoft.com.br/products?query=${encodeURIComponent(query)}`,
        { headers }
      )

      if (!res.ok) {
        return new Response(JSON.stringify({ error: `Cosmos ${res.status}`, products: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const data = await res.json()
      // Cosmos retorna array de produtos
      const list = Array.isArray(data) ? data : (data.products ?? [])
      const products = list.map((p: Record<string, unknown>) => ({
        code: String(p.gtin ?? p.ean ?? ''),
        name: String(p.description ?? ''),
        brand: String((p.brand as Record<string, unknown>)?.name ?? ''),
        description: String(p.description ?? ''),
        imageUrl: String(p.thumbnail ?? p.picture ?? ''),
      })).filter((p: { name: string }) => p.name)

      return new Response(JSON.stringify({ products }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Informe ean ou q', products: [] }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), products: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
