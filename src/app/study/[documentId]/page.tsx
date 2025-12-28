'use client';

import { use } from 'react';
import StudyReader from '@/components/study/StudyReader';

interface PageProps {
    params: Promise<{ documentId: string }>;
}

export default function StudyDocumentPage({ params }: PageProps) {
    const { documentId } = use(params);

    return <StudyReader documentId={documentId} />;
}
