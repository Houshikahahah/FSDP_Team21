import { supabase } from "./supabaseClient";

// 🧮 Generate PIN
function generateRandomPin(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pin = "";
  for (let i = 0; i < length; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
}

// 🏗 CREATE ORGANISATION + AUTO ADD OWNER AS MEMBER
export async function createOrganisation(name, owner_id) {
  if (!name || !owner_id) return { error: { message: "Missing details" } };

  const pin = generateRandomPin();
  const payload = { name: name.trim(), pin, owner_id };

  // create org
  const { data: org, error: orgError } = await supabase
    .from("organisations")
    .insert([payload])
    .select()
    .maybeSingle();

  if (orgError) return { error: orgError, data: null };

  // add owner as member
  await supabase.from("organisation_members").insert([
    {
      organisation_id: org.id,
      user_id: owner_id,
      role: "owner",
      owner_id: owner_id,
    },
  ]);

  return { data: org, error: null };
}

// 👥 JOIN ORG
export async function joinOrganisation(name, pin, user_id) {
  if (!name || !pin || !user_id)
    return { error: { message: "Missing fields" } };

  const { data: org, error: orgError } = await supabase
    .from("organisations")
    .select("id, owner_id, name")
    .eq("name", name.trim())
    .eq("pin", pin.trim())
    .maybeSingle();

  if (orgError) return { error: orgError };
  if (!org) return { error: { message: "Invalid name or PIN" } };

  // check existing membership
  const { data: existing } = await supabase
    .from("organisation_members")
    .select("*")
    .eq("organisation_id", org.id)
    .eq("user_id", user_id)
    .maybeSingle();

  if (existing) return { error: { message: "Already a member" } };

  // insert member
  const { data, error } = await supabase
    .from("organisation_members")
    .insert([
      {
        organisation_id: org.id,
        user_id,
        role: "developer",
        owner_id: org.owner_id,
      },
    ])
    .select()
    .maybeSingle();

  return { data, error };
}

// 🧠 GET MY ORGS
export async function getMyOrganisations(user_id) {
  if (!user_id) return { error: { message: "Missing user ID" } };

  try {
    const { data: owned } = await supabase
      .from("organisations")
      .select("*")
      .eq("owner_id", user_id);

    const { data: memberRows } = await supabase
      .from("organisation_members")
      .select("organisation_id")
      .eq("user_id", user_id);

    const memberIds = memberRows?.map((m) => m.organisation_id) || [];

    const { data: joined } = await supabase
      .from("organisations")
      .select("*")
      .in("id", memberIds);

    const combined = [...(owned || []), ...(joined || [])];

    // remove duplicates using a Map
    const unique = [
      ...new Map(combined.map(org => [org.id, org])).values()
    ];

    return { data: unique, error: null };

  } catch (err) {
    return { data: [], error: err };
  }
}

// 👀 GET MEMBERS
export async function getMembers(orgId) {
  const { data, error } = await supabase
    .from("organisation_members")
    .select(`
      user_id,
      role,
      organisation_id,
      owner_id,
      profiles:user_id (
        username,
        description,
        avatar_color
      )
    `)
    .eq("organisation_id", orgId);

  if (error) return { data: [], error };

  const members = data.map((m) => ({
    user_id: m.user_id,
    role: m.role,
    username: m.profiles?.username || null,
    description: m.profiles?.description || null,
    avatar_color: m.profiles?.avatar_color || "#000",
  }));

  // SORT — owner → alphabetical
  members.sort((a, b) => {
    if (a.role === "owner") return -1;
    if (b.role === "owner") return 1;
    return (a.username || "").localeCompare(b.username || "");
  });

  return { data: members, error: null };
}

// ❌ KICK MEMBER
export async function kickMember(orgId, memberId, currentUserId) {
  const { data: org } = await supabase
    .from("organisations")
    .select("owner_id")
    .eq("id", orgId)
    .maybeSingle();

  if (!org || org.owner_id !== currentUserId)
    return { error: { message: "Only owner can kick" } };

  const { data, error } = await supabase
    .from("organisation_members")
    .delete()
    .eq("organisation_id", orgId)
    .eq("user_id", memberId);

  return { data, error };
}

// 🚪 LEAVE
export async function leaveOrganisation(orgId, userId) {
  const { error } = await supabase
    .from("organisation_members")
    .delete()
    .match({ organisation_id: orgId, user_id: userId });

  return { error };
}

// 🗑 DELETE ORG (OWNER ONLY)
export async function deleteOrganisation(orgId, userId) {
  const { data: org } = await supabase
    .from("organisations")
    .select("owner_id")
    .eq("id", orgId)
    .maybeSingle();

  if (!org || org.owner_id !== userId)
    return { error: { message: "Only owner can delete" } };

  const { error } = await supabase
    .from("organisations")
    .delete()
    .eq("id", orgId);

  return { error };
}
