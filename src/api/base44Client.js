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
  RepertoireSong: 'musicas_repertorio',
  Order: 'pedidos',
  Poll: 'votacoes',
  PollOption: 'votacao_opcoes',
  Vote: 'votacao_votos',
};

// --- LOCAL STORAGE MOCK DB ---
const getLocalDB = () => {
  if (typeof window === 'undefined') return {};
  const db = localStorage.getItem('tocamais_db');
  return db ? JSON.parse(db) : { users: [] };
};

const saveLocalDB = (db) => {
  if (typeof window !== 'undefined') localStorage.setItem('tocamais_db', JSON.stringify(db));
};

const getLocalUser = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('tocamais_user');
  return user ? JSON.parse(user) : null;
};

const setLocalUser = (user) => {
  if (typeof window !== 'undefined') {
    if (user) localStorage.setItem('tocamais_user', JSON.stringify(user));
    else localStorage.removeItem('tocamais_user');
  }
};
// -----------------------------

function ensureConfigured() {
  if (!isSupabaseConfigured) {
    console.warn('⚠️ Base44/Supabase is not configured. Using LocalStorage Mock.');
  }
}

function mapSortField(field) {
  if (field === 'created_date') return 'created_at';
  if (field === 'updated_date') return 'updated_at';
  return field;
}

function normalizeRecord(record) {
  if (!record) return record;
  return {
    ...record,
    created_date: record.created_at ?? record.created_date ?? null,
    updated_date: record.updated_at ?? record.updated_date ?? null,
  };
}

function withNormalizedRecords(records) {
  return (records ?? []).map(normalizeRecord);
}

function generateSlug(text) {
  if (!text) return 'artista-' + Math.random().toString(36).substr(2, 5);
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

async function runQuery(queryPromise) {
  const { data, error } = await queryPromise;
  if (error) throw error;
  return data;
}

function createEntityApi(entityName) {
  const table = ENTITY_TABLES[entityName];

  return {
    async filter(filters = {}, sort, limit) {
      if (!isSupabaseConfigured) {
        const db = getLocalDB();
        let records = db[table] || [];
        
        Object.entries(filters || {}).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') return;
          if (Array.isArray(value)) records = records.filter(r => value.includes(r[key]));
          else records = records.filter(r => r[key] === value);
        });

        if (sort) {
          const descending = sort.startsWith('-');
          const column = mapSortField(descending ? sort.slice(1) : sort);
          records.sort((a, b) => {
            if (a[column] < b[column]) return descending ? 1 : -1;
            if (a[column] > b[column]) return descending ? -1 : 1;
            return 0;
          });
        }

        if (typeof limit === 'number') records = records.slice(0, limit);
        return withNormalizedRecords(records);
      }

      const supabase = getSupabase();
      let query = supabase.from(table).select('*');

      Object.entries(filters || {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) { query = query.in(key, value); return; }
        query = query.eq(key, value);
      });

      if (sort) {
        const descending = sort.startsWith('-');
        const column = mapSortField(descending ? sort.slice(1) : sort);
        query = query.order(column, { ascending: !descending });
      }

      if (typeof limit === 'number') query = query.limit(limit);

      const data = await runQuery(query);
      return withNormalizedRecords(data);
    },

    async create(payload) {
      if (!isSupabaseConfigured) {
        const db = getLocalDB();
        const record = { 
          ...payload, 
          id: Math.random().toString(36).substr(2, 9), 
          created_at: new Date().toISOString() 
        };
        db[table] = [...(db[table] || []), record];
        saveLocalDB(db);
        return normalizeRecord(record);
      }

      const supabase = getSupabase();
      const data = await runQuery(supabase.from(table).insert(payload).select('*').single());
      return normalizeRecord(data);
    },

    async update(id, payload) {
      if (!isSupabaseConfigured) {
        const db = getLocalDB();
        let updatedRecord = null;
        db[table] = (db[table] || []).map(r => {
          if (r.id === id) {
            updatedRecord = { ...r, ...payload, updated_at: new Date().toISOString() };
            return updatedRecord;
          }
          return r;
        });
        saveLocalDB(db);
        return normalizeRecord(updatedRecord);
      }

      const supabase = getSupabase();
      const data = await runQuery(supabase.from(table).update(payload).eq('id', id).select('*').single());
      return normalizeRecord(data);
    },

    async delete(id) {
      if (!isSupabaseConfigured) {
        const db = getLocalDB();
        db[table] = (db[table] || []).filter(r => r.id !== id);
        saveLocalDB(db);
        return { success: true };
      }

      const supabase = getSupabase();
      await runQuery(supabase.from(table).delete().eq('id', id));
      return { success: true };
    },
  };
}

async function fetchCurrentProfile() {
  if (!isSupabaseConfigured) {
    const user = getLocalUser();
    if (!user) return null;
    
    const db = getLocalDB();
    let profile = db.users?.find(u => u.email === user.email);
    
    if (!profile) {
      profile = {
        ...user,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
        role: user.user_metadata?.role || 'fan',
        onboarding_complete: Boolean(user.user_metadata?.onboarding_complete),
      };
      db.users = [...(db.users || []), profile];
      saveLocalDB(db);
    } else {
      // Ensure top-level properties are always synced from user_metadata for the mock
      profile = {
        ...profile,
        full_name: profile.user_metadata?.full_name || profile.full_name || profile.email?.split('@')[0] || 'Usuario',
        role: profile.user_metadata?.role || profile.role || 'fan',
        onboarding_complete: Boolean(profile.user_metadata?.onboarding_complete || profile.onboarding_complete),
      };
    }
    
    await ensureRoleRecordsMock(profile);
    return normalizeRecord(profile);
  }

  const supabase = getSupabase();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!authUser) return null;

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (profileError) throw profileError;

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
    if (insertError) throw insertError;
  }

  const mergedProfile = {
    ...baseProfile,
    email: authUser.email,
    full_name: baseProfile.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuario',
  };

  await ensureRoleRecords(mergedProfile);
  return normalizeRecord(mergedProfile);
}

async function ensureRoleRecordsMock(user) {
  const db = getLocalDB();
  if (user.role === 'artist') {
    const exists = db.artist_profiles?.find(p => p.user_email === user.email);
    if (!exists) {
      db.artist_profiles = [...(db.artist_profiles || []), {
        id: Math.random().toString(36).substr(2, 9),
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
        slug: generateSlug(user.full_name || user.email?.split('@')[0]),
      }];
      saveLocalDB(db);
    }
  }
}

async function ensureRoleRecords(user) {
  const supabase = getSupabase();

  if (user.role === 'artist') {
    const { data, error } = await supabase.from('artist_profiles').select('id').eq('user_email', user.email).limit(1);
    if (error) throw error;
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
        slug: generateSlug(user.full_name || user.email?.split('@')[0]),
      });
      if (createError) throw createError;
    }
  }

  if (user.role === 'bar_owner') {
    const { data, error } = await supabase.from('venues').select('id').eq('owner_email', user.email).limit(1);
    if (error) throw error;
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
      if (createError) throw createError;
    }
  }
}

async function uploadFile({ file }) {
  if (!isSupabaseConfigured) {
    // Return a dummy image or a blob URL for local testing
    return { file_url: URL.createObjectURL(file) };
  }

  const supabase = getSupabase();
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const path = `uploads/${safeName}`;

  const { error } = await supabase.storage.from('media').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return { file_url: data.publicUrl };
}

export const base44 = {
  auth: {
    async me() {
      return fetchCurrentProfile();
    },

    async updateMe(payload) {
      const currentUser = await fetchCurrentProfile();
      if (!currentUser) throw new Error('User is not authenticated.');

      if (!isSupabaseConfigured) {
        const db = getLocalDB();
        db.users = (db.users || []).map(u => {
          if (u.id === currentUser.id) {
            return { ...u, ...payload, full_name: payload.full_name ?? u.full_name };
          }
          return u;
        });
        saveLocalDB(db);
        
        // Also update local user metadata cache
        const localUser = getLocalUser();
        if (localUser) {
           localUser.user_metadata = { ...localUser.user_metadata, ...payload };
           setLocalUser(localUser);
        }
        return fetchCurrentProfile();
      }

      const supabase = getSupabase();
      const updates = { ...payload };
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
        const { error: authUpdateError } = await supabase.auth.updateUser({ data: { full_name: payload.full_name } });
        if (authUpdateError) throw authUpdateError;
      }

      const { error: profileError } = await supabase
        .from('users')
        .update({ ...updates, email: currentUser.email, full_name: fullName })
        .eq('id', currentUser.id);

      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.updateUser({ data: metadata });
      if (metadataError) throw metadataError;

      return fetchCurrentProfile();
    },

    async signInWithPassword({ email, password }) {
      if (!isSupabaseConfigured) {
        const db = getLocalDB();
        const user = db.users?.find(u => u.email === email && u.password === password);
        if (!user) throw new Error('Invalid credentials (Local Mock). Did you register?');
        setLocalUser(user);
        return { session: true, user };
      }

      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },

    async signUp({ email, password, options }) {
      if (!isSupabaseConfigured) {
        const db = getLocalDB();
        if (db.users?.find(u => u.email === email)) throw new Error('User already exists (Local Mock)');
        
        const newUser = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          password, // Storing plain text password ONLY for local dev mock!
          user_metadata: options?.data || {}
        };
        
        db.users = [...(db.users || []), newUser];
        saveLocalDB(db);
        setLocalUser(newUser);
        return { session: true, user: newUser };
      }

      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({ email, password, options });
      if (error) throw error;
      return data;
    },

    async logout(redirectTo = '/') {
      if (!isSupabaseConfigured) {
        setLocalUser(null);
      } else {
        const supabase = getSupabase();
        await supabase.auth.signOut();
      }

      if (typeof window !== 'undefined') {
        window.location.assign(redirectTo || '/');
      }
    },

    redirectToLogin() {
      if (typeof window !== 'undefined') window.location.assign('/');
    },
  },

  entities: Object.fromEntries(
    Object.keys(ENTITY_TABLES).map((entityName) => [entityName, createEntityApi(entityName)])
  ),

  integrations: {
    Core: { UploadFile: uploadFile },
  },
};
