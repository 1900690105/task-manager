import { supabase } from "@/lib/supabase";

export const loginUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log(session);

  return data;
};

export const logoutUser = async () => {
  await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};
