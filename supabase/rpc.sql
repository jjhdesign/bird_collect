-- ============================================================
-- 랭킹 집계 RPC (C1 수정)
-- users RLS가 본인 행만 SELECT 허용하므로 일반 쿼리로는
-- 타인 닉네임이 null이 된다. SECURITY DEFINER로 RLS 우회하여
-- 닉네임 + 해금 수만 안전하게 집계해 반환한다.
-- ============================================================

create or replace function get_ranking(p_limit int default 50)
returns table (user_id uuid, nickname text, unlocked_count bigint)
language sql
security definer
set search_path = public
as $$
  select u.id as user_id, u.nickname, count(ub.id) as unlocked_count
  from user_birds ub
  join users u on u.id = ub.user_id
  group by u.id, u.nickname
  order by unlocked_count desc
  limit p_limit;
$$;

-- 비로그인(anon)·로그인(authenticated) 모두 랭킹 조회 가능
grant execute on function get_ranking(int) to anon, authenticated;
