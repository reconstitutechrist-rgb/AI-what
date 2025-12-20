import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { deployments } from '../../deploy/route';
import { DeploymentIdSchema } from '@/types/railway';
import { logger } from '@/utils/logger';

// Railway GraphQL API endpoint
const RAILWAY_API_URL = 'https://backboard.railway.app/graphql/v2';

// Module-level logger
const log = logger.child({ route: '/api/railway/cleanup' });

// ============================================================================
// RAILWAY API HELPER
// ============================================================================

async function railwayQuery(query: string, variables?: Record<string, unknown>) {
  const token = process.env.RAILWAY_API_TOKEN;
  if (!token) {
    throw new Error('RAILWAY_API_TOKEN not configured');
  }

  const response = await fetch(RAILWAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    log.error('Railway API error', undefined, { errors: result.errors });
    throw new Error(result.errors[0]?.message || 'Railway API error');
  }

  return result.data;
}

/**
 * Delete a Railway project (and all its services/deployments)
 */
async function deleteProject(projectId: string): Promise<void> {
  await railwayQuery(
    `mutation ProjectDelete($id: String!) {
      projectDelete(id: $id)
    }`,
    { id: projectId }
  );
}

/**
 * Get project ID from service ID
 */
async function getProjectFromService(serviceId: string): Promise<string | null> {
  try {
    const data = await railwayQuery(
      `query GetService($serviceId: String!) {
        service(id: $serviceId) {
          projectId
        }
      }`,
      { serviceId }
    );

    return data.service?.projectId || null;
  } catch {
    return null;
  }
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    // Validate ID format
    const idValidation = DeploymentIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json({ error: 'Invalid deployment ID format' }, { status: 400 });
    }

    // Check user ownership - CRITICAL for security
    const deployment = deployments.get(id);
    if (deployment && deployment.userId !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this deployment' },
        { status: 403 }
      );
    }

    // The ID could be a service ID - get the project ID first
    const projectId = await getProjectFromService(id);

    let deleted = false;
    let deleteError: string | null = null;

    if (projectId) {
      // Delete the entire project (this cleans up all resources)
      try {
        await deleteProject(projectId);
        log.info('Deleted Railway project', { projectId });
        deleted = true;
      } catch (error) {
        deleteError = error instanceof Error ? error.message : 'Failed to delete project';
        log.error('Failed to delete Railway project', error, { projectId });
      }
    } else {
      // Try deleting as a project ID directly
      try {
        await deleteProject(id);
        log.info('Deleted Railway project', { projectId: id });
        deleted = true;
      } catch (error) {
        deleteError = error instanceof Error ? error.message : 'Failed to delete project';
        log.warn('Could not delete project', {
          id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Remove from local tracking
    if (deployment) {
      deployments.delete(id);
    }

    // Return proper response based on outcome
    if (deleted) {
      return NextResponse.json({ success: true });
    } else if (deleteError) {
      return NextResponse.json({ success: false, error: deleteError }, { status: 500 });
    } else {
      // Project not found - might already be deleted
      return NextResponse.json({
        success: true,
        message: 'Deployment not found or already deleted',
      });
    }
  } catch (error) {
    log.error('Railway cleanup error', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Cleanup failed' },
      { status: 500 }
    );
  }
}
