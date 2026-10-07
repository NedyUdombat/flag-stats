-- =============================================================================
-- Migration 30: resubmitting rejected results and stat lines
--
-- Before this, a rejection was a dead end for coaches: RLS only let them
-- edit their OWN PENDING submissions, so once a result or stat line was
-- rejected nobody but a league admin could correct it.
--
-- These policies let the original submitter — or a coach of the team
-- involved (the submitter may have moved on) — update a REJECTED row, and
-- only into a resubmission: the new row must be pending and submitted by
-- the person resubmitting. They add to the existing policies (permissive
-- policies are OR'ed), so nothing already allowed changes.
-- Idempotent: safe to re-run.
-- =============================================================================

drop policy if exists "Submitters and team coaches can resubmit rejected results" on public.results;
create policy "Submitters and team coaches can resubmit rejected results"
  on public.results for update
  using (
    verification_status = 'rejected'
    and (
      submitted_by = (select auth.uid())
      or exists (
        select 1 from public.fixtures f
        where f.id = results.fixture_id
          and (
            public.has_role('team_coach'::app_role, null::uuid, null::uuid, f.home_team_id)
            or public.has_role('team_coach'::app_role, null::uuid, null::uuid, f.away_team_id)
          )
      )
    )
  )
  with check (
    verification_status = 'pending'
    and submitted_by = (select auth.uid())
  );

drop policy if exists "Submitters and team coaches can resubmit rejected stat lines" on public.athlete_game_stats;
create policy "Submitters and team coaches can resubmit rejected stat lines"
  on public.athlete_game_stats for update
  using (
    verification_status = 'rejected'
    and (
      submitted_by = (select auth.uid())
      or public.has_role('team_coach'::app_role, null::uuid, null::uuid, team_id)
    )
  )
  with check (
    verification_status = 'pending'
    and submitted_by = (select auth.uid())
  );