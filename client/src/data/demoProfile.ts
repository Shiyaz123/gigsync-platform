import { CandidateProfile } from '../types';

/**
 * Fictional Candidate Profile for Demonstration & Academic Presentation
 * Name: Alex Morgan
 * Location: Bengaluru, Karnataka, India
 * Clearly marked as demonstrative illustrative data.
 */
export const ALEX_MORGAN_DEMO_PROFILE: CandidateProfile = {
  userId: 'usr_alex_morgan_demo',
  personalInfo: {
    fullName: 'Alex Morgan',
    email: 'alex.morgan.demo@example.com',
    phone: '+91 98765 43210',
    location: 'Bengaluru, Karnataka, India',
    title: 'Software Engineer',
    summary: 'Proactive Computer Science and Engineering candidate with practical experience developing robust web architectures, RESTful microservices, and machine learning models. Adept at collaborative problem solving, test-driven development, and cloud-native workflows.',
    github: 'https://github.com/alexmorgan-demo',
    linkedin: 'https://www.linkedin.com/in/alex-morgan-demo',
    portfolio: 'https://alexmorgan-demo.example.com'
  },
  education: [
    {
      id: 'edu_demo_1',
      institution: 'Example Institute of Technology',
      degree: 'Bachelor of Engineering',
      fieldOfStudy: 'Computer Science and Engineering',
      branch: 'Computer Science and Engineering',
      graduationYear: '2027',
      startDate: '2023',
      endDate: '2027',
      cgpa: '8.5',
      gpa: '8.5',
      honors: 'Dean’s Academic Merit List (Consecutive Semesters)',
      confirmed: true
    }
  ],
  experience: [
    {
      id: 'exp_demo_1',
      company: 'Innovatech Cloud Solutions',
      role: 'Software Engineering Intern',
      location: 'Bengaluru, Karnataka, India',
      employmentType: 'Internship',
      duration: 'Jun 2025 – Aug 2025',
      startDate: 'Jun 2025',
      endDate: 'Aug 2025',
      current: false,
      bullets: [
        'Architected and documented internal RESTful microservices using Flask and PostgreSQL, reducing query latency by 24% for reporting endpoints.',
        'Collaborated within an Agile engineering team of 6, developing modular React dashboard widgets with Tailwind CSS and TypeScript.',
        'Authored comprehensive PyTest and integration test suites achieving 92% code coverage across key authentication modules.'
      ],
      responsibilities: [
        'Built REST API endpoints for telemetry and activity logging.',
        'Maintained high unit test coverage with PyTest.'
      ],
      confirmed: true
    }
  ],
  projects: [
    {
      id: 'proj_demo_1',
      title: 'CampusSphere – Student Academic Collaboration Portal',
      role: 'Lead Full-Stack Developer',
      description: 'Full-stack educational networking platform facilitating study group coordination, course material exchange, and automated schedule synchronization.',
      technologies: ['React', 'Django', 'PostgreSQL', 'Tailwind CSS', 'Docker'],
      techStack: ['React', 'Django', 'PostgreSQL', 'Tailwind CSS', 'Docker'],
      bullets: [
        'Engineered responsive frontend with React and Tailwind CSS, supporting 1,200+ simulated active campus sessions.',
        'Implemented JWT-based role authorization and secure REST APIs in Django connected to a partitioned PostgreSQL schema.',
        'Containerized backend application with Docker and configured continuous linting and testing pipelines.'
      ],
      keyFeatures: [
        'JWT-based role-based access control.',
        'Real-time schedule synchronization and group material exchange.'
      ],
      githubUrl: 'https://github.com/alexmorgan-demo/campussphere-demo',
      repoUrl: 'https://github.com/alexmorgan-demo/campussphere-demo',
      liveUrl: 'https://campussphere-demo.example.com',
      confirmed: true
    },
    {
      id: 'proj_demo_2',
      title: 'DocuSense – NLP Document Intelligence & Search Pipeline',
      role: 'Machine Learning Engineer',
      description: 'Machine learning pipeline analyzing and classifying multi-page technical reports with semantic keyword indexing.',
      technologies: ['Python', 'Flask', 'Scikit-learn', 'NLP', 'MySQL'],
      techStack: ['Python', 'Flask', 'Scikit-learn', 'NLP', 'MySQL'],
      bullets: [
        'Built text preprocessing and TF-IDF feature extraction pipeline classifying research papers into 12 distinct academic disciplines.',
        'Trained Scikit-learn classification models achieving 89% precision across benchmark technical corpora.',
        'Exposed lightweight Flask inference endpoints enabling sub-second query and semantic document retrieval.'
      ],
      keyFeatures: [
        'TF-IDF vectorization and multi-class classification.',
        'Sub-second query response times for academic document indexing.'
      ],
      githubUrl: 'https://github.com/alexmorgan-demo/docusense-nlp-demo',
      repoUrl: 'https://github.com/alexmorgan-demo/docusense-nlp-demo',
      liveUrl: 'https://docusense-demo.example.com',
      confirmed: true
    },
    {
      id: 'proj_demo_3',
      title: 'PulseRoute – Distributed Order Tracking & Telemetry System',
      role: 'Backend Developer',
      description: 'High-throughput event tracking service demonstrating real-time status updates and geospatial coordinate logging.',
      technologies: ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'Git'],
      techStack: ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'Git'],
      bullets: [
        'Developed asynchronous telemetry ingestion service processing simulated geolocation updates across 50 delivery routes.',
        'Designed geospatial indexing in MongoDB to optimize radius and proximity lookups for destination dispatch.',
        'Implemented structured Winston logging and automated integration testing with Jest.'
      ],
      keyFeatures: [
        'Geospatial lookups with MongoDB 2dsphere indexes.',
        'Structured logging and automated integration testing.'
      ],
      githubUrl: 'https://github.com/alexmorgan-demo/pulseroute-demo',
      repoUrl: 'https://github.com/alexmorgan-demo/pulseroute-demo',
      liveUrl: 'https://pulseroute-demo.example.com',
      confirmed: true
    },
    {
      id: 'proj_demo_4',
      title: 'Algorithmic Visualizer – Interactive CS Foundations Workbench',
      role: 'Frontend Creator',
      description: 'Interactive single-page algorithm visualizer demonstrating graph traversals, dynamic programming, and sorting heuristics.',
      technologies: ['JavaScript', 'React', 'HTML5 Canvas', 'CSS3'],
      techStack: ['JavaScript', 'React', 'HTML5 Canvas', 'CSS3'],
      bullets: [
        'Rendered step-by-step executions of Dijkstra, A*, and Topological Sort with variable playback controls and step counters.',
        'Engineered state rollback and breakpoint debugging interface for computer science pedagogical demonstrations.'
      ],
      keyFeatures: [
        'Step-by-step canvas rendering of graph search algorithms.',
        'State rollback and interactive breakpoint stepping.'
      ],
      githubUrl: 'https://github.com/alexmorgan-demo/algo-visualizer-demo',
      repoUrl: 'https://github.com/alexmorgan-demo/algo-visualizer-demo',
      liveUrl: 'https://algo-visualizer-demo.example.com',
      confirmed: true
    }
  ],
  skills: {
    technical: [
      'Python', 'Java', 'JavaScript', 'C++',
      'Django', 'Flask', 'Node.js', 'REST APIs',
      'React', 'HTML', 'CSS', 'Tailwind CSS',
      'PostgreSQL', 'MySQL', 'MongoDB',
      'Git', 'GitHub', 'Docker',
      'Machine Learning', 'Scikit-learn', 'NLP',
      'Data Structures & Algorithms'
    ],
    frameworks: ['Django', 'Flask', 'Node.js', 'Express', 'React', 'Tailwind CSS', 'Scikit-learn'],
    tools: ['Git', 'GitHub', 'Docker', 'PostgreSQL', 'MySQL', 'MongoDB', 'Postman', 'Linux'],
    soft: ['Agile Development', 'Collaborative Code Review', 'Technical Problem Solving']
  },
  categorizedSkills: {
    programmingLanguages: ['Python', 'Java', 'JavaScript', 'C++'],
    backendAndApis: ['Django', 'Flask', 'Node.js', 'Express', 'REST APIs'],
    frontend: ['React', 'HTML5', 'CSS3', 'Tailwind CSS'],
    databases: ['PostgreSQL', 'MySQL', 'MongoDB'],
    toolsAndDevelopment: ['Git', 'GitHub', 'Docker', 'Linux / Bash', 'Postman'],
    testing: ['PyTest', 'Jest', 'JUnit'],
    csFundamentals: ['Data Structures & Algorithms', 'Object-Oriented Design', 'Operating Systems'],
    aiAndMl: ['Machine Learning', 'Scikit-learn', 'Natural Language Processing (NLP)']
  },
  certifications: [
    {
      id: 'cert_demo_1',
      name: 'AWS Certified Cloud Practitioner (Illustrative Demonstration)',
      issuer: 'Amazon Web Services',
      organization: 'Amazon Web Services',
      issueDate: '2025',
      completionDate: '2025',
      credentialUrl: 'https://aws.amazon.com/verification/demo-sample',
      credentialLink: 'https://aws.amazon.com/verification/demo-sample',
      confirmed: true
    },
    {
      id: 'cert_demo_2',
      name: 'Deep Learning Specialization (Illustrative Demonstration)',
      issuer: 'DeepLearning.AI / Coursera',
      organization: 'DeepLearning.AI / Coursera',
      issueDate: '2024',
      completionDate: '2024',
      credentialUrl: 'https://coursera.org/verify/demo-sample',
      credentialLink: 'https://coursera.org/verify/demo-sample',
      confirmed: true
    }
  ],
  achievements: [
    'Finalist – National Engineering Hackathon 2025 (Top 10 out of 450 collegiate teams).',
    'Academic Merit Scholarship recipient for continuous top 5% academic performance at Example Institute of Technology.'
  ],
  mentorshipAndLeadership: [
    'Lead Technical Coordinator – Collegiate Open Source Guild, organizing bi-weekly code review workshops for 40+ sophomore students.'
  ],
  publications: [
    {
      id: 'pub_demo_1',
      title: 'Comparative Analysis of Lightweight NLP Pipelines in Low-Resource Document Indexing',
      publisher: 'Collegiate Engineering Symposium Proceedings',
      date: '2025',
      url: 'https://example.org/publications/demo-nlp-paper',
      description: 'Peer-reviewed student technical paper investigating classification throughput in academic text processing.'
    }
  ],
  extracurricularActivities: [
    'Active contributor to student open-source software libraries and competitive coding circles.',
    'Participant in annual Inter-Collegiate Algorithm Challenges and Hackathons.'
  ],
  languagesKnown: [
    'English (Fluent)',
    'Hindi (Conversational)',
    'Kannada (Conversational)'
  ],
  interests: [
    'Distributed Systems',
    'Open-Source Software Development',
    'Cloud Architecture',
    'Machine Learning Systems'
  ],
  sectionOrder: [
    'personalInfo',
    'summary',
    'skills',
    'education',
    'experience',
    'projects',
    'certifications',
    'achievements',
    'mentorshipAndLeadership',
    'publications',
    'extracurricularActivities',
    'languagesKnown',
    'interests'
  ],
  hiddenSections: [],
  layoutSpacing: 'normal',
  careerPreferences: {
    targetRoles: ['Software Engineer', 'Full-Stack Developer', 'Backend Engineer'],
    workModes: ['Hybrid', 'Remote', 'On-site'],
    targetLocations: ['Bengaluru, Karnataka, India', 'Remote India', 'Hyderabad, India'],
    minSalary: '₹9,00,000 / yr'
  },
  confirmedFactsOnly: true,
  lastConfirmedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Clean Blank Template for Normal Users
 * Normal users start with an empty form or their own uploaded data.
 */
export const CLEAN_EMPTY_PROFILE: CandidateProfile = {
  userId: 'usr_new_candidate',
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    title: '',
    summary: '',
    github: '',
    linkedin: '',
    portfolio: ''
  },
  education: [],
  experience: [],
  projects: [],
  skills: {
    technical: [],
    frameworks: [],
    tools: [],
    soft: []
  },
  categorizedSkills: {
    programmingLanguages: [],
    backendAndApis: [],
    frontend: [],
    databases: [],
    toolsAndDevelopment: [],
    testing: [],
    csFundamentals: [],
    aiAndMl: []
  },
  certifications: [],
  achievements: [],
  mentorshipAndLeadership: [],
  publications: [],
  extracurricularActivities: [],
  languagesKnown: [],
  interests: [],
  sectionOrder: [
    'personalInfo',
    'summary',
    'skills',
    'education',
    'experience',
    'projects',
    'certifications',
    'achievements',
    'mentorshipAndLeadership',
    'publications',
    'extracurricularActivities',
    'languagesKnown',
    'interests'
  ],
  hiddenSections: [],
  layoutSpacing: 'normal',
  careerPreferences: {
    targetRoles: [],
    workModes: ['Remote', 'Hybrid', 'On-site'],
    targetLocations: []
  },
  confirmedFactsOnly: false,
  lastConfirmedAt: '',
  updatedAt: new Date().toISOString()
};
