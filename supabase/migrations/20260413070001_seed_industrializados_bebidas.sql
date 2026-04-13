-- Seed: bebidas industrializadas mais consumidas no Brasil
insert into public.industrializados (name, brand, ean, description, image_url, active) values
  -- Refrigerantes
  ('Coca-Cola Lata 350ml',        'Coca-Cola',   '7894900011517', 'Refrigerante sabor cola lata 350ml',             'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80', true),
  ('Coca-Cola Garrafa 600ml',     'Coca-Cola',   '7894900700015', 'Refrigerante sabor cola garrafa 600ml',          'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80', true),
  ('Coca-Cola Garrafa 2L',        'Coca-Cola',   '7894900011630', 'Refrigerante sabor cola garrafa 2 litros',       'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80', true),
  ('Guaraná Antarctica Lata 350ml','Antarctica',  '7891991010856', 'Refrigerante guaraná lata 350ml',               'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=400&q=80', true),
  ('Guaraná Antarctica 2L',       'Antarctica',  '7891991010900', 'Refrigerante guaraná garrafa 2 litros',          'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=400&q=80', true),
  ('Pepsi Lata 350ml',            'PepsiCo',     '7892840800439', 'Refrigerante sabor cola lata 350ml',             'https://images.unsplash.com/photo-1553456558-aff63285bdd1?auto=format&fit=crop&w=400&q=80', true),
  ('Sprite Lata 350ml',           'Coca-Cola',   '7894900700091', 'Refrigerante limão lata 350ml',                  'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=400&q=80', true),
  ('Fanta Laranja Lata 350ml',    'Coca-Cola',   '7894900011593', 'Refrigerante laranja lata 350ml',                'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=400&q=80', true),
  ('Schweppes Tônica 350ml',      'Schweppes',   '7894900700152', 'Água tônica lata 350ml',                         'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=400&q=80', true),

  -- Águas
  ('Água Crystal 500ml',          'Crystal',     '7896085800015', 'Água mineral sem gás 500ml',                     'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=400&q=80', true),
  ('Água Crystal 1,5L',           'Crystal',     '7896085800022', 'Água mineral sem gás 1,5 litros',                'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=400&q=80', true),
  ('Água com Gás Lindoya 500ml',  'Lindoya',     '7896045100016', 'Água mineral com gás 500ml',                     'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=400&q=80', true),
  ('Água Bonafont 500ml',         'Bonafont',    '7891150000010', 'Água mineral sem gás 500ml',                     'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=400&q=80', true),

  -- Sucos e néctares
  ('Del Valle Uva 290ml',         'Del Valle',   '7894900700237', 'Néctar de uva caixinha 290ml',                   'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=400&q=80', true),
  ('Del Valle Laranja 290ml',     'Del Valle',   '7894900700244', 'Néctar de laranja caixinha 290ml',               'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=400&q=80', true),
  ('Tropicana Laranja 900ml',     'Tropicana',   '7892840800507', 'Suco de laranja integral 900ml',                 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=400&q=80', true),
  ('Ades Laranja 1L',             'Ades',        '7894900700268', 'Bebida de soja sabor laranja 1 litro',           'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=400&q=80', true),

  -- Energéticos
  ('Red Bull 250ml',              'Red Bull',    '9002490100070', 'Energético lata 250ml',                          'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=400&q=80', true),
  ('Monster Energy 473ml',        'Monster',     '7896045100078', 'Energético lata 473ml',                          'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=400&q=80', true),
  ('TNT Energy 269ml',            'TNT',         '7896336400015', 'Energético lata 269ml',                          'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=400&q=80', true),

  -- Cervejas
  ('Skol Lata 350ml',             'Skol',        '7891991000017', 'Cerveja pilsen lata 350ml',                      'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80', true),
  ('Brahma Lata 350ml',           'Brahma',      '7891991000024', 'Cerveja pilsen lata 350ml',                      'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80', true),
  ('Antarctica Lata 350ml',       'Antarctica',  '7891991000031', 'Cerveja pilsen lata 350ml',                      'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80', true),
  ('Heineken Garrafa 330ml',      'Heineken',    '8712000045007', 'Cerveja lager garrafa 330ml',                    'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80', true),
  ('Budweiser Lata 350ml',        'Budweiser',   '7891991010818', 'Cerveja lager lata 350ml',                       'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80', true),
  ('Corona Extra 330ml',          'Corona',      '7501064150066', 'Cerveja lager garrafa 330ml',                    'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80', true),

  -- Isotônicos e funcionais
  ('Gatorade Laranja 500ml',      'Gatorade',    '7892840800521', 'Isotônico sabor laranja 500ml',                  'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=400&q=80', true),
  ('Powerade Uva 500ml',          'Powerade',    '7894900700282', 'Isotônico sabor uva 500ml',                      'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=400&q=80', true),

  -- Leites e achocolatados
  ('Leite Longa Vida Integral 1L','Italac',      '7896259400015', 'Leite UHT integral 1 litro',                     'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80', true),
  ('Toddy Achocolatado 200ml',    'Toddy',       '7892840800545', 'Achocolatado caixinha 200ml',                    'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80', true),
  ('Nescau Achocolatado 200ml',   'Nestlé',      '7891000100015', 'Achocolatado caixinha 200ml',                    'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80', true)

on conflict (ean) do nothing;
