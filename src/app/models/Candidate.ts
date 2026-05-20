import { CandidateStage } from "./enums/candidateStage";

// candidate.model.ts
export interface Candidate {
    id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    vacancyId?: number;
    dateOfApplication?: string;
    email: string;
    contactNumber?: string;
    facebook?: string;
    twitter?: string;
    linkedIn?: string;
    keywords?: string;
    resumeFile: string;  // required, no ?
    notes?: string;
    stage: CandidateStage;
}

export interface CreateCandidateDto {
    firstName: string;
    middleName?: string;
    lastName: string;
    vacancyId: number | null;
    dateOfApplication: string | null;
    email: string;
    contactNumber?: string;
    facebook?: string;
    twitter?: string;
    linkedIn?: string;
    keywords?: string;
    notes?: string;
    stage: CandidateStage;
    resumeFile: File;  // required, no ?
}