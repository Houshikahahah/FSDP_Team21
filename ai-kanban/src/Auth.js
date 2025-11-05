

import { supabase } from './supabaseClient';


// Sign up
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}


// Login
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}


// Logout
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return error;
}


// Get current user
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}



