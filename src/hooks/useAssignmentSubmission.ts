import { useState, useCallback } from "react";
import { supabase } from "@/services/supabaseClient";
import { toast } from "sonner";

export function useAssignmentSubmission(userId: string | undefined) {
  const [submitting, setSubmitting] = useState(false);

  const submitAssignment = useCallback(
    async (assignmentId: string, debateId: string) => {
      if (!supabase || !userId) {
        toast.error("Not authenticated");
        return false;
      }

      setSubmitting(true);
      try {
        const { error } = await supabase
          .from("rt_assignment_submissions")
          .insert({
            assignment_id: assignmentId,
            student_id: userId,
            debate_id: debateId,
          });

        if (error) {
          // Check if already submitted
          if (error.code === "23505") {
            toast.info("Assignment already submitted");
            return false;
          }
          throw error;
        }

        toast.success("Assignment submitted successfully!");
        return true;
      } catch (error) {
        toast.error("Failed to submit assignment");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [userId]
  );

  return { submitAssignment, submitting };
}
