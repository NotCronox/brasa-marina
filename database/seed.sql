insert into public.restaurant_settings (
  restaurant_name,
  description,
  phone,
  whatsapp,
  address,
  hours,
  instagram,
  table_count,
  delivery_enabled,
  delivery_min_order
)
values (
  'Brasa Marina',
  'Cocina caribeña contemporánea en Getsemaní, Cartagena.',
  '+57 300 000 0000',
  '573000000000',
  'Calle de la Media Luna #10-42, Getsemaní, Cartagena',
  'Lun-Jue 12:00 p.m. - 10:00 p.m. | Vie-Sáb 12:00 p.m. - 11:30 p.m. | Dom 12:00 p.m. - 9:00 p.m.',
  '@brasamarina.co',
  20,
  true,
  45000
)
on conflict (id) do update set
  restaurant_name = excluded.restaurant_name,
  description = excluded.description,
  phone = excluded.phone,
  whatsapp = excluded.whatsapp,
  address = excluded.address,
  hours = excluded.hours,
  instagram = excluded.instagram,
  table_count = excluded.table_count,
  delivery_enabled = excluded.delivery_enabled,
  delivery_min_order = excluded.delivery_min_order,
  updated_at = now();

insert into public.delivery_zones (id, name, fee, eta_minutes)
values
  ('getsemani', 'Getsemaní', 6000, 25),
  ('centro', 'Centro Histórico', 7000, 30),
  ('manga', 'Manga', 10000, 40),
  ('bocagrande', 'Bocagrande', 12000, 45),
  ('crespo', 'Crespo / Marbella', 16000, 55)
on conflict (id) do update set
  name = excluded.name,
  fee = excluded.fee,
  eta_minutes = excluded.eta_minutes,
  active = true;

insert into public.tables (number, status)
select number, 'free'
from generate_series(1, 20) as number
on conflict (number) do nothing;

insert into public.products (name, description, price, image, category, filters, available, featured, tag)
select *
from (
  values
    ('Ceviche de camarón y mango biche', 'Camarón curado en limón criollo, mango biche, cebolla morada, cilantro, ají dulce y chips de plátano.', 38000, 'assets/images/menu-ceviche-camaron.jpg', 'entradas', array['entradas'], true, false, 'Entrada fría'),
    ('Empanadas de jaiba y ají de coco', 'Masa de maíz crocante, jaiba especiada, sofrito costeño y emulsión suave de coco ahumado.', 29000, 'assets/images/menu-empanada-jaiba.jpg', 'entradas', array['entradas'], true, false, 'Para picar'),
    ('Patacones con hogao de camarón', 'Patacones crocantes, hogao costeño, camarón salteado, suero atollabuey y cilantro fresco.', 32000, 'assets/images/menu-ceviche-camaron.jpg', 'entradas', array['entradas'], true, false, 'Compartir'),
    ('Pulpo al carbón con puré de maduro', 'Pulpo tierno terminado a la brasa, puré de plátano maduro, aceite de cilantro y ensalada cítrica.', 72000, 'assets/images/menu-pulpo-carbon.jpg', 'brasa', array['entradas','brasa'], true, false, 'Brasa'),
    ('Pescado entero a la brasa', 'Pesca del día con salsa de coco, mantequilla de limón, ensalada de tomate y yuca dorada.', 74000, 'assets/images/plato-pescado-brasa-coco.jpg', 'brasa', array['brasa','fuertes'], true, true, 'Pesca del día'),
    ('Arroz meloso de mariscos', 'Arroz cremoso con camarón, calamar, almejas, fondo de pescado tostado y sofrito caribeño.', 64000, 'assets/images/plato-arroz-cremoso-mariscos.jpg', 'fuertes', array['fuertes'], true, true, 'Arroces'),
    ('Costillas caribeñas', 'Costillas glaseadas con panela, ron añejo y naranja agria, servidas con papas criollas y encurtidos.', 59000, 'assets/images/plato-costillas-caribenas.jpg', 'brasa', array['brasa','fuertes'], true, true, 'Fuego lento'),
    ('Parrillada marina para dos', 'Langostinos, vieiras, pesca del día y vegetales de temporada con mantequilla de ajo y limón.', 118000, 'assets/images/galeria-04.jpg', 'fuertes', array['fuertes','brasa'], true, false, 'Compartir'),
    ('Langostinos en curry de coco', 'Langostinos salteados, curry suave de coco, arroz jazmín, chips de ajo y cilantro cimarrón.', 69000, 'assets/images/galeria-04.jpg', 'fuertes', array['fuertes'], true, false, 'Mar'),
    ('Burger Marina de pesca blanca', 'Filete de pescado apanado, pan brioche, ensalada de repollo, tártara de limón y papas rústicas.', 42000, 'assets/images/plato-pescado-brasa-coco.jpg', 'hamburguesas', array['hamburguesas','fuertes'], true, false, 'Casa'),
    ('Burger costeña de res ahumada', 'Carne de res, queso costeño, cebolla caramelizada, mayo de ají dulce y papas criollas.', 44000, 'assets/images/plato-costillas-caribenas.jpg', 'hamburguesas', array['hamburguesas','fuertes'], true, false, 'Ahumada'),
    ('Cóctel de corozo', 'Ron añejo, cordial de corozo, limón mandarino, jengibre y perfume de naranja quemada.', 34000, 'assets/images/coctel-corozo.jpg', 'bebidas', array['bebidas'], true, true, 'Coctelería'),
    ('Limonada de coco tostado', 'Limón criollo, crema de coco, panela clara y ralladura de coco tostado. Cremosa, fría y balanceada.', 16000, 'assets/images/menu-limonada-coco.jpg', 'bebidas', array['bebidas'], true, false, 'Sin alcohol'),
    ('Soda de panela y limón', 'Panela clara, soda fría, limón mandarino y sal marina. Refrescante para acompañar platos a la brasa.', 14000, 'assets/images/menu-limonada-coco.jpg', 'bebidas', array['bebidas'], true, false, 'Casa'),
    ('Tarta de maracuyá y merengue', 'Base quebrada, crema de maracuyá, merengue tostado y sal marina para cerrar con frescura.', 24000, 'assets/images/menu-tarta-maracuya.jpg', 'postres', array['postres'], true, false, 'Postre cítrico'),
    ('Cocadas tibias con ron de caña', 'Cocadas suaves, crema de vainilla, coco rallado y reducción ligera de ron cartagenero.', 22000, 'assets/images/menu-cocadas.jpg', 'postres', array['postres'], true, false, 'Dulce costeño'),
    ('Flan de coco y panela', 'Flan cremoso de coco, caramelo de panela, crumble de maíz tostado y ralladura de limón.', 26000, 'assets/images/menu-tarta-maracuya.jpg', 'postres', array['postres'], false, false, 'Cierre dulce')
) as seed(name, description, price, image, category, filters, available, featured, tag)
where not exists (
  select 1
  from public.products p
  where p.name = seed.name
);

insert into public.orders (number, lookup_token, customer_name, customer_phone, table_number, order_type, notes, subtotal, total, status, created_at)
select 1042, '00000000-0000-4000-8000-000000001042', 'Camila R.', null, 8, 'table', 'Sin cebolla en el ceviche.', 112000, 112000, 'preparing', now() - interval '16 minutes'
where not exists (select 1 from public.orders where number = 1042);

insert into public.orders (number, lookup_token, customer_name, customer_phone, table_number, order_type, notes, subtotal, total, status, created_at)
select 1043, '00000000-0000-4000-8000-000000001043', 'Mesa 3', null, 3, 'table', null, 132000, 132000, 'ready', now() - interval '31 minutes'
where not exists (select 1 from public.orders where number = 1043);

insert into public.orders (number, lookup_token, customer_name, customer_phone, table_number, order_type, notes, subtotal, total, status, created_at)
select 1044, '00000000-0000-4000-8000-000000001044', 'Daniel M.', '300 555 2180', null, 'takeaway', 'Recoge en 25 minutos.', 64000, 64000, 'completed', now() - interval '65 minutes'
where not exists (select 1 from public.orders where number = 1044);

insert into public.orders (number, lookup_token, customer_name, customer_phone, table_number, order_type, notes, subtotal, total, status, created_at)
select 1045, '00000000-0000-4000-8000-000000001045', 'Valentina S.', null, 12, 'table', 'Agregar salsa picante aparte.', 177000, 177000, 'pending', now() - interval '7 minutes'
where not exists (select 1 from public.orders where number = 1045);

insert into public.orders (number, lookup_token, customer_name, customer_phone, table_number, order_type, notes, subtotal, total, status, created_at)
select 1046, '00000000-0000-4000-8000-000000001046', 'Laura P.', '301 222 4401', null, 'takeaway', 'Sin cubiertos.', 58000, 58000, 'pending', now() - interval '3 minutes'
where not exists (select 1 from public.orders where number = 1046);

insert into public.orders (
  number, lookup_token, customer_name, customer_phone, table_number, order_type, notes,
  subtotal, delivery_fee, total, status, created_at,
  delivery_address, delivery_zone_id, delivery_zone_name, delivery_reference, delivery_eta_minutes,
  payment_method, change_for
)
select
  1047, '00000000-0000-4000-8000-000000001047', 'Andrés G.', '302 118 7745', null, 'delivery', 'Timbre dañado, llamar al llegar.',
  106000, 12000, 118000, 'on_the_way', now() - interval '38 minutes',
  'Carrera 2 #8-45, Edificio Mar Azul, Apto 704', 'bocagrande', 'Bocagrande', 'Portería con vigilante, frente al parque.', 45,
  'cash', 150000
where not exists (select 1 from public.orders where number = 1047);

insert into public.orders (
  number, lookup_token, customer_name, customer_phone, table_number, order_type, notes,
  subtotal, delivery_fee, total, status, created_at,
  delivery_address, delivery_zone_id, delivery_zone_name, delivery_reference, delivery_eta_minutes,
  payment_method, change_for
)
select
  1048, '00000000-0000-4000-8000-000000001048', 'Mariana T.', '311 604 9023', null, 'delivery', 'Sin ají, por favor.',
  88000, 6000, 94000, 'pending', now() - interval '5 minutes',
  'Calle del Espíritu Santo #29-118', 'getsemani', 'Getsemaní', 'Casa azul de dos pisos.', 25,
  'transfer', null
where not exists (select 1 from public.orders where number = 1048);

insert into public.order_items (order_id, product_id, name, quantity, unit_price, subtotal)
select o.id, p.id, p.name, 1, 38000, 38000
from public.orders o, public.products p
where o.number = 1042 and p.name = 'Ceviche de camarón y mango biche'
and not exists (select 1 from public.order_items where order_id = o.id and product_id = p.id);

insert into public.order_items (order_id, product_id, name, quantity, unit_price, subtotal)
select o.id, p.id, p.name, 1, 74000, 74000
from public.orders o, public.products p
where o.number = 1042 and p.name = 'Pescado entero a la brasa'
and not exists (select 1 from public.order_items where order_id = o.id and product_id = p.id);

insert into public.order_items (order_id, product_id, name, quantity, unit_price, subtotal)
select o.id, p.id, p.name, 1, 64000, 64000
from public.orders o, public.products p
where o.number = 1043 and p.name = 'Arroz meloso de mariscos'
and not exists (select 1 from public.order_items where order_id = o.id and product_id = p.id);

insert into public.order_items (order_id, product_id, name, quantity, unit_price, subtotal)
select o.id, p.id, p.name, 2, 34000, 68000
from public.orders o, public.products p
where o.number = 1043 and p.name = 'Cóctel de corozo'
and not exists (select 1 from public.order_items where order_id = o.id and product_id = p.id);

insert into public.order_items (order_id, product_id, name, quantity, unit_price, subtotal)
select o.id, p.id, p.name, 1, 42000, 42000
from public.orders o, public.products p
where o.number = 1044 and p.name = 'Burger Marina de pesca blanca'
and not exists (select 1 from public.order_items where order_id = o.id and product_id = p.id);

insert into public.order_items (order_id, product_id, name, quantity, unit_price, subtotal)
select o.id, p.id, p.name, 1, 22000, 22000
from public.orders o, public.products p
where o.number = 1044 and p.name = 'Cocadas tibias con ron de caña'
and not exists (select 1 from public.order_items where order_id = o.id and product_id = p.id);

insert into public.order_items (order_id, product_id, name, quantity, unit_price, subtotal)
select o.id, p.id, p.name, 1, 118000, 118000
from public.orders o, public.products p
where o.number = 1045 and p.name = 'Parrillada marina para dos'
and not exists (select 1 from public.order_items where order_id = o.id and product_id = p.id);

insert into public.order_items (order_id, product_id, name, quantity, unit_price, subtotal)
select o.id, p.id, p.name, 1, 59000, 59000
from public.orders o, public.products p
where o.number = 1045 and p.name = 'Costillas caribeñas'
and not exists (select 1 from public.order_items where order_id = o.id and product_id = p.id);

insert into public.order_items (order_id, product_id, name, quantity, unit_price, subtotal)
select o.id, p.id, p.name, 2, 29000, 58000
from public.orders o, public.products p
where o.number = 1046 and p.name = 'Empanadas de jaiba y ají de coco'
and not exists (select 1 from public.order_items where order_id = o.id and product_id = p.id);

insert into public.order_items (order_id, product_id, name, quantity, unit_price, subtotal)
select o.id, p.id, p.name, 1, 74000, 74000
from public.orders o, public.products p
where o.number = 1047 and p.name = 'Pescado entero a la brasa'
and not exists (select 1 from public.order_items where order_id = o.id and product_id = p.id);

insert into public.order_items (order_id, product_id, name, quantity, unit_price, subtotal)
select o.id, p.id, p.name, 2, 16000, 32000
from public.orders o, public.products p
where o.number = 1047 and p.name = 'Limonada de coco tostado'
and not exists (select 1 from public.order_items where order_id = o.id and product_id = p.id);

insert into public.order_items (order_id, product_id, name, quantity, unit_price, subtotal)
select o.id, p.id, p.name, 1, 64000, 64000
from public.orders o, public.products p
where o.number = 1048 and p.name = 'Arroz meloso de mariscos'
and not exists (select 1 from public.order_items where order_id = o.id and product_id = p.id);

insert into public.order_items (order_id, product_id, name, quantity, unit_price, subtotal)
select o.id, p.id, p.name, 1, 24000, 24000
from public.orders o, public.products p
where o.number = 1048 and p.name = 'Tarta de maracuyá y merengue'
and not exists (select 1 from public.order_items where order_id = o.id and product_id = p.id);

update public.tables
set status = 'occupied'
where number in (
  select table_number
  from public.orders
  where order_type = 'table'
    and status in ('pending', 'preparing', 'ready', 'on_the_way')
    and table_number is not null
);
