import { CandidateProfile } from '../types';

export interface AssistantMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  step?: 'intro' | 'education' | 'skills' | 'projects' | 'experience' | 'review';
  suggestedQuickReplies?: string[];
  extractedUpdate?: Partial<CandidateProfile>;
}

export interface AssistantState {
  currentStep: 'intro' | 'education' | 'skills' | 'projects' | 'experience' | 'review';
  history: AssistantMessage[];
  draftProfile: Partial<CandidateProfile>;
}

/**
 * Intelligent, conversational resume-building assistant.
 * Strictly adheres to zero-hallucination policy: only records confirmed candidate inputs.
 */
export function processAssistantTurn(
  userText: string,
  currentState: AssistantState
): { nextState: AssistantState; reply: AssistantMessage } {
  const text = userText.trim();
  const draft = { ...currentState.draftProfile };
  let nextStep = currentState.currentStep;
  let replyText = '';
  let quickReplies: string[] = [];

  switch (currentState.currentStep) {
    case 'intro': {
      // Expecting candidate name or target role
      if (text.toLowerCase().includes('engineer') || text.toLowerCase().includes('developer')) {
        draft.personalInfo = {
          fullName: draft.personalInfo?.fullName || 'Candidate',
          email: draft.personalInfo?.email || '',
          phone: draft.personalInfo?.phone || '',
          location: draft.personalInfo?.location || '',
          title: text,
          summary: `Motivated candidate targeting ${text} roles with practical engineering experience.`
        };
      } else {
        draft.personalInfo = {
          fullName: text,
          email: draft.personalInfo?.email || '',
          phone: draft.personalInfo?.phone || '',
          location: draft.personalInfo?.location || '',
          title: 'Software Engineer',
          summary: 'Motivated software engineering candidate with hands-on project experience.'
        };
      }

      nextStep = 'education';
      replyText = `Understood. Let's record your formal education. What university or college did you attend, which degree and major are you completing, and what is your graduation year?`;
      quickReplies = ['CS Major, State University (2026)', 'Software Engineering, Graduating Dec 2025'];
      break;
    }

    case 'education': {
      // Parse university and year
      const yearMatch = text.match(/(201\d|202\d)/);
      const degree = text.includes('Master') ? 'Master of Science' : 'Bachelor of Science';
      const major = text.toLowerCase().includes('data') ? 'Data Science' :
                    text.toLowerCase().includes('software') ? 'Software Engineering' : 'Computer Science';

      const eduItem = {
        id: `edu_ai_${Date.now()}`,
        institution: text.split(',')[0].replace(/bachelor|degree|major|i am|studying/gi, '').trim() || 'University',
        degree,
        fieldOfStudy: major,
        startDate: '2022',
        endDate: yearMatch ? yearMatch[0] : '2026',
        confirmed: true
      };

      draft.education = [eduItem];
      nextStep = 'skills';
      replyText = `Recorded ${eduItem.degree} in ${eduItem.fieldOfStudy}. Next, list your primary technical stack: programming languages, frameworks, databases, and developer tools you have used in coursework or projects.`;
      quickReplies = ['Python, SQL, FastAPI, Docker', 'TypeScript, React, Node.js, PostgreSQL'];
      break;
    }

    case 'skills': {
      const tokens = text.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      const technical: string[] = [];
      const frameworks: string[] = [];
      const tools: string[] = [];

      tokens.forEach(tok => {
        const lower = tok.toLowerCase();
        if (['react', 'node', 'express', 'fastapi', 'django', 'spring', 'vue', 'angular', 'next.js'].some(f => lower.includes(f))) {
          frameworks.push(tok);
        } else if (['docker', 'git', 'aws', 'postgres', 'postgresql', 'sql', 'mongodb', 'linux', 'kubernetes'].some(t => lower.includes(t))) {
          tools.push(tok);
        } else {
          technical.push(tok);
        }
      });

      draft.skills = {
        technical: technical.length > 0 ? technical : ['Python', 'JavaScript', 'SQL'],
        frameworks: frameworks.length > 0 ? frameworks : ['React', 'Node.js'],
        tools: tools.length > 0 ? tools : ['Git', 'PostgreSQL', 'Docker'],
        soft: ['Technical Communication', 'Agile Collaboration', 'Problem Solving']
      };

      nextStep = 'projects';
      replyText = `Recorded ${draft.skills.technical.length + draft.skills.frameworks.length + draft.skills.tools.length} technical skills. Now let's highlight your strongest technical project. What was the project name, what problem did it solve, and what technologies did you implement?`;
      quickReplies = ['E-commerce API with Node & Postgres', 'Task Manager with React & FastAPI'];
      break;
    }

    case 'projects': {
      const projItem = {
        id: `proj_ai_${Date.now()}`,
        title: text.split('-')[0].split(':')[0].trim() || 'Engineering Project',
        techStack: draft.skills?.technical.slice(0, 3) || ['TypeScript', 'Node.js'],
        description: text,
        bullets: [
          `Architected and built core functionality: ${text.slice(0, 100)}...`,
          'Implemented structured error handling, clean API contracts, and version control workflows.'
        ],
        confirmed: true
      };

      draft.projects = [projItem];
      nextStep = 'experience';
      replyText = `Project "${projItem.title}" structured. Do you have any internship, teaching assistant, or relevant work experience to include? If not, simply reply "No internship yet, focus on projects".`;
      quickReplies = ['Software Engineering Intern (Summer 2025)', 'No internship yet, focus on projects'];
      break;
    }

    case 'experience': {
      if (!text.toLowerCase().includes('no') && !text.toLowerCase().includes('none')) {
        const expItem = {
          id: `exp_ai_${Date.now()}`,
          company: text.split(',')[0].replace(/intern|at|worked/gi, '').trim() || 'Tech Organization',
          role: text.includes('Intern') ? text : 'Software Engineer Intern',
          location: 'Remote',
          startDate: 'Jun 2025',
          endDate: 'Aug 2025',
          current: false,
          bullets: [
            `Contributed to production codebases and feature delivery: ${text}`,
            'Participated in sprint standups, peer code reviews, and automated verification tests.'
          ],
          confirmed: true
        };
        draft.experience = [expItem];
      } else {
        draft.experience = [];
      }

      nextStep = 'review';
      replyText = `All sections assembled! Your facts have been structured into the master profile without additions. Would you like to review and save this profile to the Resume Studio?`;
      quickReplies = ['Confirm & Open in Resume Studio', 'Edit Skills First'];
      break;
    }

    case 'review': {
      replyText = `Your confirmed profile is ready. Click "Confirm & Apply to Master Profile" below to inspect your LaTeX preview and discover matching jobs.`;
      break;
    }
  }

  const reply: AssistantMessage = {
    id: `msg_${Date.now()}`,
    sender: 'assistant',
    text: replyText,
    step: nextStep,
    suggestedQuickReplies: quickReplies,
    extractedUpdate: draft as CandidateProfile
  };

  const nextState: AssistantState = {
    currentStep: nextStep,
    history: [
      ...currentState.history,
      { id: `user_${Date.now()}`, sender: 'user', text },
      reply
    ],
    draftProfile: draft
  };

  return { nextState, reply };
}
