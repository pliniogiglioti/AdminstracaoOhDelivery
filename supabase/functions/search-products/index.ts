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

  if (!ean) {
    return new Response(JSON.stringify({ error: 'EAN obrigatorio' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const token = Deno.env.get('COSMOS_TOKEN')
  if (!token) {
    return new Response(JSON.stringify({ error: 'COSMOS_TOKEN nao configurado' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const res = await fetch(`https://api.cosmos.bluesoft.com.br/gtins/${ean}`, {
      headers: {
        'X-Cosmos-Token': token,
        'Content-Type': 'application/json',
        'User-Agent': 'ohdelivery-admin/1.0',
      },
    })

    if (res.status === 404) {
      return new Response(JSON.stringify({ product: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Cosmos retornou ${res.status}` }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await res.json()

    // Cosmos retorna: description, brand { name }, thumbnail, avg_price
    const product = {
      code: ean,
      name: data.description ?? '',
      brand: data.brand?.name ?? '',
      description: data.description ?? '',
      imageUrl: data.thumbnail ?? data.picture ?? '',
    }

    return new Response(JSON.stringify({ product }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
