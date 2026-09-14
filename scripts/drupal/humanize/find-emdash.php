<?php
$db = \Drupal::database();
$schema = $db->getConnectionOptions()['database'];
$cols = $db->query("SELECT table_name t, column_name c FROM information_schema.columns WHERE table_schema = :s AND data_type IN ('varchar','text','mediumtext','longtext') AND character_set_name = 'utf8mb4' AND (table_name LIKE 'node__%' OR table_name LIKE 'paragraph__%' OR table_name IN ('node_field_data','paragraphs_item_field_data','media_field_data','menu_link_content_data','taxonomy_term_field_data','texts_field_data','translatable_config_pages_field_data') OR table_name LIKE 'translatable_config_pages__%' OR table_name LIKE 'texts__%' OR table_name LIKE 'menu_link_content__%')", [':s' => $schema])->fetchAll();
$out = [];
foreach ($cols as $col) {
  $idcol = $db->schema()->fieldExists($col->t, 'entity_id') ? 'entity_id' : ($db->schema()->fieldExists($col->t, 'nid') ? 'nid' : ($db->schema()->fieldExists($col->t, 'id') ? 'id' : NULL));
  if (!$idcol) continue;
  try { $rows = $db->query("SELECT `$idcol` AS id, `{$col->c}` AS v FROM `{$col->t}` WHERE `{$col->c}` LIKE '%—%'")->fetchAll(); } catch (\Exception $e) { continue; }
  foreach ($rows as $r) $out[] = ['table' => $col->t, 'column' => $col->c, 'id' => (int) $r->id, 'value' => $r->v];
}
echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
