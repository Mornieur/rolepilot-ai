alter table public.job_notification_events
  drop constraint job_notification_events_error_classification_check;

alter table public.job_notification_events
  add constraint job_notification_events_error_classification_check
  check (error_classification is null or error_classification in (
    'configuration', 'timeout', 'unauthorized', 'rate_limit', 'bad_request',
    'telegram_unavailable', 'persistence_failure', 'unknown'
  ));
