import { redirect } from "next/navigation";
import {
  adminActionErrorMessage,
  buildAdminFeedbackUrl,
} from "../domain/admin-feedback";

export async function runAdminMutation(
  targetPath: string,
  successMessage: string,
  mutation: () => Promise<void>,
): Promise<never> {
  try {
    await mutation();
  } catch (reason) {
    redirect(
      buildAdminFeedbackUrl(
        targetPath,
        "error",
        adminActionErrorMessage(reason),
      ),
    );
  }

  redirect(buildAdminFeedbackUrl(targetPath, "success", successMessage));
}
