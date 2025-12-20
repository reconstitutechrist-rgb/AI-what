import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { deployments } from '../../deploy/route';
import { DeploymentIdSchema } from '@/types/railway';
import { logger } from '@/utils/logger';

// Railway GraphQL API endpoint
const RAILWAY_API_URL = 'https://backboard.railway.app/graphql/v2';

// Module-level logger
const log = logger.child({ route: '/api/railway/status' });

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
 * Get deployment status from Railway
 */
async function getDeploymentStatus(serviceId: string): Promise<{
  status: string;
  previewUrl: string | null;
  buildLogs: string[];
  error?: string;
}> {
  try {
    // Get service details including deployments
    const data = await railwayQuery(
      `query GetService($serviceId: String!) {
        service(id: $serviceId) {
          id
          name
          deployments(first: 1) {
            edges {
              node {
                id
                status
                staticUrl
                createdAt
              }
            }
          }
          serviceInstances {
            edges {
              node {
                id
                domains {
                  serviceDomains {
                    domain
                  }
                }
              }
            }
          }
        }
      }`,
      { serviceId }
    );

    const service = data.service;
    if (!service) {
      return {
        status: 'error',
        previewUrl: null,
        buildLogs: [],
        error: 'Service not found',
      };
    }

    // Get latest deployment
    const deployments = service.deployments?.edges || [];
    const latestDeployment = deployments[0]?.node;

    if (!latestDeployment) {
      return {
        status: 'building',
        previewUrl: null,
        buildLogs: ['Waiting for deployment to start...'],
      };
    }

    // Map Railway status to our status
    const railwayStatus = latestDeployment.status?.toUpperCase() || 'BUILDING';
    let status: string;

    switch (railwayStatus) {
      case 'SUCCESS':
      case 'DEPLOYED':
        status = 'ready';
        break;
      case 'FAILED':
      case 'CRASHED':
        status = 'error';
        break;
      case 'BUILDING':
      case 'INITIALIZING':
        status = 'building';
        break;
      case 'DEPLOYING':
        status = 'deploying';
        break;
      default:
        status = 'building';
    }

    // Get preview URL from domains or static URL
    let previewUrl = latestDeployment.staticUrl || null;

    const serviceInstances = service.serviceInstances?.edges || [];
    if (serviceInstances.length > 0) {
      const domains = serviceInstances[0]?.node?.domains?.serviceDomains || [];
      if (domains.length > 0) {
        previewUrl = `https://${domains[0].domain}`;
      }
    }

    return {
      status,
      previewUrl,
      buildLogs: [`Deployment status: ${railwayStatus}`],
      error: status === 'error' ? 'Deployment failed' : undefined,
    };
  } catch (error) {
    log.error('Error fetching Railway status', error);
    return {
      status: 'error',
      previewUrl: null,
      buildLogs: [],
      error: error instanceof Error ? error.message : 'Failed to get status',
    };
  }
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Check user ownership
    const deployment = deployments.get(id);
    if (deployment && deployment.userId !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to access this deployment' },
        { status: 403 }
      );
    }

    const status = await getDeploymentStatus(id);

    return NextResponse.json({
      id,
      ...status,
    });
  } catch (error) {
    log.error('Railway status error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get status' },
      { status: 500 }
    );
  }
}
