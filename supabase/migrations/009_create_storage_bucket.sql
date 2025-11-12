-- ============================================
-- Create Storage Bucket for AI Agent Files
-- ============================================

-- Nota: Buckets precisam ser criados via API ou Dashboard do Supabase
-- Este arquivo serve como documentação

-- Para criar o bucket via SQL (requer extensão):
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'ai-agent-files',
--   'ai-agent-files',
--   true,
--   10485760, -- 10MB
--   ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown']
-- );

-- Política de acesso para o bucket
-- CREATE POLICY "Anyone can view files"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'ai-agent-files');

-- CREATE POLICY "Admins can upload files"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'ai-agent-files' AND
--   EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE id = auth.uid() AND is_pro = TRUE
--   )
-- );

-- CREATE POLICY "Admins can update files"
-- ON storage.objects FOR UPDATE
-- USING (
--   bucket_id = 'ai-agent-files' AND
--   EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE id = auth.uid() AND is_pro = TRUE
--   )
-- );

-- CREATE POLICY "Admins can delete files"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'ai-agent-files' AND
--   EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE id = auth.uid() AND is_pro = TRUE
--   )
-- );

