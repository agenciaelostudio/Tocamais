import { getSupabase, isSupabaseConfigured } from '@/api/supabaseClient';

const ENTITY_TABLES = {
  ArtistProfile: 'artist_profiles',
  ChatMessage: 'chat_messages',
  Event: 'events',
  Favorite: 'favorites',
  Notification: 'notifications',
  Proposal: 'proposals',
  Review: 'reviews',
  Tip: 'tips',
  Venue: 'venues',
};

function ensureConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }
}

function mapSortField(field) {
  if (field === 'created_date') {
    return 'created_at';
  }

  if (field === 'updated_date') {
    return 'updated_at';
  }

  return field;
}

function normalizeRecord(record) {
  if (!record) {
    return record;
  }

  return {
    ...record,
    created_date: record.created_at ?? record.created_date ?? null,
    updated_date: record.updated_at ?? record.updated_date ?? null,
  };
}

function withNormalizedRecords(records) {
  return (records ?? []).map(normalizeRecord);
}

async function runQuery(queryPromise) {
  const { data, error } = await queryPromise;

  if (error) {
    throw error;
  }

  return data;
}

function createEntityApi(entityName) {
  const table = ENTITY_TABLES[entityName];

  return {
    async filter(filters = {}, sort, limit) {
      ensureConfigured();
      const supabase = getSupabase();
      let query = supabase.from(table).select('*');

      Object.entries(filters || {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return;
        }

        if (Array.isArray(value)) {
          query = query.in(key, value);
          return;
        }

        query = query.eq(key, value);
      });

      if (sort) {
        const descending = sort.startsWith('-');
        const column = mapSortField(descending ? sort.slice(1) : sort);
        query = query.order(column, { ascending: !descending });
      }

      if (typeof limit === 'number') {
        query = query.limit(limit);
      }

      const data = await runQuery(query);
      return withNormalizedRecords(data);
    },

    async create(payload) {
      ensureConfigured();
      const supabase = getSupabase();
      const data = await runQuery(
        supabase.from(table).insert(payload).select('*').single()
      );
      return normalizeRecord(data);
    },

    async update(id, payload) {
      ensureConfigured();
      const supabase = getSupabase();
      const data = await runQuery(
        supabase.from(table).update(payload).eq('id', id).select('*').single()
      );
      return normalizeRecord(data);
    },

    async delete(id) {
      ensureConfigured();
      const supabase = getSupabase();
      await runQuery(
        supabase.from(table).delete().eq('id', id)
      );
      return { success: true };
    },
  };
}

async function fetchCurrentProfile() {
  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = getSupabase();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!authUser) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const baseProfile = profile ?? {
    id: authUser.id,
    email: authUser.email,
    full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuario',
    role: authUser.user_metadata?.role || 'fan',
    avatar_url: null,
    bio: authUser.user_metadata?.bio || null,
    phone: authUser.user_metadata?.phone || null,
    city: authUser.user_metadata?.city || null,
    state: authUser.user_metadata?.state || null,
    onboarding_complete: Boolean(authUser.user_metadata?.onboarding_complete),
  };

  if (!profile) {
    const { error: insertError } = await supabase.from('users').insert(baseProfile);
    if (insertError) {
      throw insertError;
    }
  }

  const mergedProfile = {
    ...baseProfile,
    email: authUser.email,
    full_name: baseProfile.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuario',
  };

  await ensureRoleRecords(mergedProfile);

  return normalizeRecord(mergedProfile);
}

async function ensureRoleRecords(user) {
  const supabase = getSupabase();

  if (user.role === 'artist') {
    const { data, error } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('user_email', user.email)
      .limit(1);

    if (error) {
      throw error;
    }

    if (!data?.length) {
      const { error: createError } = await supabase.from('artist_profiles').insert({
        user_id: user.id,
        user_email: user.email,
        stage_name: user.full_name || user.email,
        bio: user.bio || '',
        city: user.city || '',
        state: user.state || '',
        genres: [],
        performance_types: [],
        base_price: 0,
        avg_rating: 0,
        total_reviews: 0,
        total_tips: 0,
        available_days: [],
        social_links: {},
        is_active: true,
      });

      if (createError) {
        throw createError;
      }
    }
  }

  if (user.role === 'bar_owner') {
    const { data, error } = await supabase
      .from('venues')
      .select('id')
      .eq('owner_email', user.email)
      .limit(1);

    if (error) {
      throw error;
    }

    if (!data?.length) {
      const { error: createError } = await supabase.from('venues').insert({
        owner_email: user.email,
        name: '',
        description: '',
        address: '',
        city: user.city || '',
        state: user.state || '',
        photo_url: null,
        capacity: 0,
        phone: user.phone || '',
      });

      if (createError) {
        throw createError;
      }
    }
  }
}

async function uploadFile({ file }) {
  ensureConfigured();
  const supabase = getSupabase();
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const path = `uploads/${safeName}`;

  const { error } = await supabase.storage.from('media').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return { file_url: data.publicUrl };
}

export const base44 = {
  auth: {
    async me() {
      return fetchCurrentProfile();
    },

    async updateMe(payload) {
      ensureConfigured();
      const supabase = getSupabase();
      const currentUser = await fetchCurrentProfile();

      if (!currentUser) {
        throw new Error('User is not authenticated.');
      }

      const updates = {
        ...payload,
      };

      const fullName = payload.full_name ?? currentUser.full_name;
      const metadata = {
        full_name: fullName,
        role: updates.role ?? currentUser.role,
        city: updates.city ?? currentUser.city,
        state: updates.state ?? currentUser.state,
        phone: updates.phone ?? currentUser.phone,
        bio: updates.bio ?? currentUser.bio,
        onboarding_complete: updates.onboarding_complete ?? currentUser.onboarding_complete,
      };

      if (payload.full_name) {
        const { error: authUpdateError } = await supabase.auth.updateUser({
          data: { full_name: payload.full_name },
        });

        if (authUpdateError) {
          throw authUpdateError;
        }
      }

      const { error: profileError } = await supabase
        .from('users')
        .update({
          ...updates,
          email: currentUser.email,
          full_name: fullName,
        })
        .eq('id', currentUser.id);

      if (profileError) {
        throw profileError;
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: metadata,
      });

      if (metadataError) {
        throw metadataError;
      }

      return fetchCurrentProfile();
    },

    async signInWithPassword({ email, password }) {
      ensureConfigured();
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return data;
    },

    async signUp({ email, password, options }) {
      ensureConfigured();
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options,
      });

      if (error) {
        throw error;
      }

      return data;
    },

    async logout(redirectTo = '/') {
      if (isSupabaseConfigured) {
        const supabase = getSupabase();
        await supabase.auth.signOut();
      }

      if (typeof window !== 'undefined') {
        window.location.assign(redirectTo || '/');
      }
    },

    redirectToLogin() {
      if (typeof window !== 'undefined') {
        window.location.assign('/');
      }
    },
  },

  entities: Object.fromEntries(
    Object.keys(ENTITY_TABLES).map((entityName) => [entityName, createEntityApi(entityName)])
  ),

  integrations: {
    Core: {
      UploadFile: uploadFile,
    },
  },
};
