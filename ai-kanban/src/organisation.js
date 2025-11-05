import { supabase } from "./supabaseClient.js";

// 🧮 Helper to generate a random 6-character alphanumeric PIN
function generateRandomPin(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pin = "";
  for (let i = 0; i < length; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
}

// 🏗️ Create a new organisation (PIN auto-generated)
export async function createOrganisation(name, owner_id) {
  if (!name || !owner_id) {
    return { error: { message: "Organisation name and owner ID are required." } };
  }

  const pin = generateRandomPin(); // Auto-generate 6-char PIN

  const payload = {
    name: name.trim(),
    pin,
    owner_id,
  };

  const { data, error } = await supabase
    .from("organisations")
    .insert([payload])
    .select()
    .maybeSingle();

  return { data, error };
}

// 👥 Join an organisation using name + PIN
export async function joinOrganisation(name, pin, user_id) {
  if (!name || !pin || !user_id) {
    return { error: { message: "Organisation name, PIN, and user ID are required." } };
  }

  const trimmedName = name.trim();
  const trimmedPin = pin.trim();

  // Find organisation by exact name + PIN
  const { data: org, error: orgError } = await supabase
    .from("organisations")
    .select("id, owner_id, name")
    .eq("name", trimmedName)
    .eq("pin", trimmedPin)
    .maybeSingle();

  if (orgError) return { error: { message: `Supabase error: ${orgError.message}` } };
  if (!org) return { error: { message: "Invalid organisation name or PIN." } };

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from("organisation_members")
    .select("*")
    .eq("organisation_id", org.id)
    .eq("user_id", user_id)
    .maybeSingle();

  if (existingMember) return { error: { message: "You are already a member of this organisation." } };

  // Add user to organisation_members (skip owner)
  if (user_id === org.owner_id) return { error: { message: "Owner is already part of the org." } };

  const { data, error } = await supabase
    .from("organisation_members")
    .insert([{ organisation_id: org.id, user_id, role: "developer", owner_id: org.owner_id }])
    .select()
    .maybeSingle();

  return { data, error };
}

// 🧠 Get all organisations for a user
export async function getMyOrganisations(user_id) {
  if (!user_id) return { error: { message: "Missing user ID" } };

  // Organisations owned by the user
  const { data: owned, error: ownedError } = await supabase
    .from("organisations")
    .select("*")
    .eq("owner_id", user_id);
  if (ownedError) return { error: ownedError };

  // Organisations where user is a member (exclude those they own)
  const { data: memberRows, error: memberError } = await supabase
    .from("organisation_members")
    .select("organisation_id")
    .eq("user_id", user_id);
  if (memberError) return { error: memberError };

  const memberOrgIds = memberRows?.map(m => m.organisation_id) || [];
  let joined = [];

  if (memberOrgIds.length > 0) {
    const { data: joinedData, error: joinedError } = await supabase
      .from("organisations")
      .select("*")
      .in("id", memberOrgIds);
    if (joinedError) return { error: joinedError };

    // Remove any orgs already owned by user
    joined = joinedData.filter(org => !owned.some(o => o.id === org.id));
  }

  return { data: [...owned, ...joined], error: null };
}

// 👀 Get members of an organisation (exclude owner)
export async function getMembers(orgId) {
  if (!orgId) return { error: { message: "Org ID required." } };

  const { data, error } = await supabase
    .from("organisation_members")
    .select("*")
    .eq("organisation_id", orgId);

  if (data) {
    const filtered = data.filter(m => m.user_id !== m.owner_id);
    return { data: filtered, error };
  }

  return { data, error };
}

// ❌ Kick a member (owner only)
export async function kickMember(orgId, memberId, currentUserId) {
  if (!orgId || !memberId || !currentUserId)
    return { error: { message: "Org ID, member ID, and current user ID required." } };

  // Ensure only owner can delete
  const { data: org } = await supabase
    .from("organisations")
    .select("owner_id")
    .eq("id", orgId)
    .maybeSingle();

  if (!org || org.owner_id !== currentUserId) {
    return { error: { message: "Only the owner can kick members." } };
  }

  const { data, error } = await supabase
    .from("organisation_members")
    .delete()
    .eq("organisation_id", orgId)
    .eq("user_id", memberId);

  return { data, error };
}
