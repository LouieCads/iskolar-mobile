/**
 * Client-side Scholarship Deadline Utilities
 * 
 * Mirror of server-side deadline logic for consistent behavior
 */

export interface ScholarshipActionPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canArchive: boolean;
  canAcceptApplications: boolean;
  canViewApplications: boolean;
  canUpdateApplicationStatus: boolean;
  isDeadlinePassed: boolean;
}

/**
 * Checks if a scholarship deadline has passed
 */
export const isDeadlinePassed = (deadline: string | Date | null | undefined): boolean => {
  if (!deadline) return false;
  return new Date() > new Date(deadline);
};

/**
 * Gets action permissions based on deadline status
 */
export const getScholarshipActionPermissions = (
  deadline: string | Date | null | undefined
): ScholarshipActionPermissions => {
  const deadlinePassed = isDeadlinePassed(deadline);

  return {
    canEdit: !deadlinePassed,
    canDelete: !deadlinePassed,
    canArchive: deadlinePassed,
    canAcceptApplications: !deadlinePassed,
    canViewApplications: true,
    canUpdateApplicationStatus: true,
    isDeadlinePassed: deadlinePassed,
  };
};

/**
 * Gets a human-readable message about scholarship status based on deadline
 */
export const getDeadlineStatusMessage = (deadline: string | Date | null | undefined): string => {
  if (!deadline) {
    return 'No deadline set';
  }

  if (isDeadlinePassed(deadline)) {
    return 'Scholarship deadline has passed.';
  }

  return 'Scholarship accepting applications';
};
