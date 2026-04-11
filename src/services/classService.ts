import { supabase } from "./supabaseClient";

const JOIN_CODE_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";

export function generateJoinCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)];
  }
  return code;
}

export interface CreateClassParams {
  teacherId: string;
  name: string;
  description?: string;
  gradeLevel?: string;
  subject?: string;
}

export async function createClass(params: CreateClassParams) {
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("rt_classes")
    .insert({
      teacher_id: params.teacherId,
      name: params.name,
      description: params.description || null,
      grade_level: params.gradeLevel || null,
      subject: params.subject || null,
      join_code: generateJoinCode(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTeacherClasses(teacherId: string) {
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("rt_classes")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function joinClassByCode(studentId: string, joinCode: string) {
  if (!supabase) throw new Error("Supabase not configured");

  // Find the class
  const { data: classData, error: findError } = await supabase
    .from("rt_classes")
    .select("id")
    .eq("join_code", joinCode.trim().toLowerCase())
    .eq("is_active", true)
    .single();

  if (findError || !classData) {
    throw new Error("Invalid join code");
  }

  // Join the class
  const { error: joinError } = await supabase
    .from("rt_class_members")
    .insert({
      class_id: classData.id,
      student_id: studentId,
    });

  if (joinError) {
    if (joinError.code === "23505") {
      throw new Error("Already a member of this class");
    }
    throw joinError;
  }

  return classData.id;
}

export async function getStudentClasses(studentId: string) {
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("rt_class_members")
    .select("class_id, joined_at, rt_classes(id, name, description, grade_level, join_code)")
    .eq("student_id", studentId);

  if (error) throw error;
  return data || [];
}

export async function getClassDebates(classId: string) {
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("rt_debates")
    .select("id, topic_title, topic_category, winner_id, duration, educational_mode, created_at, user_id")
    .eq("class_id", classId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

export async function getClassMembers(classId: string) {
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("rt_class_members")
    .select("student_id, joined_at, rt_profiles(id, full_name, email)")
    .eq("class_id", classId);

  if (error) throw error;
  return data || [];
}
