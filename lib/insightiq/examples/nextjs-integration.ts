// Example: Next.js API Route Integration with InsightIQ AI
// File: app/api/insights/comments/route.ts
/*
import { NextRequest, NextResponse } from 'next/server';
import { InsightIQClient } from '../client';

// Initialize InsightIQ client
const insightiq = new InsightIQClient({
  username: process.env.INSIGHTIQ_USERNAME!,
  password: process.env.INSIGHTIQ_PASSWORD!,
  sandbox: process.env.NODE_ENV !== 'production'
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content_url, brand_profile_url, work_platform_id } = body;

    // Validate required fields
    if (!content_url || !brand_profile_url || !work_platform_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create comments analysis
    const analysis = await insightiq.commentsAnalytics.createAnalysis({
      work_platform_id,
      content_url,
      brand_profile_url
    });

    return NextResponse.json({
      success: true,
      analysis_id: analysis.id,
      message: 'Analysis started successfully'
    });

  } catch (error) {
    console.error('Comments analysis error:', error);
    
    // Handle APIError instances
    if (error instanceof Error && 'status' in error) {
      const apiError = error as any; // APIError
      return NextResponse.json(
        { error: apiError.message, details: apiError.details },
        { status: apiError.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// File: app/api/insights/comments/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'RELEVANT_COMMENTS';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get analysis insights
    const insights = await insightiq.commentsAnalytics.getInsights(id);
    
    // Get comments if analysis is complete
    let comments = null;
    if (insights.status === 'SUCCESS') {
      comments = await insightiq.commentsAnalytics.getComments(id, {
        type: type as any,
        limit,
        offset
      });
    }

    return NextResponse.json({
      insights,
      comments: comments?.data || null,
      metadata: comments?.metadata || null
    });

  } catch (error) {
    console.error('Get insights error:', error);
    return NextResponse.json(
      { error: 'Failed to get insights' },
      { status: 500 }
    );
  }
}

// File: app/api/insights/purchase-intent/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile_url, work_platform_id } = body;

    if (!profile_url || !work_platform_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const analysis = await insightiq.purchaseIntent.createAnalysis({
      work_platform_id,
      profile_url
    });

    return NextResponse.json({
      success: true,
      analysis_id: analysis.id,
      message: 'Purchase intent analysis started'
    });

  } catch (error) {
    console.error('Purchase intent analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to start analysis' },
      { status: 500 }
    );
  }
}

// File: app/api/insights/social-listening/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      work_platform_id, 
      keyword, 
      hashtag, 
      mention, 
      items_limit = 50 
    } = body;

    if (!work_platform_id || (!keyword && !hashtag && !mention)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let search;
    if (keyword) {
      search = await insightiq.socialListening.searchByKeyword(
        work_platform_id, 
        keyword, 
        { itemsLimit: items_limit }
      );
    } else if (hashtag) {
      search = await insightiq.socialListening.searchByHashtag(
        work_platform_id, 
        hashtag, 
        { itemsLimit: items_limit }
      );
    } else if (mention) {
      search = await insightiq.socialListening.searchByMention(
        work_platform_id, 
        mention, 
        { itemsLimit: items_limit }
      );
    }

    return NextResponse.json({
      success: true,
      search_id: search!.id,
      message: 'Social listening search started'
    });

  } catch (error) {
    console.error('Social listening error:', error);
    return NextResponse.json(
      { error: 'Failed to start search' },
      { status: 500 }
    );
  }
}

// File: app/api/webhooks/insightiq/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle InsightIQ webhook events
    console.log('Received InsightIQ webhook:', body);
    
    // Process different event types
    switch (body.event_type) {
      case 'COMMENTS_ANALYTICS.SUCCESS':
        // Handle completed comments analysis
        console.log('Comments analysis completed:', body.data);
        break;
        
      case 'PROFILE_COMMENTS_ANALYTICS.SUCCESS':
        // Handle completed purchase intent analysis
        console.log('Purchase intent analysis completed:', body.data);
        break;
        
      case 'CONTENTS_SEARCH.SUCCESS':
        // Handle completed social listening search
        console.log('Social listening search completed:', body.data);
        break;
        
      default:
        console.log('Unhandled event type:', body.event_type);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Environment variables (.env.local)
/*
INSIGHTIQ_USERNAME=your-username
INSIGHTIQ_PASSWORD=your-password
*/

// React Hook for using InsightIQ in components
// File: hooks/useInsightIQ.ts
import { useState, useCallback } from 'react';

interface AnalysisState {
  loading: boolean;
  data: any;
  error: string | null;
}

export function useCommentsAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    loading: false,
    data: null,
    error: null
  });

  const startAnalysis = useCallback(async (data: {
    content_url: string;
    brand_profile_url: string;
    work_platform_id: string;
  }) => {
    setState({ loading: true, data: null, error: null });

    try {
      const response = await fetch('/api/insights/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to start analysis');
      }

      setState({ loading: false, data: result, error: null });
      return result;

    } catch (error) {
      setState({ 
        loading: false, 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }, []);

  const getResults = useCallback(async (analysisId: string) => {
    try {
      const response = await fetch(`/api/insights/comments/${analysisId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get results');
      }

      setState(prev => ({ ...prev, data: { ...prev.data, ...result } }));
      return result;

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    startAnalysis,
    getResults
  };
}

// React Component Example
// File: components/CommentsAnalysis.tsx
/*
'use client';

import { useState } from 'react';
import { useCommentsAnalysis } from '../hooks/useInsightIQ';

export default function CommentsAnalysis() {
  const [formData, setFormData] = useState({
    content_url: '',
    brand_profile_url: '',
    work_platform_id: '69dc0dd2-b78e-4013-b0d6-5693bb48b548'
  });

  const { loading, data, error, startAnalysis, getResults } = useCommentsAnalysis();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await startAnalysis(formData);
      
      // Poll for results every 5 seconds using recursive setTimeout
      const poll = async () => {
        try {
          const results = await getResults(result.analysis_id);
          if (results.insights.status !== 'SUCCESS' && results.insights.status !== 'FAILURE') {
            setTimeout(poll, 5000);
          }
        } catch (error) {
          console.error('Polling error:', error);
          // Optionally stop polling on errors or retry with backoff
        }
      };
      setTimeout(poll, 5000);

    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Comments Analysis</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Content URL
          </label>
          <input
            type="url"
            value={formData.content_url}
            onChange={(e) => setFormData(prev => ({ ...prev, content_url: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Brand Profile URL
          </label>
          <input
            type="url"
            value={formData.brand_profile_url}
            onChange={(e) => setFormData(prev => ({ ...prev, brand_profile_url: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Starting Analysis...' : 'Start Analysis'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {data?.insights && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Analysis Results</h3>
          <p>Status: {data.insights.status}</p>
          {data.insights.status === 'SUCCESS' && (
            <div className="mt-2">
              <p>Total Comments: {data.insights.report_information.total_comment_count}</p>
              <p>Relevance Score: {data.insights.report_information.engagement_relevance_score}</p>
              <p>Positive: {data.insights.report_information.postive_comment_count}</p>
              <p>Negative: {data.insights.report_information.negative_comment_count}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
*/