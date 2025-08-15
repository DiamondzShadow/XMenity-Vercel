import { NextRequest } from 'next/server';
export declare function GET(request: NextRequest, { params }: {
    params: {
        id: string;
    };
}): Promise<any>;
export declare function useCommentsAnalysis(): any;
