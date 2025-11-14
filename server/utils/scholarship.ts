/**
 * Checks if a scholarship's deadline has passed
 */
export function isDeadlinePassed(deadline: Date | undefined | null): boolean {
  if (!deadline) return false;
  return new Date() > new Date(deadline);
}

export interface ScholarshipActionPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canArchive: boolean;
  canAcceptApplications: boolean;
  canViewApplications: boolean;
  canUpdateApplicationStatus: boolean;
  isClosed: boolean;
}

/**
 * Gets action permissions based on scholarship status
 * @param status - (draft, active, closed, suspended, archived)
 */
export function getScholarshipActionPermissions(status: string): ScholarshipActionPermissions {
  const isClosed = status === 'closed';
  
  return {
    canEdit: !isClosed,                      
    canDelete: !isClosed,                    
    canArchive: isClosed,                    
    canAcceptApplications: !isClosed,        
    canViewApplications: true,               
    canUpdateApplicationStatus: true,       
    isClosed: isClosed,
  };
};