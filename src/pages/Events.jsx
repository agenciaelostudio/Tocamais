import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="min-h-screen bg-background relative overflow-hidden -mt-6 md:-mt-8 -mx-4 md:-mx-8 px-4 md:px-8 py-8 md:py-12">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[40%] h-[40%] bg-secondary/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-1 bg-gradient-to-r from-primary to-secondary rounded-full" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Cronograma</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight text-foreground">
              Sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Agenda</span>
            </h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-lg leading-relaxed font-medium">
              {user?.role === 'fan' ? 'Acompanhe os próximos shows e não perca nenhuma batida.' : 'Gerencie seus compromissos e disponibilidade em um só lugar.'}
            </p>
          </div>
          <div className="bg-card/40 backdrop-blur-md border border-white/5 p-1.5 rounded-2xl shadow-xl">
            <Tabs value={view} onValueChange={setView}>
              <TabsList className="bg-transparent border-0 gap-1">
                <TabsTrigger value="list" className="rounded-xl px-6 data-[state=active]:bg-background/80 font-bold">Lista</TabsTrigger>
                <TabsTrigger value="calendar" className="rounded-xl px-6 data-[state=active]:bg-background/80 font-bold">Calendário</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        {view === 'calendar' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 md:p-12 shadow-2xl"
          >
            {isArtist && (
              <div className="mb-10 rounded-3xl border border-white/5 bg-white/5 p-6 md:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 size={16} />
                      Disponibilidade do Artista
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      Selecione os dias para sinalizar quando você está livre para contratações.
                    </p>
                    <p className="text-xs font-bold text-primary mt-2">
                      {availableDates.length} dia(s) selecionado(s) este ano.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={handleConnectGoogleCalendar}
                      disabled={!isGoogleCalendarConfigured || syncGoogleMutation.isPending}
                      className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 h-12 font-bold"
                    >
                      <Link2 size={14} className="mr-2" />
                      {isGoogleConnected ? 'Reconectar Google' : 'Conectar Google'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => loadGoogleBusyDaysForYear(currentMonth.getFullYear()).catch((error) => {
                        toast.error(error.message || 'Nao foi possivel atualizar os dias ocupados do Google.');
                      })}
                      disabled={!isGoogleConnected || isLoadingGoogleBusyDates || syncGoogleMutation.isPending}
                      className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 h-12 font-bold"
                    >
                      <RefreshCcw size={14} className={`mr-2 ${isLoadingGoogleBusyDates ? 'animate-spin' : ''}`} />
                      {isLoadingGoogleBusyDates ? 'Sincronizando...' : 'Atualizar Google'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSaveAvailability}
                      disabled={saveAvailabilityMutation.isPending || !artistProfile?.id || isLoadingArtistProfile}
                      className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 h-12 font-bold"
                    >
                      {saveAvailabilityMutation.isPending ? 'Salvando...' : 'Salvar Local'}
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
                      className="rounded-xl bg-primary hover:bg-primary/90 h-12 font-black shadow-lg shadow-primary/20"
                    >
                      {syncGoogleMutation.isPending ? 'Sincronizando...' : 'Sincronizar Google'}
                    </Button>
                  </div>
                </div>
                {!isGoogleCalendarConfigured && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-4 text-center border-t border-white/5 pt-4">
                    ⚠️ Defina `VITE_GOOGLE_CLIENT_ID` para ativar a sincronização.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mb-10">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1))} className="h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5">
                <ChevronLeft size={24} />
              </Button>
              <h2 className="font-heading font-black text-3xl capitalize tracking-tight text-foreground">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1))} className="h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5">
                <ChevronRight size={24} />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-6 px-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <div key={d} className="py-2">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-3">
              {Array(startPadding).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
              {days.map((day) => {
                const dayEvents = events.filter((e) => e.event_date && isSameDay(parseISO(e.event_date), day));
                const isoDate = format(day, 'yyyy-MM-dd');
                const isAvailable = availableDateSet.has(isoDate);
                const isGoogleBusy = googleBusyDateSet.has(isoDate);
                const hasScheduledEvent = calendarEventDays.has(isoDate);
                const isPastDay = isBefore(day, today);

                const isToggleDisabled = !isArtist || isPastDay || hasScheduledEvent || isGoogleBusy;

                const dayStyle = `group/day relative p-3 rounded-[1.5rem] text-center min-h-[100px] transition-all duration-300 border flex flex-col items-center justify-start ${
                  isAvailable
                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                    : hasScheduledEvent
                      ? 'bg-primary/10 border-primary/40 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]'
                      : isGoogleBusy
                        ? 'bg-red-500/10 border-red-500/30'
                        : isToday(day)
                          ? 'bg-white/10 border-white/20'
                          : 'border-white/5 hover:border-white/20 hover:bg-white/5'
                } ${isPastDay ? 'opacity-40 grayscale-[0.5]' : ''}`;

                return (
                  <button
                    type="button"
                    key={day.toISOString()}
                    className={dayStyle}
                    onClick={() => toggleAvailabilityDate(day)}
                    disabled={isToggleDisabled}
                  >
                    <span className={`text-lg font-black tracking-tight mb-2 ${isToday(day) ? 'text-primary' : 'text-foreground'}`}>
                      {format(day, 'd')}
                    </span>

                    <div className="w-full space-y-1 mt-auto">
                      {isArtist && isAvailable && (
                        <div className="px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                          Disponível
                        </div>
                      )}
                      {isArtist && isGoogleBusy && !isAvailable && (
                        <div className="px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-red-500/20 text-red-400">
                          Google
                        </div>
                      )}
                      {dayEvents.map((e) => (
                        <div key={e.id} className="px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 truncate">
                          {isArtist ? e.venue_name : e.artist_name}
                        </div>
                      ))}
                    </div>
                    
                    {isToday(day) && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>

            {isArtist && (
              <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-t border-white/5 pt-8">
                <span className="flex items-center gap-3"><span className="w-4 h-4 rounded-lg bg-emerald-500/20 border border-emerald-500/50" /> Disponível</span>
                <span className="flex items-center gap-3"><span className="w-4 h-4 rounded-lg bg-red-500/10 border border-red-500/30" /> Ocupado Google</span>
                <span className="flex items-center gap-3"><span className="w-4 h-4 rounded-lg bg-primary/20 border border-primary/40" /> Show Agendado</span>
                <span className="flex items-center gap-3"><span className="w-4 h-4 rounded-lg bg-white/10 border border-white/20" /> Hoje</span>
              </div>
            )}
          </motion.div>
        )}

        {view === 'list' && (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-32 rounded-[2rem] bg-card/40 border border-white/5 animate-pulse" />
                ))
              ) : events.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-32 rounded-[3rem] bg-white/5 border border-dashed border-white/10"
                >
                  <div className="w-20 h-20 bg-primary/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-primary/20">
                    <Calendar className="w-10 h-10 text-primary opacity-40" />
                  </div>
                  <h3 className="text-2xl font-black mb-2 tracking-tight uppercase">Sua agenda está livre</h3>
                  <p className="text-muted-foreground font-medium max-w-xs mx-auto">Não há eventos agendados para este período.</p>
                </motion.div>
              ) : (
                events.map((e, i) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-xl p-8 shadow-2xl hover:border-primary/30 transition-all duration-500 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                      <div className="flex items-center gap-8">
                        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary/20 to-secondary/20 flex flex-col items-center justify-center border border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-500">
                          <span className="text-2xl font-black font-heading leading-none text-primary">
                            {e.event_date && format(parseISO(e.event_date), 'dd')}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                            {e.event_date && format(parseISO(e.event_date), 'MMM', { locale: ptBR })}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="font-heading font-black text-2xl tracking-tight group-hover:text-primary transition-colors">
                            {isArtist ? e.venue_name || 'Estabelecimento' : e.artist_name || 'Artista'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                            {e.start_time && (
                              <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest">
                                <Clock size={14} className="text-primary" /> 
                                {e.start_time} {e.end_time ? `- ${e.end_time}` : ''}
                              </div>
                            )}
                            {e.price && (
                              <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-widest">
                                <DollarSign size={14} /> 
                                R$ {e.price.toLocaleString('pt-BR')}
                              </div>
                            )}
                            {e.performance_type && (
                              <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                {e.performance_type}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <StatusBadge status={e.status} />
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 opacity-0 group-hover:opacity-100 transition-all">
                          <ChevronRight size={20} />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );

}
