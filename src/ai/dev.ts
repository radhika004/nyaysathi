import { config } from 'dotenv';
config();

import '@/ai/flows/judgment-precedent-retrieval-flow.ts';
import '@/ai/flows/document-summarization-and-entity-extraction-flow.ts';
import '@/ai/flows/ai-legal-chat-guidance-flow.ts';