import { CandidateProfile, JobListing, LearningResource } from '../types';

export const DEFAULT_GUEST_PROFILE: CandidateProfile = {
  userId: 'usr_guest_demo',
  personalInfo: {
    fullName: 'Alex Morgan',
    email: 'alex.morgan@university.edu',
    phone: '+1 (555) 234-5678',
    location: 'San Jose, CA',
    title: 'Aspiring Software Engineer & Full-Stack Developer',
    summary: 'Final-year Computer Science student with practical experience building responsive web applications and RESTful APIs using TypeScript, React, and Node.js. Passionate about clean code, test-driven development, and scalable cloud architectures.',
    linkedin: 'https://linkedin.com/in/alexmorgan-dev',
    github: 'https://github.com/alexmorgan-dev',
    portfolio: 'https://alexmorgan.dev'
  },
  education: [
    {
      id: 'edu_1',
      institution: 'California State University',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      startDate: '2022',
      endDate: '2026',
      gpa: '3.75 / 4.0',
      honors: 'Dean’s Honor List (Fall 2023, Spring 2024)',
      confirmed: true
    }
  ],
  experience: [
    {
      id: 'exp_1',
      company: 'NextGen Cloud Labs',
      role: 'Software Engineering Intern',
      location: 'Remote',
      startDate: 'Jun 2025',
      endDate: 'Aug 2025',
      current: false,
      bullets: [
        'Developed interactive dashboard components using React, TypeScript, and CSS modules, cutting dashboard load time by 18%.',
        'Implemented secure RESTful endpoints in Node.js/Express for user telemetry and activity logging with PostgreSQL.',
        'Collaborated with senior engineers in an Agile sprint cycle, participating in code reviews and automated CI pipeline checks.'
      ],
      confirmed: true
    }
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'DevPulse - Developer Productivity Tracker',
      role: 'Lead Developer',
      techStack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
      description: 'Full-stack web application tracking sprint velocity, GitHub commit trends, and task completion metrics.',
      bullets: [
        'Engineered responsive single-page application using React 18 and state management hooks.',
        'Built backend REST API handling authentication, webhook events, and relational queries in PostgreSQL.',
        'Integrated GitHub REST API to automatically sync and visualize repository contribution metrics.'
      ],
      liveUrl: 'https://devpulse-demo.app',
      repoUrl: 'https://github.com/alexmorgan-dev/devpulse',
      confirmed: true
    },
    {
      id: 'proj_2',
      title: 'SmartQuery - Natural Language SQL Assistant',
      role: 'Full Stack Creator',
      techStack: ['Python', 'FastAPI', 'SQLite', 'HTML5', 'CSS3'],
      description: 'Educational tool converting natural language queries into verified SQL statements with visual schema breakdown.',
      bullets: [
        'Designed lightweight FastAPI service parsing incoming schema definitions and generating syntax-validated queries.',
        'Implemented interactive query playground with query execution execution plan visualization.'
      ],
      liveUrl: 'https://smartquery.app',
      repoUrl: 'https://github.com/alexmorgan-dev/smartquery',
      confirmed: true
    }
  ],
  skills: {
    technical: ['JavaScript', 'TypeScript', 'Python', 'SQL', 'HTML5', 'CSS3', 'Git'],
    frameworks: ['React', 'Node.js', 'Express', 'FastAPI'],
    tools: ['PostgreSQL', 'SQLite', 'VS Code', 'Postman', 'Linux / Bash'],
    soft: ['Agile / Scrum', 'Technical Writing', 'Problem Solving', 'Collaborative Code Review']
  },
  certifications: [
    {
      id: 'cert_1',
      name: 'Meta Front-End Developer Professional Certificate',
      issuer: 'Coursera / Meta',
      issueDate: 'Jan 2025',
      credentialUrl: 'https://coursera.org/verify/professional-cert/meta-frontend',
      confirmed: true
    }
  ],
  careerPreferences: {
    targetRoles: ['Junior Full-Stack Developer', 'Frontend Engineer', 'Junior Software Engineer'],
    workModes: ['Remote', 'Hybrid'],
    targetLocations: ['San Francisco, CA', 'Remote US', 'San Jose, CA'],
    minSalary: '$75,000'
  },
  confirmedFactsOnly: true,
  lastConfirmedAt: '2026-10-25T14:30:00Z',
  updatedAt: '2026-10-25T14:30:00Z'
};

export const SEEDED_JOB_LISTINGS: JobListing[] = [
  {
    id: 'job_1',
    source: 'LinkedIn',
    sourceJobId: 'li-948102',
    title: 'Junior Full-Stack Developer',
    company: 'Veloce Digital Systems',
    location: 'San Francisco, CA',
    workMode: 'Hybrid',
    experienceLevel: 'Entry-level',
    salaryRange: '$80,000 - $95,000 / year',
    description: 'We are seeking an ambitious Junior Full-Stack Developer to build modern customer-facing web applications. You will collaborate closely with product designers and senior engineers to deliver scalable features, maintain reliable APIs, and optimize user experience.',
    requirements: {
      essentialSkills: ['React', 'TypeScript', 'Node.js', 'SQL', 'Git'],
      preferredSkills: ['Docker', 'PostgreSQL', 'Tailwind CSS', 'Automated Testing / Jest'],
      constraints: ['Must possess US Work Authorization', 'BS in Computer Science or equivalent practical experience'],
      minYearsExperience: 0,
      degreeRequirement: 'BS in Computer Science or related STEM field'
    },
    postedAt: '2026-10-26T09:00:00Z',
    applyUrl: 'https://careers.veloce.io/jobs/junior-fullstack-948102',
    verified: true
  },
  {
    id: 'job_2',
    source: 'Indeed',
    sourceJobId: 'ind-481903',
    title: 'Junior Python Backend Engineer',
    company: 'Stratos Data Technologies',
    location: 'Austin, TX (or Remote US)',
    workMode: 'Remote',
    experienceLevel: 'Junior',
    salaryRange: '$85,000 - $100,000 / year',
    description: 'Stratos is building distributed data pipelines and APIs. As a Junior Python Backend Engineer, you will implement microservices, design relational schemas, write high-coverage tests, and package services into Docker containers.',
    requirements: {
      essentialSkills: ['Python', 'SQL', 'REST APIs', 'FastAPI', 'Docker'],
      preferredSkills: ['AWS', 'Redis', 'PostgreSQL', 'CI/CD Pipelines'],
      constraints: ['Must reside within US time zones (EST/CST/PST)', 'Legal authorization to work in the United States without sponsorship'],
      minYearsExperience: 1,
      degreeRequirement: 'Bachelor’s degree in Computer Science, Software Engineering, or related field'
    },
    postedAt: '2026-10-27T11:30:00Z',
    applyUrl: 'https://stratosdata.com/openings/backend-eng-junior',
    verified: true
  },
  {
    id: 'job_3',
    source: 'Handshake',
    sourceJobId: 'hs-102934',
    title: 'Frontend Web Engineer (New Grad 2026)',
    company: 'Luminary Cloud Interactive',
    location: 'San Jose, CA',
    workMode: 'Hybrid',
    experienceLevel: 'Entry-level',
    salaryRange: '$88,000 - $105,000 / year',
    description: 'Perfect role for 2025/2026 graduating seniors. You will build highly responsive, accessible web interfaces for our enterprise collaboration suite, ensuring sub-second interactivity and pixel-perfect design system compliance.',
    requirements: {
      essentialSkills: ['JavaScript', 'TypeScript', 'React', 'HTML5', 'CSS3', 'Git'],
      preferredSkills: ['Web Accessibility (a11y)', 'State Management', 'Figma', 'GraphQL'],
      constraints: ['Graduating between Dec 2025 and June 2026'],
      minYearsExperience: 0,
      degreeRequirement: 'Bachelor of Science in Computer Science or Human-Computer Interaction'
    },
    postedAt: '2026-10-28T14:15:00Z',
    applyUrl: 'https://luminarycloud.com/university/frontend-2026',
    verified: true
  },
  {
    id: 'job_4',
    source: 'Company Direct',
    sourceJobId: 'dir-55012',
    title: 'Cloud & DevOps Associate Engineer',
    company: 'Aether Infrastructure',
    location: 'Seattle, WA',
    workMode: 'On-site',
    experienceLevel: 'Junior',
    salaryRange: '$90,000 - $110,000 / year',
    description: 'Join our cloud reliability team to manage Kubernetes clusters, automate deployment pipelines, monitor system metrics, and ensure 99.99% uptime across multi-region infrastructure.',
    requirements: {
      essentialSkills: ['Linux / Bash', 'Docker', 'Kubernetes', 'Git', 'Networking Basics'],
      preferredSkills: ['AWS', 'Terraform', 'Prometheus', 'Python'],
      constraints: ['On-site presence required at Seattle engineering hub 3 days/week'],
      minYearsExperience: 1,
      degreeRequirement: 'Bachelor’s degree in CS, Computer Engineering, or IT'
    },
    postedAt: '2026-10-24T08:00:00Z',
    applyUrl: 'https://aetherinfra.io/careers/devops-assoc',
    verified: true
  },
  {
    id: 'job_5',
    source: 'LinkedIn',
    sourceJobId: 'li-883190',
    title: 'Junior Data Analyst & Python Developer',
    company: 'Quantiva Analytics',
    location: 'Chicago, IL (or Remote)',
    workMode: 'Remote',
    experienceLevel: 'Entry-level',
    salaryRange: '$75,000 - $88,000 / year',
    description: 'Analyze user engagement datasets, automate scheduled reporting jobs, and construct interactive dashboards for business stakeholders using Python, Pandas, and SQL.',
    requirements: {
      essentialSkills: ['Python', 'SQL', 'Data Visualization', 'Pandas', 'Statistics'],
      preferredSkills: ['Tableau', 'Jupyter', 'PostgreSQL', 'Scikit-learn'],
      constraints: ['Must have reliable high-speed internet for remote operations'],
      minYearsExperience: 0,
      degreeRequirement: 'Degree in STEM, Data Science, Math, or Computer Science'
    },
    postedAt: '2026-10-25T16:45:00Z',
    applyUrl: 'https://quantiva-analytics.com/jobs/data-analyst-jr',
    verified: true
  },
  {
    id: 'job_6',
    source: 'Curated Partner',
    sourceJobId: 'cur-3021',
    title: 'Mobile Application Developer (Cross-Platform)',
    company: 'AppSphere Mobile Studio',
    location: 'Los Angeles, CA',
    workMode: 'Hybrid',
    experienceLevel: 'Junior',
    salaryRange: '$82,000 - $96,000 / year',
    description: 'Build cross-platform mobile apps using Flutter or React Native. Integrate mobile hardware APIs, handle offline caching, and release builds to Apple App Store and Google Play.',
    requirements: {
      essentialSkills: ['Mobile App Development', 'Flutter or React Native', 'REST APIs', 'Git'],
      preferredSkills: ['TypeScript', 'Firebase', 'State Management (Bloc/Redux)', 'UI/UX Design'],
      constraints: ['Portfolio of at least one published or runnable mobile project required'],
      minYearsExperience: 0,
      degreeRequirement: 'BS in Computer Science or self-taught with demonstrated project portfolio'
    },
    postedAt: '2026-10-28T10:00:00Z',
    applyUrl: 'https://appsphere.dev/jobs/mobile-dev-2026',
    verified: true
  },
  {
    id: 'job_7',
    source: 'Indeed',
    sourceJobId: 'ind-902123',
    title: 'QA Automation Engineer - Web Applications',
    company: 'Veritas Quality Software',
    location: 'Denver, CO (or Remote)',
    workMode: 'Remote',
    experienceLevel: 'Entry-level',
    salaryRange: '$70,000 - $84,000 / year',
    description: 'Ensure rock-solid software quality through end-to-end automated testing, regression suites, and CI/CD test execution with Playwright and Cypress.',
    requirements: {
      essentialSkills: ['JavaScript or Python', 'Test Automation', 'Git', 'REST APIs'],
      preferredSkills: ['Playwright', 'Cypress', 'CI/CD Pipelines', 'Docker'],
      constraints: ['US Citizen or Permanent Resident (ITAR compliance)'],
      minYearsExperience: 0,
      degreeRequirement: 'BS in Software Engineering, Computer Science, or Equivalent'
    },
    postedAt: '2026-10-22T13:20:00Z',
    applyUrl: 'https://veritas-qa.com/openings/junior-qa-automation',
    verified: true,
    stale: false
  }
];

export const SEEDED_LEARNING_RESOURCES: LearningResource[] = [
  {
    id: 'res_docker_official',
    provider: 'Docker Official Documentation & Labs',
    title: 'Docker Hands-On Getting Started & Containerization Essentials',
    url: 'https://docs.docker.com/get-started/',
    skills: ['Docker', 'Containers', 'Linux / Bash'],
    level: 'Beginner',
    duration: '4-6 hours',
    priceStatus: 'Free',
    rating: 4.9,
    verified: true,
    description: 'Official interactive Docker guide covering Dockerfiles, multi-stage builds, container networking, and docker-compose.'
  },
  {
    id: 'res_fcc_docker',
    provider: 'freeCodeCamp',
    title: 'Docker & Kubernetes Full Course for Beginners',
    url: 'https://www.freecodecamp.org/news/docker-kubernetes-course/',
    skills: ['Docker', 'Kubernetes', 'DevOps'],
    level: 'Beginner',
    duration: '5 hours',
    priceStatus: 'Free',
    rating: 4.8,
    verified: true,
    description: 'Step-by-step video tutorial and project walkthrough building and deploying containerized services.'
  },
  {
    id: 'res_helsinki_fullstack',
    provider: 'University of Helsinki',
    title: 'Full Stack Open - Modern Web Development (Parts 1-13)',
    url: 'https://fullstackopen.com/en/',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Automated Testing / Jest', 'CI/CD Pipelines'],
    level: 'Intermediate',
    duration: '60-80 hours',
    priceStatus: 'Free',
    rating: 4.9,
    verified: true,
    description: 'World-renowned university course covering React, Redux, Node.js, REST APIs, GraphQL, TypeScript, and automated testing.'
  },
  {
    id: 'res_cs50_web',
    provider: 'Harvard University / edX',
    title: 'CS50W: Web Programming with Python and JavaScript',
    url: 'https://cs50.harvard.edu/web/',
    skills: ['Python', 'SQL', 'JavaScript', 'REST APIs', 'Git', 'Django'],
    level: 'Intermediate',
    duration: '12 weeks (6-9 hrs/wk)',
    priceStatus: 'Free Audit',
    rating: 4.9,
    verified: true,
    description: 'Harvard University foundational curriculum covering database design, scalability, security, and user experience.'
  },
  {
    id: 'res_odin_project',
    provider: 'The Odin Project',
    title: 'Full Stack JavaScript & Computer Science Foundations',
    url: 'https://www.theodinproject.com/paths/full-stack-javascript',
    skills: ['JavaScript', 'HTML5', 'CSS3', 'Node.js', 'React', 'Git'],
    level: 'Beginner',
    duration: 'Self-paced (~150 hours)',
    priceStatus: 'Free',
    rating: 4.9,
    verified: true,
    description: 'High-rigor open-source curriculum focusing on hands-on project creation and portfolio development.'
  },
  {
    id: 'res_aws_practitioner',
    provider: 'AWS Skill Builder',
    title: 'AWS Cloud Practitioner Essentials',
    url: 'https://explore.skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials',
    skills: ['AWS', 'Cloud Computing', 'Networking Basics'],
    level: 'Beginner',
    duration: '6 hours',
    priceStatus: 'Free',
    rating: 4.7,
    verified: true,
    description: 'Official fundamental training from Amazon Web Services on core infrastructure, compute (EC2/Lambda), storage (S3), and security.'
  },
  {
    id: 'res_fastapi_official',
    provider: 'FastAPI Tutorial by Tiangolo',
    title: 'FastAPI Official Step-by-Step User Guide',
    url: 'https://fastapi.tiangolo.com/tutorial/',
    skills: ['FastAPI', 'Python', 'REST APIs'],
    level: 'Beginner',
    duration: '6-8 hours',
    priceStatus: 'Free',
    rating: 4.9,
    verified: true,
    description: 'Comprehensive, interactive documentation teaching async Python, Pydantic data schemas, dependency injection, and OpenAPI.'
  },
  {
    id: 'res_mdn_a11y',
    provider: 'MDN Web Docs',
    title: 'Accessibility (a11y) Learning Pathway',
    url: 'https://developer.mozilla.org/en-US/docs/Learn/Accessibility',
    skills: ['Web Accessibility (a11y)', 'HTML5', 'CSS3'],
    level: 'Beginner',
    duration: '8 hours',
    priceStatus: 'Free',
    rating: 4.9,
    verified: true,
    description: 'Industry-standard guidelines on semantic HTML, ARIA attributes, keyboard navigation, and WCAG contrast compliance.'
  },
  {
    id: 'res_playwright_official',
    provider: 'Microsoft Playwright',
    title: 'End-to-End Testing with Playwright: Getting Started',
    url: 'https://playwright.dev/docs/intro',
    skills: ['Playwright', 'Test Automation', 'JavaScript or Python'],
    level: 'Beginner',
    duration: '4 hours',
    priceStatus: 'Free',
    rating: 4.8,
    verified: true,
    description: 'Learn modern browser automation, locators, auto-waiting, parallel test execution, and CI test artifacts.'
  },
  {
    id: 'res_kaggle_pandas',
    provider: 'Kaggle Learn',
    title: 'Pandas Data Wrangling & Manipulation Micro-Course',
    url: 'https://www.kaggle.com/learn/pandas',
    skills: ['Pandas', 'Python', 'Data Visualization'],
    level: 'Beginner',
    duration: '4 hours',
    priceStatus: 'Free',
    rating: 4.7,
    verified: true,
    description: 'Interactive coding exercises for indexing, filtering, summary functions, grouping, sorting, and data reshaping.'
  },
  {
    id: 'res_k8s_basics',
    provider: 'Kubernetes Official',
    title: 'Kubernetes Interactive Tutorials & Core Concepts',
    url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/',
    skills: ['Kubernetes', 'Docker', 'Linux / Bash'],
    level: 'Intermediate',
    duration: '6 hours',
    priceStatus: 'Free',
    rating: 4.7,
    verified: true,
    description: 'Official browser-based scenario sandbox deploying pods, scaling applications, and managing rolling updates.'
  },
  {
    id: 'res_flutter_codelabs',
    provider: 'Google Flutter Team',
    title: 'Flutter First App Codelab & Cross-Platform Fundamentals',
    url: 'https://docs.flutter.dev/get-started/codelab',
    skills: ['Flutter or React Native', 'Mobile App Development'],
    level: 'Beginner',
    duration: '3 hours',
    priceStatus: 'Free',
    rating: 4.8,
    verified: true,
    description: 'Official Google codelab building a clean, responsive mobile application for Android and iOS.'
  }
];
