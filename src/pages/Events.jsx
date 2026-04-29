import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock, DollarSign, Link2, RefreshCcw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/shared/StatusBadge';
import { addDays, eachDayOfInterval, endOfMonth, format, getDay, isBefore, isSameDay, isToday, parseISO, startOfDay, startOfMonth, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GOOGLE_CALENDAR_API_BASE_URL = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const GOOGLE_AVAILABILITY_FLAG_KEY = 'tocamaisAvailability';
const GOOGLE_AVAILABILITY_SUMMARY = 'Disponivel para shows (TocaMais)';
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

let googleIdentityScriptPromise;

function sanitizeIsoDateList(values) {
  const safeValues = Array.isArray(values) ? values : [];
  return [...new Set(safeValues.filter((value) => ISO_DATE_REGEX.test(value)))].sort();
}

function extractIsoDateFromValue(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  if (ISO_DATE_REGEX.test(value)) {
    return value;
  }

  if (value.includes('T') && ISO_DATE_REGEX.test(value.slice(0, 10))) {
    return value.slice(0, 10);
  }

  return null;
}

function loadGoogleIdentityScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Agenda nao esta disponivel neste ambiente.'));
  }

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (googleIdentityScriptPromise) {
    return googleIdentityScriptPromise;
  }

  googleIdentityScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`);

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Nao foi possivel carregar o Google Identity Services.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Nao foi possivel carregar o Google Identity Services.'));
    document.head.appendChild(script);
  });

  return googleIdentityScriptPromise;
}

async function listGoogleEvents(requestFn, baseParams) {
  const items = [];
  let pageToken;

  do {
    const params = new URLSearchParams(baseParams);
    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    const payload = await requestFn(`/calendars/primary/events?${params.toString()}`);
    items.push(...(payload?.items || []));
    pageToken = payload?.nextPageToken;
  } while (pageToken);

  return items;
}

function mapGoogleBusyDates(events) {
  const busyDates = new Set();

  (events || []).forEach((event) => {
    if (!event || event.status === 'cancelled') {
      return;
    }

    if (event.transparency === 'transparent') {
      return;
    }

    if (event.extendedProperties?.private?.[GOOGLE_AVAILABILITY_FLAG_KEY] === 'true') {
      return;
    }

    const startDay = event.start?.date
      ? parseISO(event.start.date)
      : startOfDay(new Date(event.start?.dateTime || event.start?.date || ''));

    let endExclusive = event.end?.date
      ? parseISO(event.end.date)
      : addDays(startOfDay(new Date(event.end?.dateTime || event.start?.dateTime || '')), 1);

    if (Number.isNaN(startDay.getTime())) {
      return;
    }

    if (Number.isNaN(endExclusive.getTime()) || endExclusive <= startDay) {
      endExclusive = addDays(startDay, 1);
    }

    let cursor = startDay;
    while (cursor < endExclusive) {
      busyDates.add(format(cursor, 'yyyy-MM-dd'));
      cursor = addDays(cursor, 1);
    }
  });

  return [...busyDates].sort();
}

export default function Events({ user }) {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState([]);
  const [googleAuth, setGoogleAuth] = useState({ accessToken: null, expiresAt: 0 });
  const [googleBusyDates, setGoogleBusyDates] = useState([]);
  const [isLoadingGoogleBusyDates, setIsLoadingGoogleBusyDates] = useState(false);

  const isArtist = user?.role === 'artist';
  const isBar = user?.role === 'bar_owner';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isGoogleCalendarConfigured = Boolean(googleClientId);
  const today = startOfToday();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', user.email, user.role],
    queryFn: () => {
      if (isArtist) return base44.entities.Event.filter({ artist_email: user.email }, 'event_date');
      if (isBar) return base44.entities.Event.filter({ bar_owner_email: user.email }, 'event_date');
      return base44.entities.Event.filter({ status: 'scheduled' }, 'event_date', 50);
    },
  });

  const { data: artistProfile, isLoading: isLoadingArtistProfile } = useQuery({
    queryKey: ['artistProfileAvailability', user.email],
    queryFn: async () => {
      const profiles = await base44.entities.ArtistProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: isArtist && Boolean(user?.email),
  });

  const profileAvailabilityDates = useMemo(
    () => sanitizeIsoDateList([
      ...(artistProfile?.available_dates || []),
      ...(artistProfile?.social_links?.availability_dates || []),
    ]),
    [artistProfile]
  );

  useEffect(() => {
    if (!isArtist) {
      return;
    }

    setAvailableDates(profileAvailabilityDates);
  }, [isArtist, profileAvailabilityDates]);

  const isGoogleConnected = Boolean(googleAuth.accessToken);

  const requestGoogleAccessToken = useCallback(async (prompt = 'consent') => {
    if (!isGoogleCalendarConfigured) {
      throw new Error('Configure VITE_GOOGLE_CLIENT_ID para conectar com a Google Agenda.');
    }

    await loadGoogleIdentityScript();

    const response = await new Promise((resolve, reject) => {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: GOOGLE_CALENDAR_SCOPE,
        callback: (tokenResponse) => {
          if (tokenResponse?.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error || 'Falha ao autenticar na Google Agenda.'));
            return;
          }

          resolve(tokenResponse);
        },
      });

      tokenClient.requestAccessToken({ prompt });
    });

    const expiresIn = Number(response?.expires_in || 3600) * 1000;
    const accessToken = response?.access_token;

    if (!accessToken) {
      throw new Error('Google Agenda nao retornou um token valido.');
    }

    setGoogleAuth({
      accessToken,
      expiresAt: Date.now() + expiresIn,
    });

    return accessToken;
  }, [googleClientId, isGoogleCalendarConfigured]);

  const ensureGoogleAccessToken = useCallback(async () => {
    const hasValidToken = googleAuth.accessToken && googleAuth.expiresAt > Date.now() + 60_000;

    if (hasValidToken) {
      return googleAuth.accessToken;
    }

    return requestGoogleAccessToken(googleAuth.accessToken ? '' : 'consent');
  }, [googleAuth.accessToken, googleAuth.expiresAt, requestGoogleAccessToken]);

  const runGoogleCalendarRequest = useCallback(async (path, init = {}) => {
    const executeRequest = async (token) => {
      const response = await fetch(`${GOOGLE_CALENDAR_API_BASE_URL}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
      });

      return response;
    };

    let accessToken = await ensureGoogleAccessToken();
    let response = await executeRequest(accessToken);

    if (response.status === 401 || response.status === 403) {
      accessToken = await requestGoogleAccessToken('consent');
      response = await executeRequest(accessToken);
    }

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      const message = errorPayload?.error?.message || 'Falha ao comunicar com a Google Agenda.';
      throw new Error(message);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }, [ensureGoogleAccessToken, requestGoogleAccessToken]);

  const loadGoogleBusyDaysForYear = useCallback(async (year) => {
    if (!isArtist) {
      return;
    }

    const start = new Date(year, 0, 1).toISOString();
    const end = new Date(year + 1, 0, 1).toISOString();

    setIsLoadingGoogleBusyDates(true);
    try {
      const googleEvents = await listGoogleEvents(runGoogleCalendarRequest, {
        singleEvents: 'true',
        showDeleted: 'false',
        maxResults: '2500',
        orderBy: 'startTime',
        timeMin: start,
        timeMax: end,
      });

      setGoogleBusyDates(mapGoogleBusyDates(googleEvents));
    } finally {
      setIsLoadingGoogleBusyDates(false);
    }
  }, [isArtist, runGoogleCalendarRequest]);

  useEffect(() => {
    if (!isGoogleConnected || !isArtist) {
      return;
    }

    loadGoogleBusyDaysForYear(currentMonth.getFullYear()).catch((error) => {
      toast.error(error.message || 'Nao foi possivel atualizar os dias ocupados da Google Agenda.');
    });
  }, [currentMonth, isArtist, isGoogleConnected, loadGoogleBusyDaysForYear]);

  const saveAvailabilityMutation = useMutation({
    mutationFn: async (datesToSave) => {
      if (!artistProfile?.id) {
        throw new Error('Perfil do artista nao encontrado.');
      }

      const normalizedDates = sanitizeIsoDateList(datesToSave);
      const mergedSocialLinks = {
        ...(artistProfile.social_links || {}),
        availability_dates: normalizedDates,
      };

      const hasAvailableDatesColumn = Object.prototype.hasOwnProperty.call(artistProfile, 'available_dates');

      const payload = hasAvailableDatesColumn
        ? { available_dates: normalizedDates, social_links: mergedSocialLinks }
        : { social_links: mergedSocialLinks };

      await base44.entities.ArtistProfile.update(artistProfile.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artistProfileAvailability', user.email] });
      queryClient.invalidateQueries({ queryKey: ['artistProfile', user.email] });
      toast.success('Disponibilidade salva com sucesso.');
    },
    onError: (error) => {
      toast.error(error.message || 'Nao foi possivel salvar sua disponibilidade.');
    },
  });

  const syncGoogleMutation = useMutation({
    mutationFn: async () => {
      const normalizedDates = sanitizeIsoDateList(availableDates);

      if (!normalizedDates.length) {
        throw new Error('Marque pelo menos um dia disponivel antes de sincronizar.');
      }

      const years = normalizedDates.map((date) => Number(date.slice(0, 4))).filter((year) => Number.isFinite(year));
      const minYear = years.length ? Math.min(...years) : currentMonth.getFullYear();
      const maxYear = years.length ? Math.max(...years) : currentMonth.getFullYear();

      const existingAvailabilityEvents = await listGoogleEvents(runGoogleCalendarRequest, {
        singleEvents: 'true',
        showDeleted: 'false',
        maxResults: '2500',
        orderBy: 'startTime',
        privateExtendedProperty: `${GOOGLE_AVAILABILITY_FLAG_KEY}=true`,
        timeMin: new Date(minYear, 0, 1).toISOString(),
        timeMax: new Date(maxYear + 1, 0, 1).toISOString(),
      });

      const byDate = new Map();
      existingAvailabilityEvents.forEach((event) => {
        const startDate = event?.start?.date;
        if (startDate) {
          byDate.set(startDate, event);
        }
      });

      const targetDates = new Set(normalizedDates);
      const eventsToDelete = existingAvailabilityEvents.filter((event) => {
        const startDate = event?.start?.date;
        return startDate && !targetDates.has(startDate);
      });

      const datesToCreate = normalizedDates.filter((date) => !byDate.has(date));

      await Promise.all(
        eventsToDelete.map((event) => runGoogleCalendarRequest(`/calendars/primary/events/${event.id}`, { method: 'DELETE' }))
      );

      await Promise.all(
        datesToCreate.map((date) => runGoogleCalendarRequest('/calendars/primary/events', {
          method: 'POST',
          body: JSON.stringify({
            summary: GOOGLE_AVAILABILITY_SUMMARY,
            description: 'Criado automaticamente pelo TocaMais para sinalizar disponibilidade.',
            start: { date },
            end: { date: format(addDays(parseISO(date), 1), 'yyyy-MM-dd') },
            transparency: 'transparent',
            reminders: { useDefault: false },
            extendedProperties: {
              private: {
                [GOOGLE_AVAILABILITY_FLAG_KEY]: 'true',
              },
            },
          }),
        }))
      );

      await loadGoogleBusyDaysForYear(currentMonth.getFullYear());

      return {
        created: datesToCreate.length,
        removed: eventsToDelete.length,
      };
    },
    onSuccess: ({ created, removed }) => {
      toast.success(`Google Agenda sincronizada (${created} criados, ${removed} removidos).`);
    },
    onError: (error) => {
      toast.error(error.message || 'Nao foi possivel sincronizar com a Google Agenda.');
    },
  });

  const handleConnectGoogleCalendar = useCallback(async () => {
    try {
      await requestGoogleAccessToken('consent');
      await loadGoogleBusyDaysForYear(currentMonth.getFullYear());
      toast.success('Google Agenda conectada.');
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel conectar com a Google Agenda.');
    }
  }, [currentMonth, loadGoogleBusyDaysForYear, requestGoogleAccessToken]);

  const handleSaveAvailability = useCallback(() => (
    saveAvailabilityMutation.mutateAsync(availableDates).catch(() => null)
  ), [availableDates, saveAvailabilityMutation]);

  const handleSyncWithGoogle = useCallback(() => (
    saveAvailabilityMutation
      .mutateAsync(availableDates)
      .then(() => syncGoogleMutation.mutateAsync())
      .catch(() => null)
  ), [availableDates, saveAvailabilityMutation, syncGoogleMutation]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const calendarEventDays = useMemo(() => {
    const daySet = new Set();

    events.forEach((event) => {
      const date = extractIsoDateFromValue(event?.event_date);
      if (date) {
        daySet.add(date);
      }
    });

    return daySet;
  }, [events]);

  const availableDateSet = useMemo(() => new Set(availableDates), [availableDates]);
  const googleBusyDateSet = useMemo(() => new Set(googleBusyDates), [googleBusyDates]);

  const toggleAvailabilityDate = useCallback((day) => {
    if (!isArtist) {
      return;
    }

    const isoDate = format(day, 'yyyy-MM-dd');

    if (isBefore(day, today)) {
      return;
    }

    if (calendarEventDays.has(isoDate)) {
      toast.error('Esse dia ja possui show agendado.');
      return;
    }

    if (googleBusyDateSet.has(isoDate)) {
      toast.error('Esse dia esta ocupado na Google Agenda.');
      return;
    }

    setAvailableDates((previousDates) => {
      if (previousDates.includes(isoDate)) {
        return previousDates.filter((date) => date !== isoDate);
      }

      return [...previousDates, isoDate].sort();
    });
  }, [calendarEventDays, googleBusyDateSet, isArtist, today]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Agenda</h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === 'fan' ? 'Próximos shows' : 'Seus shows agendados'}
          </p>
        </div>
        <Tabs value={view} onValueChange={setView}>
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {view === 'calendar' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-6">
          {isArtist && (
            <div className="mb-5 rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Disponibilidade anual do artista
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique nos dias do calendario para marcar quando voce esta disponivel.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {availableDates.length} dia(s) selecionado(s).
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={handleConnectGoogleCalendar}
                    disabled={!isGoogleCalendarConfigured || syncGoogleMutation.isPending}
                  >
                    <Link2 size={14} className="mr-2" />
                    {isGoogleConnected ? 'Reconectar Google' : 'Conectar Google Agenda'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => loadGoogleBusyDaysForYear(currentMonth.getFullYear()).catch((error) => {
                      toast.error(error.message || 'Nao foi possivel atualizar os dias ocupados do Google.');
                    })}
                    disabled={!isGoogleConnected || isLoadingGoogleBusyDates || syncGoogleMutation.isPending}
                  >
                    <RefreshCcw size={14} className="mr-2" />
                    {isLoadingGoogleBusyDates ? 'Atualizando...' : 'Atualizar indisponiveis'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSaveAvailability}
                    disabled={saveAvailabilityMutation.isPending || !artistProfile?.id || isLoadingArtistProfile}
                  >
                    {saveAvailabilityMutation.isPending ? 'Salvando...' : 'Salvar disponibilidade'}
                  </Button>
                  <Button
                    onClick={handleSyncWithGoogle}
                    disabled={
                      !isGoogleCalendarConfigured
                      || !artistProfile?.id
                      || isLoadingArtistProfile
                      || saveAvailabilityMutation.isPending
                      || syncGoogleMutation.isPending
                    }
                  >
                    {syncGoogleMutation.isPending ? 'Sincronizando...' : 'Sincronizar com Google'}
                  </Button>
                </div>
              </div>
              {!isGoogleCalendarConfigured && (
                <p className="text-xs text-amber-600 mt-3">
                  Defina `VITE_GOOGLE_CLIENT_ID` para ativar a sincronizacao com a Google Agenda.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1))}>
              <ChevronLeft size={18} />
            </Button>
            <h2 className="font-heading font-bold text-lg capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1))}>
              <ChevronRight size={18} />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array(startPadding).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map((day) => {
              const dayEvents = events.filter((e) => e.event_date && isSameDay(parseISO(e.event_date), day));
              const isoDate = format(day, 'yyyy-MM-dd');
              const isAvailable = availableDateSet.has(isoDate);
              const isGoogleBusy = googleBusyDateSet.has(isoDate);
              const hasScheduledEvent = calendarEventDays.has(isoDate);
              const isPastDay = isBefore(day, today);

              const isToggleDisabled = !isArtist || isPastDay || hasScheduledEvent || isGoogleBusy;

              const dayStyle = `p-2 rounded-lg text-center min-h-[76px] transition-colors border ${
                isAvailable
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : hasScheduledEvent
                    ? 'bg-secondary/10 border-secondary/30'
                    : isGoogleBusy
                      ? 'bg-destructive/10 border-destructive/30'
                      : isToday(day)
                        ? 'bg-primary/10 border-primary/30'
                        : 'border-transparent hover:bg-muted'
              } ${isPastDay ? 'opacity-60' : ''}`;

              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  className={dayStyle}
                  onClick={() => toggleAvailabilityDate(day)}
                  disabled={isToggleDisabled}
                >
                  <span className={`text-sm ${isToday(day) ? 'text-primary font-bold' : ''}`}>{format(day, 'd')}</span>
                  {isArtist && isAvailable && (
                    <div className="mt-1 px-1 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-700 truncate">
                      Disponivel
                    </div>
                  )}
                  {isArtist && isGoogleBusy && !isAvailable && (
                    <div className="mt-1 px-1 py-0.5 rounded text-[10px] bg-destructive/20 text-destructive truncate">
                      Google ocupado
                    </div>
                  )}
                  {dayEvents.map((e) => (
                    <div key={e.id} className="mt-1 px-1 py-0.5 rounded text-xs bg-secondary/20 text-secondary truncate">
                      {e.artist_name || e.venue_name}
                    </div>
                  ))}
                </button>
              );
            })}
          </div>

          {isArtist && (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" /> Disponivel</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-destructive/20 border border-destructive/40" /> Ocupado no Google</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-secondary/20 border border-secondary/40" /> Show agendado</span>
            </div>
          )}
        </motion.div>
      )}

      {view === 'list' && (
        <div className="space-y-3">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="h-24 rounded-xl bg-card border border-border animate-pulse" />)
          ) : events.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Nenhum evento</p>
            </div>
          ) : (
            events.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold leading-none">{e.event_date && format(parseISO(e.event_date), 'dd')}</span>
                      <span className="text-xs text-muted-foreground uppercase">{e.event_date && format(parseISO(e.event_date), 'MMM', { locale: ptBR })}</span>
                    </div>
                    <div>
                      <p className="font-heading font-bold">{isArtist ? e.venue_name : e.artist_name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                        {e.start_time && <span className="flex items-center gap-1"><Clock size={10} /> {e.start_time} - {e.end_time}</span>}
                        {e.price && <span className="flex items-center gap-1"><DollarSign size={10} /> R$ {e.price.toLocaleString('pt-BR')}</span>}
                        {e.performance_type && <span>{e.performance_type}</span>}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={e.status} />
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
