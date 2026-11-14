-- Read-only application catalog snapshot. Execute on the target and a freshly
-- migrated disposable reference database of the same PostgreSQL/Supabase version.
WITH app_tables AS (
  SELECT c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname IN
    ('profiles', 'feedback', 'user_owned_tracks', 'user_favorite_series')
), snapshot AS (
  SELECT 'table' AS section, t.relname AS key,
    jsonb_build_object('rls', t.relrowsecurity, 'forceRls', t.relforcerowsecurity) AS definition
  FROM app_tables t
  UNION ALL
  SELECT 'column', t.relname || '.' || a.attname,
    jsonb_build_object('type', format_type(a.atttypid, a.atttypmod), 'notNull', a.attnotnull,
      'default', pg_get_expr(d.adbin, d.adrelid), 'identity', a.attidentity, 'generated', a.attgenerated)
  FROM app_tables t JOIN pg_attribute a ON a.attrelid = t.oid
  LEFT JOIN pg_attrdef d ON d.adrelid = t.oid AND d.adnum = a.attnum
  WHERE a.attnum > 0 AND NOT a.attisdropped
  UNION ALL
  SELECT 'constraint', t.relname || '.' || c.conname,
    jsonb_build_object('type', c.contype, 'definition', pg_get_constraintdef(c.oid), 'validated', c.convalidated)
  FROM app_tables t JOIN pg_constraint c ON c.conrelid = t.oid
  UNION ALL
  SELECT 'index', t.relname || '.' || ic.relname,
    jsonb_build_object('definition', pg_get_indexdef(i.indexrelid), 'valid', i.indisvalid)
  FROM app_tables t JOIN pg_index i ON i.indrelid = t.oid JOIN pg_class ic ON ic.oid = i.indexrelid
  UNION ALL
  SELECT 'policy', t.relname || '.' || p.polname,
    jsonb_build_object('command', p.polcmd, 'permissive', p.polpermissive,
      'roles', (SELECT jsonb_agg(CASE WHEN r = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(r) END ORDER BY r) FROM unnest(p.polroles) r),
      'using', pg_get_expr(p.polqual, p.polrelid), 'check', pg_get_expr(p.polwithcheck, p.polrelid))
  FROM app_tables t JOIN pg_policy p ON p.polrelid = t.oid
  UNION ALL
  SELECT 'trigger', n.nspname || '.' || c.relname || '.' || tr.tgname,
    jsonb_build_object('definition', pg_get_triggerdef(tr.oid), 'enabled', tr.tgenabled)
  FROM pg_trigger tr JOIN pg_class c ON c.oid = tr.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE NOT tr.tgisinternal AND (tr.tgrelid IN (SELECT oid FROM app_tables)
    OR (n.nspname = 'auth' AND c.relname = 'users' AND tr.tgname = 'on_auth_user_created'))
  UNION ALL
  SELECT 'function', p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
    jsonb_build_object('definition', pg_get_functiondef(p.oid), 'securityDefiner', p.prosecdef,
      'config', p.proconfig)
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname IN ('handle_new_user', 'set_updated_at')
  UNION ALL
  SELECT 'grant', table_name || '.' || grantee || '.' || privilege_type,
    jsonb_build_object('grantable', is_grantable)
  FROM information_schema.table_privileges
  WHERE table_schema = 'public' AND table_name IN (SELECT relname FROM app_tables)
    AND grantee IN ('PUBLIC', 'anon', 'authenticated')
  UNION ALL
  SELECT 'schemaGrant', r.rolname,
    jsonb_build_object('publicUsage', has_schema_privilege(r.oid, 'public', 'USAGE'),
      'authUsage', has_schema_privilege(r.oid, 'auth', 'USAGE'),
      'authUidExecute', has_function_privilege(r.oid, 'auth.uid()', 'EXECUTE'))
  FROM pg_roles r WHERE r.rolname IN ('anon', 'authenticated')
  UNION ALL
  SELECT 'extension', e.extname, jsonb_build_object('schema', n.nspname)
  FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'pgcrypto'
)
SELECT section, key, definition FROM snapshot ORDER BY section, key;
