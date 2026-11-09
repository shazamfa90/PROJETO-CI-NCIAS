-- Projeto da turma: um documento JSON, lido por qualquer pessoa e gravado só por aparelhos autorizados.
-- Este arquivo documenta o banco do Supabase. O código da turma não fica aqui:
-- ele é gravado à parte, só como hash, na tabela privado.acesso.

create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;

create table public.projetos (
  id text primary key,
  dados jsonb not null,
  revisao bigint not null default 0,
  atualizado_em timestamptz not null default now()
);
alter table public.projetos enable row level security;
create policy "Qualquer pessoa pode ler o projeto" on public.projetos
  for select to anon, authenticated using (true);
revoke insert, update, delete, truncate, references, trigger on public.projetos from anon, authenticated;

-- Tabela pequena só para avisar os navegadores de que há uma revisão nova.
create table public.projeto_sinal (
  id text primary key references public.projetos (id) on delete cascade,
  revisao bigint not null default 0
);
alter table public.projeto_sinal enable row level security;
create policy "Qualquer pessoa pode ler o sinal" on public.projeto_sinal
  for select to anon, authenticated using (true);
revoke insert, update, delete, truncate, references, trigger on public.projeto_sinal from anon, authenticated;
alter publication supabase_realtime add table public.projeto_sinal;

-- Dados privados: nunca expostos pela API.
create table privado.acesso (
  id text primary key references public.projetos (id) on delete cascade,
  codigo_hash text not null,
  atualizado_em timestamptz not null default now()
);
create table privado.aparelhos (
  token_hash text primary key,
  projeto_id text not null references public.projetos (id) on delete cascade,
  criado_em timestamptz not null default now()
);
create table privado.falhas (
  id bigint generated always as identity primary key,
  projeto_id text not null,
  quando timestamptz not null default now()
);
create index falhas_quando_idx on privado.falhas (projeto_id, quando);
create table privado.historico (
  id bigint generated always as identity primary key,
  projeto_id text not null,
  revisao bigint not null,
  dados jsonb not null,
  salvo_em timestamptz not null default now()
);
create index historico_projeto_idx on privado.historico (projeto_id, id desc);
alter table privado.acesso enable row level security;
alter table privado.aparelhos enable row level security;
alter table privado.falhas enable row level security;
alter table privado.historico enable row level security;

-- Troca o código da turma por uma credencial do aparelho.
-- Depois de 20 erros em 15 minutos, novas tentativas ficam bloqueadas.
create function public.entrar(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
  v_token text;
begin
  if (select count(*) from privado.falhas where projeto_id = 'turma' and quando > now() - interval '15 minutes') >= 20 then
    return jsonb_build_object('ok', false, 'motivo', 'bloqueado');
  end if;
  select codigo_hash into v_hash from privado.acesso where id = 'turma';
  if v_hash is null or p_codigo is null or length(p_codigo) > 72
     or extensions.crypt(p_codigo, v_hash) <> v_hash then
    insert into privado.falhas (projeto_id) values ('turma');
    return jsonb_build_object('ok', false, 'motivo', 'codigo');
  end if;
  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  insert into privado.aparelhos (token_hash, projeto_id)
    values (encode(extensions.digest(v_token, 'sha256'), 'hex'), 'turma');
  delete from privado.falhas where quando < now() - interval '1 day';
  return jsonb_build_object('ok', true, 'token', v_token);
end;
$$;

-- Grava o projeto se o aparelho for autorizado e a revisão informada ainda for a atual.
create function public.salvar_projeto(p_token text, p_dados jsonb, p_revisao bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_atual public.projetos%rowtype;
  v_nova bigint;
begin
  if p_token is null or length(p_token) > 200 or not exists (
    select 1 from privado.aparelhos
    where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') and projeto_id = 'turma'
  ) then
    return jsonb_build_object('ok', false, 'motivo', 'acesso');
  end if;
  if p_dados is null or jsonb_typeof(p_dados) <> 'object'
     or jsonb_typeof(p_dados -> 'projeto') is distinct from 'object' then
    return jsonb_build_object('ok', false, 'motivo', 'invalido');
  end if;
  if octet_length(p_dados::text) > 1500000 then
    return jsonb_build_object('ok', false, 'motivo', 'grande');
  end if;

  select * into v_atual from public.projetos where id = 'turma' for update;
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'invalido');
  end if;
  if v_atual.revisao is distinct from p_revisao then
    return jsonb_build_object('ok', false, 'motivo', 'conflito', 'revisao', v_atual.revisao, 'dados', v_atual.dados);
  end if;

  -- Guarda um retrato da versão anterior: no máximo um a cada 10 minutos,
  -- e sempre que o projeto encolher para menos da metade (apagamento).
  if not exists (select 1 from privado.historico where projeto_id = 'turma' and salvo_em > now() - interval '10 minutes')
     or octet_length(p_dados::text) < octet_length(v_atual.dados::text) / 2 then
    insert into privado.historico (projeto_id, revisao, dados) values ('turma', v_atual.revisao, v_atual.dados);
    delete from privado.historico
      where projeto_id = 'turma'
        and id not in (select id from privado.historico where projeto_id = 'turma' order by id desc limit 200);
  end if;

  v_nova := v_atual.revisao + 1;
  update public.projetos set dados = p_dados, revisao = v_nova, atualizado_em = now() where id = 'turma';
  update public.projeto_sinal set revisao = v_nova where id = 'turma';
  return jsonb_build_object('ok', true, 'revisao', v_nova);
end;
$$;

-- Troca o código da turma. Todos os aparelhos precisam digitar o código novo.
create function public.trocar_codigo(p_atual text, p_novo text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
  v_token text;
begin
  if (select count(*) from privado.falhas where projeto_id = 'turma' and quando > now() - interval '15 minutes') >= 20 then
    return jsonb_build_object('ok', false, 'motivo', 'bloqueado');
  end if;
  select codigo_hash into v_hash from privado.acesso where id = 'turma';
  if v_hash is null or p_atual is null or length(p_atual) > 72
     or extensions.crypt(p_atual, v_hash) <> v_hash then
    insert into privado.falhas (projeto_id) values ('turma');
    return jsonb_build_object('ok', false, 'motivo', 'codigo');
  end if;
  if p_novo is null or length(p_novo) < 6 or length(p_novo) > 72 then
    return jsonb_build_object('ok', false, 'motivo', 'curto');
  end if;
  update privado.acesso
    set codigo_hash = extensions.crypt(p_novo, extensions.gen_salt('bf', 10)), atualizado_em = now()
    where id = 'turma';
  delete from privado.aparelhos where projeto_id = 'turma';
  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  insert into privado.aparelhos (token_hash, projeto_id)
    values (encode(extensions.digest(v_token, 'sha256'), 'hex'), 'turma');
  return jsonb_build_object('ok', true, 'token', v_token);
end;
$$;

revoke execute on function public.entrar(text) from public;
revoke execute on function public.salvar_projeto(text, jsonb, bigint) from public;
revoke execute on function public.trocar_codigo(text, text) from public;
grant execute on function public.entrar(text) to anon, authenticated;
grant execute on function public.salvar_projeto(text, jsonb, bigint) to anon, authenticated;
grant execute on function public.trocar_codigo(text, text) to anon, authenticated;

-- Documento inicial vazio.
insert into public.projetos (id, dados) values (
  'turma',
  '{"versao":1,"publicadoEm":null,"exemplo":false,"projeto":{"titulo":"","tema":"","turma":"","escola":"","orientador":"","pergunta":"","hipotese":"","objetivo":"","metodologia":"","seguranca":""},"etapas":[],"tarefas":[],"diario":[],"resultados":{"variavel":"","unidade":"","tratamentos":[]},"equipe":[],"materiais":[],"referencias":[]}'::jsonb
);
insert into public.projeto_sinal (id) values ('turma');
