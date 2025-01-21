CREATE TABLE Degree (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name VARCHAR(255) UNIQUE NOT NULL,
  totalCredits INT NOT NULL
);

CREATE TABLE Course (
  code VARCHAR(8) NOT NULL,
  credits INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  components TEXT NOT NULL,
  notes TEXT,
  PRIMARY KEY (code)
);

CREATE TABLE Requisite (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code VARCHAR(8),
    reqCode VARCHAR(8),
    groupId INT,
    type VARCHAR(3) CHECK (type IN ('pre', 'co')),
    FOREIGN KEY (code) REFERENCES Course(code),
    FOREIGN KEY (reqCode) REFERENCES Course(code)
);

CREATE TABLE CoursePool (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE DegreeXCoursePool (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  degree UNIQUEIDENTIFIER,
  coursepool UNIQUEIDENTIFIER,
  creditsRequired FLOAT NOT NULL,
  UNIQUE(degree, coursepool),
  FOREIGN KEY (degree) REFERENCES Degree(id),
  FOREIGN KEY (coursepool) REFERENCES CoursePool(id)
);

CREATE TABLE CourseXCoursePool (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  coursecode VARCHAR(8),
  coursepool UNIQUEIDENTIFIER,
  UNIQUE(coursecode, coursepool),
  FOREIGN KEY (coursecode) REFERENCES Course(code), -- Composite foreign key
  FOREIGN KEY (coursepool) REFERENCES CoursePool(id)
);

CREATE TABLE AppUser (  -- Use square brackets for reserved keywords
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    degree UNIQUEIDENTIFIER,
    type VARCHAR(10) CHECK (type IN ('student', 'advisor', 'admin')) NOT NULL,
    FOREIGN KEY (degree) REFERENCES Degree(id)
);

CREATE TABLE Timeline (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    season VARCHAR(10) CHECK (season IN ('fall', 'winter', 'summer1', 'summer2', 'fall/winter', 'summer')) NOT NULL,
    year INT NOT NULL,
    coursecode VARCHAR(8) NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    UNIQUE(user_id, coursecode, season, year),
    FOREIGN KEY (coursecode) REFERENCES Course(code), -- Composite foreign key
    FOREIGN KEY (user_id) REFERENCES AppUser (id)  -- Adjusted foreign key reference
);

CREATE TABLE Deficiency (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    coursepool UNIQUEIDENTIFIER,
    user_id UNIQUEIDENTIFIER,
    creditsRequired INT NOT NULL,
    UNIQUE(user_id, coursepool),
    FOREIGN KEY (coursepool) REFERENCES CoursePool(id),
    FOREIGN KEY (user_id) REFERENCES AppUser (id)
);

CREATE TABLE Exemption (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    coursecode VARCHAR(8),
    user_id UNIQUEIDENTIFIER,
    UNIQUE(user_id, coursecode),
    FOREIGN KEY (coursecode) REFERENCES Course(code), -- Composite foreign key
    FOREIGN KEY (user_id) REFERENCES AppUser (id)
);


-- Insert sample values into tables

-- Corrected INSERT statements

-- Insert into Degree table
INSERT INTO Degree (name, totalCredits)
VALUES ('Building Engineering', 119),
       ('Aerospace Engineering', 120),
       ('Civil Engineering', 119),
       ('Computer Engineering', 120),
       ('Computer Science', 90),
       ('Computer Science – Computation Arts', 90),
       ('Data Science', 120),
       ('Electrical Engineering', 120),
       ('Health and Life Sciences', 90),
       ('Industrial Engineering', 120),
       ('Mechanical Engineering', 120),
       ('Software Engineering', 120);

-- Insert into Course table
INSERT INTO Course (code, credits, description, title, components, notes) VALUES
  -- from engineering core file:
('ELEC 275', 3.5, 'Fundamentals of electric circuits: Kirchoff’s laws, voltage and current sources, Ohm’s law, series and parallel circuits. Nodal and mesh analysis of DC circuits. Superposition theorem, Thevenin and Norton Equivalents. Use of operational amplifiers. Transient analysis of simple RC, RL and RLC circuits. Steady state analysis: Phasors and impedances, power and power factor. Single and three phase circuits. Magnetic circuits and transformers. Power generation and distribution.', 'Principles of Electrical Engineering', 'Lecture 3 hours per week; Tutorial 2 hours per week; Laboratory 15 hours total', ''),
('ENCS 282', 3, 'Technical writing form and style. Technical and scientific papers, abstracts, reports. Library research and referencing methods for engineers and computer scientists. Technical communication using information technology: document processing software, computer‑assisted presentation, analysis and design of web presentation, choice and use of appropriate tools. Students will prepare an individual major report and make an oral presentation', 'Technical Writing and Communication', 'Lecture 3 hours per week; Tutorial 2 hours per week', ''),
('ENGR 201', 1.5, 'Health and safety issues for engineering projects: Quebec and Canadian legislation; safe work practices; general laboratory safety common to all engineering disciplines, and specific laboratory safety pertaining to particular engineering disciplines. Review of the legal framework in Quebec, particularly the Professional Code and the Engineers Act, as well as professional ethics.', 'Professional Practice and Responsibility', 'Lecture 1.5 hours per week; Tutorial 1 hour per week, alternate weeks', ''),
('ENGR 202', 1.5, 'Introduction to the concept of sustainable development and the approaches for achieving it. Relationships with economic, social, and technological development. Methods for evaluating sustainability of engineering projects, including utilization of relevant databases and software. Impact of engineering design and industrial development on the environment. Case studies.', 'Sustainable Development and Environmental Stewardship', 'Lecture 1.5 hours per week', ''),
('ENGR 213', 3, 'This course introduces Engineering students to the theory and application of ordinary differential equations. Definition and terminology, initial‑value problems, separable differential equations, linear equations, exact equations, solutions by substitution, linear models, orthogonal trajectories, complex numbers, form of complex numbers: powers and roots, theory: linear equations, homogeneous linear equations with constant coefficients, undetermined coefficients, variation of parameters, Cauchy‑Euler equation, reduction of order, linear models: initial value, review of power series, power series solutions, theory, homogeneous linear systems, solution by diagonalization, non‑homogeneous linear systems. Eigenvalues and eigenvectors.', 'Applied Ordinary Differential Equations', 'Lecture 3 hours per week; Tutorial 2 hours per week', ''),
('ENGR 233', 3, 'This course introduces Engineering students to the theory and application of advanced calculus. Functions of several variables, partial derivatives, total and exact differentials, approximations with differentials. Tangent plane and normal line to a surface, directional derivatives, gradient. Double and triple integrals. Polar, cylindrical, and spherical coordinates. Change of variables in double and triple integrals. Vector differential calculus; divergence, curl, curvature, line integrals, Green’s theorem, surface integrals, divergence theorem, Stokes’ theorem.', 'Applied Advanced Calculus', 'Lecture 3 hours per week; Tutorial 2 hours per week', ''),
('ENGR 301', 3, 'Introduction to project delivery systems. Principles of project management; role and activity of a manager; enterprise organizational charts; cost estimating; planning and control. Company finances; interest and time value of money; discounted cash flow; evaluation of projects in private and public sectors; depreciation methods; business tax regulations; decision tree; sensitivity analysis.', 'Engineering Management Principles and Economics', 'Lecture 3 hours per week; Tutorial 1 hour per week', ''),
('ENGR 371', 3, 'This course starts out with axioms of probability theory, events, conditional probability and Bayes theorem. Next, random variables are introduced. Here, mathematical expectation, discrete and continuous probability density functions are covered. In statistics sampling distributions, interval estimation and hypothesis testing are introduced. The course includes applications to engineering problems.', 'Probability and Statistics in Engineering', 'Lecture 3 hours per week; Tutorial 1 hour per week', ''),
('ENGR 391', 3, 'This course focuses on roots of algebraic and transcendental equations; function approximation; solution of simultaneous algebraic equations; interpolation; regression; introduction to machine learning; numerical differentiation; numerical integration; numerical solutions of ordinary differential equations and partial differential equations; reliability; conditioning; error analysis. Implementation using GNU Octave/MATLAB.', 'Numerical Methods in Engineering', 'Lecture 3 hours per week; Tutorial 1 hour per week', ''),
('ENGR 392', 3, 'Social history of technology and of science including the industrial revolution and modern times. Engineering and scientific creativity, social and environmental problems created by uncontrolled technology, appropriate technology.', 'Impact of Technology on Society', 'Lecture 3 hours per week', ''),
  -- from computer science group: software engineering file:
('COMP 232', 3, 'Sets. Propositional logic and predicate calculus. Functions and relations. Elements of number theory. Mathematical reasoning. Proof techniques: direct proof, indirect proof, proof by contradiction, proof by induction.', 'Mathematics for Computer Science', 'Lecture 3 hours per week; Tutorial 2 hours per week Notes: Students who have received credit for COMP 238 or COEN 231 may not take this course for credit.', 'Students who have received credit for COMP 238 or COEN 231 may not take this course for credit.'),
('COMP 248', 3.5, 'Introduction to programming. Basic data types, variables, expressions, assignments, control flow. Classes, objects, methods. Information hiding, public vs. private visibility, data abstraction and encapsulation. References. Arrays.', 'Object‑Oriented Programming I', 'Lecture 3 hours per week; Tutorial 2 hours per week; Laboratory 1 hour per week', ''),
('COMP 249', 3.5, 'Design of classes. Inheritance. Polymorphism. Static and dynamic binding. Abstract classes. Exception handling. File I/O. Recursion. Interfaces and inner classes. Graphical user interfaces. Generics. Collections and iterators.', 'Object‑Oriented Programming II', 'Lecture 3 hours per week; Tutorial 2 hours per week; Laboratory 1 hour per week', ''),
('COMP 335', 3, 'This course covers the following topics: finite state automata and regular languages; push ‑ down automata and context ‑ free languages; pumping lemmas; applications to parsing; Turing machines; undecidability and decidability.', 'Introduction to Theoretical Computer Science', 'Lecture 3 hours per week; Tutorial 2 hours per week', ''),
('COMP 346', 4, 'Fundamentals of operating system functionalities, design and implementation. Multiprogramming: processes and threads, context switching, queuing models and scheduling. Interprocess communication and synchronization. Principles of concurrency. Synchronization primitives. Deadlock detection and recovery, prevention and avoidance schemes. Memory management. Device management. File systems. Protection models and schemes.', 'Operating Systems', 'Lecture 3 hours per week; Tutorial 1 hour per week; Laboratory 2 hours per week Notes: Students who have received credit for COEN 346 may not take this course for credit.', 'Students who have received credit for COEN 346 may not take this course for credit.'),
('COMP 348', 3, 'Survey of programming paradigms: Imperative, functional, and logic programming. Issues in the design and implementation of programming languages. Declaration models: binding, visibility, and scope. Type systems, including static and dynamic typing. Parameter passing mechanisms. Hybrid language design.', 'Principles of Programming Languages', 'Lecture 2 hours per week; Tutorial 1 hour per week', ''),
('COMP 352', 3, 'Abstract data types: stacks and queues, trees, priority queues, dictionaries. Data structures: arrays, linked lists, heaps, hash tables, search trees. Design and analysis of algorithms: asymptotic notation, recursive algorithms, searching and sorting, tree traversal, graph algorithms.', 'Data Structures and Algorithms', 'Lecture 3 hours per week; Tutorial 1 hour per week Notes: Students who have received credit for COEN 352 may not take this course for credit.', 'Students who have received credit for COEN 352 may not take this course for credit.'),
  -- from software engineeering core file:
('SOEN 228', 4, 'This course covers the following topics: Boolean Algebra, Digital logic and the design of logic circuits; CPU design; addressing modes; instruction sets and sequencing; design of datapath and control units; memory systems and types; cache memory levels; I/O devices and their interconnection to the CPU; assembly language, and Interrupts.', 'System Hardware', 'Lecture 3 hours per week; Tutorial 2 hours per week; Laboratory 2 hours per week Notes: Students who have received credit for COMP 228 may not take this course for credit.', 'Students who have received credit for COMP 228 may not take this course for credit.'),
('SOEN 287', 3, 'This course covers the following topics: internet architecture and protocols; web applications through clients and servers; modern HTML and CSS; client‑side programming using modern JavaScript and an overview of the advantages of some common modern JavaScript libraries; Regular Expressions; static website contents and dynamic page generation through server‑side programming; preserving state (client‑side) in web applications; deploying static and dynamic websites and content management systems vs. website deployment.', 'Web Programming', 'Lecture 3 hours per week; Tutorial 2 hours per week', ''),
('SOEN 321', 3, 'This course covers the following topics: introduction to cryptography and cryptanalysis; threats, attacks, and vulnerabilities; security services (confidentiality, authentication, integrity); public key systems including Diffie‑Hellman, RSA, Rabin; Digital Signature Schemes; Hash functions and MAC schemes; authentication protocols; network layers and security; protocols; Public Key Infrastructure (PKI); Transport Layer Security (TLS); firewalls; Intrusion Detection Systems; DNS security; Denial of Service Attacks; Penetration testing; Online Privacy and anonymity; Mix networks and Onion Routing; TOR; Malware; Botnets; Spam and Hot topics in Security and Privacy.', 'Information Systems Security', 'Lecture 3 hours per week; Tutorial 1 hour per week', ''),
('SOEN 331', 3, 'This course covers the following topics: property‑based (axiomatic and algebraic) formalisms and model‑based (abstract and visual) formalisms; axiomatic formalisms with temporal logic, assertions and contracts; algebraic formalisms through algebraic specifications; abstract formalisms through the Z and Object‑Z specification languages; visual formalisms through automata (finite state machines and extended finite state machines).', 'Formal Methods for Software Engineering', 'Lecture 3 hours per week; Tutorial 2 hours per week', ''),
('SOEN 341', 4, 'This course covers the following topics: basic principles of software engineering; introduction to software process, including activities, phases, organization, roles, teamwork, and conflict resolution; notations used in software engineering; software development practices, including documentation, modern version control, review, testing, agile, and continuous integration.', 'Software Process and Practices', 'Lecture 3 hours per week; Tutorial 1 hour per week; Laboratory 2 hours per week Notes: Students who have received credit for COMP 354 may not take this course for credit.', 'Students who have received credit for COMP 354 may not take this course for credit.'),
('SOEN 342', 4, 'This course covers the following topics: requirements engineering; eliciting and coping with changing and evolving requirements; deployment of a software system under real‑life functional and non‑functional requirements scenarios; understanding how requirements impact early‑stage and deployed software systems through all phases of engineering, including design, implementation, test and verification, deployment, and evolution. A project is required.', 'Software Requirements and Deployment', 'Lecture 3 hours per week; Tutorial 1 hour per week; Laboratory 2 hours per week', ''),
('SOEN 343', 4, 'This course covers the following topics: from requirements to design to implementation; planned vs. evolutionary design and refactoring; model‑driven design and Unified Modelling Language (UML); structural and behavioural design descriptions and specifications; general and domain‑specific design principles, patterns and idioms; introduction to software architecture (styles and view models); design quality; architectural debt; design smells; refactoring Anti‑Patterns to Patterns; design rationale.', 'Software Architecture and Design', 'Lecture 3 hours per week; Tutorial 1 hour per week; Laboratory 2 hours per week', ''),
('SOEN 345', 4, 'This course covers the following topics: unit testing and test‑driven development; characterization testing and legacy system testing; mocking, dependency injection, and breaking system dependencies; integration and system testing; test planning and management; test order, prioritization, redundancy, and flaky tests; advanced topics including static analysis, bisection, and fuzzing; data migration testing and verification; continuous integration and delivery; DevOps testing and validation including darklaunching, A/B testing, feature toggles, and logging.', 'Software Testing, Verification and Quality Assurance', 'Lecture 3 hours per week; Tutorial 1 hour per week; Laboratory 2 hours per week', ''),
('SOEN 357', 3, 'This course covers the following topics: principles, standards and guidelines for user interface design; usability principles and user experience; standards and design rationale for user‑centred design; task‑centred design; rationalized design; usability engineering; user models; interface design process, including interface requirement gathering, conceptual design and prototyping, and evaluation; usability testing and analytic evaluation; data gathering and analysis techniques for qualitative and quantitative data; interface design documentation; design approaches for touch, gesture‑based, and haptic interfaces.', 'User Interface Design', 'Lecture 3 hours per week; Tutorial 1 hour per week', ''),
('SOEN 363', 3, 'This course covers the following topics: introduction to the current data ecosystem; relational databases; key‑value databases; document databases; column databases; graph databases; RDF stores; parallel and distributed file systems, data processing engines; data stream analytics; and data infrastructure.', 'Data Systems for Software Engineers', 'Lecture 3 hours per week; Tutorial 1 hour per week Notes: Students who have received credit for COMP 353 may not take this course for credit.', 'Students who have received credit for COMP 353 may not take this course for credit.'),
('SOEN 384', 3, 'Organization of large software development. Roles of team members, leaders, managers, stakeholders, and users. Tools for monitoring and controlling a schedule. Financial, organizational, human, and computational resources allocation and control. Project and quality reviews, inspections, and walkthroughs. Risk management. Communication and collaboration. Cause and effects of project failure. Project management via the Internet. Quality assurance and control.', 'Management, Measurement and Quality Control', 'Lecture 3 hours per week; Tutorial 1 hour per week', ''),
('SOEN 390', 3.5, 'Students work in teams to design and implement a software project from requirements provided by the coordinator. Each team will demonstrate the software and the testing of the software, and prepare adequate documentation for it. In addition, each team will generate a report based on the process of development.', 'Software Engineering Team Design Project', 'Lecture 3 hours per week; Tutorial 1 hour per week; Laboratory 3 hours per week', ''),
('SOEN 490', 6, 'Students work in teams of at least four members to construct a significant software application. The class meets at regular intervals. Team members will give a presentation of their contribution to the project.', 'Capstone Software Engineering Design Project', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
  -- from Engineering and Natural Science Group: Software Engineering file:
('ENGR 245', 3, 'This course covers the following topics: forces in a plane and in space, moments of forces, rigid bodies in equilibrium, and free‑body diagram; centroids and centres of gravity; distributed forces and moments of inertia; principle of virtual work; kinematics of particles and rigid bodies; forces and accelerations; work and energy; kinetics of particles and rigid bodies.', 'Mechanical Analysis', 'Lecture 3 hours per week; Tutorial 1 hour per week', ''),
('MIAE 221', 3, 'This course focuses on relationships between properties and internal structure, atomic bonding; molecular, crystalline and amorphous structures, crystalline imperfections and mechanisms of structural change; microstructures and their development from phase diagrams; structures and mechanical properties of polymers and ceramics; thermal and optical properties of materials.', 'Materials Science', 'Lecture 3 hours per week; Tutorial 1 hour per week', 'Students who have received credit for MECH 221 may not take this course for credit.'),
  --from software engineering electives file:
('AERO 480', 3.5, 'Basic flight control and flight dynamics principles. Aircraft dynamic equations and performance data. Implementation of aircraft control: control surfaces and their operations, development of thrust and its control; autopilot systems, their algorithms, dynamics and interaction problems. Flight instruments, principles of operation and dynamics. Cockpit layouts — basic configuration, ergonomic design, control field forces; advanced concepts in instruments, avionics and displays; HUD; flight management systems, and communication equipment. Introduction to flight simulation: overview of visual, audio and motion simulator systems; advanced concepts in flight simulators.', 'Flight Control Systems', 'Lecture 3 hours per week; Laboratory 2 hours per week, alternate weeks', 'This course is equivalent to ELEC 415 and to MECH 480. Students who have received credit for ELEC 415 or MECH 480 may not take this course for credit.'),
('AERO 482', 3, 'Basics of modern electronic navigation systems, history of air navigation, earth coordinate and mapping systems; basic theory and analysis of modern electronic navigation instrumentation, communication and radar systems, approach aids, airborne systems, transmitters and antenna coverage; noise and losses, target detection, digital processing, display systems and technology; demonstration of avionic systems using flight simulator.', 'Avionic Navigation Systems', 'Lecture 3 hours per week', 'This course is equivalent to ELEC 416 and to MECH 482. Students who have received credit for ELEC 416 or MECH 482 may not take this course for credit.'),
('COEN 320', 3, 'Fundamentals of real‑time systems: definitions, requirements, design issues and applica‑ tions. Real‑time operating systems (RTOS) feature: multi‑tasking, process management, scheduling, interprocess communication and synchronization, real‑time memory management, clocks and timers, interrupt and exception handling, message queues, asynchronous input/output. Concurrent programming languages: design issues and examples, POSIX threads and semaphores. Introduction to real‑time uniprocessor scheduling policies: static vs. dynamic, pre‑emptive vs. non‑pre‑emptive, specific techniques — rate‑monotonic algorithm, earliest‑deadline‑first, deadline monotonic, least‑laxity‑time‑first; clock‑driven scheduling. Design and specification techniques — Finite state machine based State‑chart, Dataflow diagram, Petri nets. Reliability and fault‑tolerance. Case studies of RTOS — QNX, VxWorks, and research prototypes.', 'Introduction to Real‑Time Systems', 'Lecture 3 hours per week; Tutorial 1 hour per week', ''),
('COMP 333', 4, 'This course introduces the process of data analytics with the aid of examples from several disciplines. It covers data wrangling: extract-transform-load (ETL), cleaning, structuring, integration; data analytics activities: description, prescription, modelling, simulation, optimization, storytelling; and the Python ecosystem: language, libraries, and Jupyter environment.', 'Data Analytics', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('COMP 339', 3, 'General principles of counting, permutations, combinations, identities, partitions, generating functions, Fibonacci numbers, Stirling numbers, Catalan numbers, principle of inclusion‑exclusion. Graphs, subgraphs, isomorphism, Euler graphs, Hamilton paths and cycles, planar graphs, Kuratowski’s Theorem, trees, colouring, 5‑colour theorem, matching, Hall’s theorem.', 'Combinatorics', 'Lecture; Tutorial Notes: Students who have received credit for MATH 339 may not take this course for credit.', 'Students who have received credit for MATH 339 may not take this course for credit.'),
('COMP 345', 4, 'Introduction to C++. I/O with stream classes. Pointers and their uses. The Standard Template Library (STL): containers, algorithms, iterators, adaptors, function objects. Class design: constructors, destructors, operator overloading, inheritance, virtual functions, exception handling, memory management. Advanced topics: libraries, locales, STL conventions, concurrency, template metaprogramming. Applications of C++: systems, engineering, games programming. Project.', 'Advanced Program Design with C++', 'Lecture 3 hours per week; Tutorial 2 hours per week', ''),
('COMP 371', 4, 'This course covers the following topics: introduction to computer graphics and graphics hardware; introduction to graphics API and graphics systems architecture; mathematics of 2D and 3D transformations and 2D and 3D viewing; colour and basic rendering algorithms; visual realism and visibility; illumination and shading and global illumination techniques and textures; introduction to curves and surfaces and 3D object modelling; introduction to computer animation. This course includes a project.', 'Computer Graphics', 'Lecture 3 hours per week; Tutorial 1 hour per week; Laboratory 2 hours per week', ''),
('COMP 376', 4, 'This course introduces students to design and implementation aspects of computer gaming, including topics such as game technologies , basic game design, programming , applied mathematics , storytelling and narratives, and game genres. The course covers virtual environments, 2D and 3D game engines, and game development tools. Furthermore , students learn about character development, gameplay strategies, level design in games, and user interfaces. Other topics covered in the course include architecture of game consoles, analog and digital controllers, and the incorporation of graphics, sound, and music in game implementations. During the course, the students develop 2D and 3D games. A project is required.', 'Introduction to Game Development', 'Lecture 3 hours per week; Laboratory 2 hours per week Notes: Students who have received credit for CART 315 may not take this course for credit.', 'Students who have received credit forCART 315may not take this course for credit.'),
('COMP 425', 4, 'This course introduces basic techniques and concepts in computer vision including image formation, grouping and fitting, geometric vision, recognition, perceptual organization, and the state-of-the-art software tools. Students learn fundamental algorithms and techniques, and gain experience in programming vision-based components. A project is required.', 'Computer Vision', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('COMP 426', 4, 'Fundamental concepts of computer architecture. Architecture of the selected multicore platform. Review of shared‑memory parallel programming. The difficulties inherent to parallel programming. Scalability of programming models. The stream programming model for multicore. Implicit and explicit threading. Implicit and explicit orchestration of data movement, both on chip and off. Adapting standard algorithms to multicore. Critical assessment of the available system‑software support. Project.', 'Multicore Programming', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('COMP 428', 4, 'Parallel programming techniques as a natural extension to sequential programming. Overview of parallel programming architectures and models. Parallel programming issues: locality, granularity, scheduling, data decomposition and distribution, load balancing, communication and synchronization, determinacy and non‑determinacy, cost and performance. Techniques and tools for message‑passing parallel programming. Case studies. Project.', 'Parallel Programming', 'Lecture 3 hours per week; Tutorial 1 hour per week; Laboratory 2 hours per week', ''),
('COMP 432', 4, 'This course introduces conceptual and practical aspects of machine learning. Concepts include regression, classification, maximum likelihood estimation, discriminative vs. generative modelling, generalization, supervised learning, unsupervised learning, semi-supervised learning and transfer learning. Methods include linear models, mixture models, nearest neighbours, support vector machines, random forests, boosting, and basics of deep learning. A project is required.', 'Machine Learning', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('COMP 433', 4, 'This course introduces conceptual and practical aspects of deep learning and their implementation in software. Topics covered include commonly used deep learning model architectures, loss functions, regularization, optimization methods, and a strong emphasis is placed on review of their foundations and use of software tools such as pytorch, jax, and tensorflow to implement and/or apply these models. Applications in computer vision and natural language processing are covered. A final project is required.', 'Introduction to Deep Learning', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('COMP 438', 4, 'This course exposes students to the geometric modelling pipeline. It includes topics such as efficient mesh data structures such as half-edge and cornertable, digital differential geometry, spectral mesh processing, discrete modelling tools and analytic modelling tools (B-Splines, Bezier and subdivision surfaces), optimization-driven modelling and simulation, 3D shape acquisition, 3D printing and prototyping. Application-related topics are discussed such as smoothing, resampling, compression, as well as deep neural network architectures for geometric data and modelling problems. A project is required.', 'Geometric Modelling and Processing', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('COMP 442', 4, 'Compiler organization and implementation: lexical analysis and parsing, syntax‑directed translation, code optimization. Run‑time systems. Project.', 'Compiler Design', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('COMP 444', 4, 'Detailed examination of the design, implementation and system call interface of a contemporary operating system: its kernel, file system, process and thread management including scheduling, file system design and implementation, memory management, device management, I/O management, interprocess communication and synchronization mechanisms, system call interface, interrupt handling, and other advanced issues. Project.', 'System Software Design', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('COMP 445', 4, 'This course introduces the fundamentals of networking protocols and communication technologies. Topics covered include network architectures and service models, principles behind the design of protocol stacks, local and wide area networks, and the Internet. The course also covers a review of the foundations and performance of application layer protocols, reliable delivery mechanisms, congestion and flow control, control and data planes, routing and switching, error detection and correction, and multiple access protocols. The course includes an introduction to wireless networking and security.', 'Data Communication and Computer Networks', 'Lecture 3 hours per week; Tutorial 1 hour per week; Laboratory 2 hours per week', ''),
('COMP 451', 4, 'Storage management. Buffer management. Data organization. Index structures. Query optimization and execution. Transaction management. Recovery. Concurrency control. Database performance analysis and tuning. New trends in database technology. Project.', 'Database Design', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('COMP 465', 3, 'Order statistics: worst‑case, average‑case and amortized analysis. Algorithm design techniques: greedy algorithms, dynamic programming. Selected algorithms from graph theory, linear programming, number theory, string matching, and computational geometry. A survey of hard problems, NP‑completeness, and approximation algorithms.', 'Design and Analysis of Algorithms', 'Lecture 3 hours per week', ''),
('COMP 472', 4, 'This course initially describes the scope and history of Artificial Intelligence. Then it covers knowledge representation, heuristic search, game playing and planning. Finally, it introduces the topics of machine learning, genetic algorithms and natural language processing. A project is required.', 'Artificial Intelligence', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('COMP 473', 4, 'Preprocessing. Feature extraction and selection. Similarity between patterns and distance measurements. Syntactic and statistical approaches. Clustering analysis. Bayesian decision theory and discriminant functions. Neural networks and machine learning. Applications. Project.', 'Pattern Recognition', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('COMP 474', 4, 'Rule‑based expert systems, blackboard architecture, and agent‑based. Knowledge acquisition and representation. Uncertainty and conflict resolution. Reasoning and explanation. Design of intelligent systems. Project.', 'Intelligent Systems', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('COMP 475', 4, 'This course covers the fundamentals of immersive technologies, a brief history and overview of immersive technologies, analyzes case studies of interactive experiences using immersive technologies, and identifies the main challenges of the current state of the art. Furthermore, it covers the basic principles of 3D graphics for creating virtual assets and environments, and basic concepts and technologies for interaction. A project provides hands‑on experience in the design and development of interactive experiences with the user of immersive technologies.', 'Immersive Technologies', 'Lecture 3 hours per week', ''),
('COMP 476', 4, 'Introduction to advanced aspects of computer games. Game engine design. Artificial Intelligence (AI): non‑player character movement, coordinated  movement, pathfinding, world representations; decision making; tactical AI, strategic AI, learning in games. Physics‑based techniques: collision detection and response. Networked gaming: multi‑player games, networking and distributed game design, mobile gaming. Improving realism: cut scenes, 3D sound. Project.', 'Advanced Game Development', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('COMP 477', 4, 'Introduction to the algorithms, data structures, and techniques used in modelling and rendering dynamic scenes. Topics include principles of traditional animation, production pipeline, animation hardware and software, orientation representation and interpolation, modelling physical and articulated objects, forward and inverse kinematics, motion control and capture, key‑frame, procedural, and behavioural animation, camera animation, scripting system, and free‑form deformation. Project.', 'Animation for Computer Games', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('COMP 478', 4, 'Digital image fundamentals, image transforms (Fourier, Walsh, Haar, Hotelling, wavelet), image enhancement (histogram processing, spatial filtering, high‑ and low‑pass filtering), image restoration, image compression (elements of information theory, image compression models, error‑free compression, lossy compression, image compression standards), image segmentation (line detection, Hough transform, edge detection and linking, thresholding, region splitting and merging), representation and description (chain codes, signatures, skeletons, shape descriptors, moments, texture). Project.', 'Image Processing', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('COMP 479', 4, 'Basics of information retrieval (IR): boolean, vector space and probabilistic models. Tokenization and creation of inverted files. Weighting schemes. Evaluation of IR systems: precision, recall, F‑measure. Relevance feedback and query expansion. Application of IR to web search engines: XML, link analysis, PageRank algorithm. Text categorization and clustering techniques as used in spam filtering. Project.', 'Information Retrieval and Web Search', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('COMP 498', 3, 'This course may be offered in a given year upon the authorization of the Department. The content may vary from offering to offering and will be chosen to complement the available elective courses.', 'Topics in Computer Science', 'Lecture 3 hours per week', ''),
('COMP 499', 4, 'The content may vary from offering to offering and will be chosen to complement the available elective courses.', 'Topics in Computer Science with Lab', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('SOEN 298', 1, 'Digital design exercises including assembly and testing corresponding to the SOEN 228 lab.', 'System Hardware Lab', 'Laboratory 2 hours per week', ''),
('SOEN 344', 3, 'This course covers the following topics: architectural activities, roles, and deliverables; architectural view models; architectural styles (including client‑server, layered, pipes‑and‑filters, event‑based, process control) and frameworks; architectural analysis and the interplay with requirements elicitation; notations for expressing architectural designs, structural and behavioural specifications; from architectural design to detailed design; domain specific architectures and design patterns; evaluation and performance estimation of designs; advanced object‑oriented design patterns and idioms.', 'Advanced Software Architecture and Design', 'Lecture 3 hours per week; Tutorial 1 hour per week', ''),
('SOEN 387', 3, 'This course introduces Hypertext Transfer Protocol (HTTP), and client/server and layered architectures for Web-based Enterprise Applications (WEA). The course covers Application, Presentation, Domain and Data Source design patterns. Students learn how to use Java servlets and Java Server Pages. The course also covers authentication, security and transaction processing, as well as system-level testing of web applications.', 'Web‑Based Enterprise Application Design', 'Lecture 3 hours per week; Tutorial 1 hour per week', ''),
('SOEN 422', 4, 'This course covers the following topics: embedded computer system architectures; programming of interface and peripheral control registers; analog to digital conversion and motor control using pulse width modulation; interrupts, communication methods and their application to interface control and multi‑computer systems; architecture and operating systems of advanced embedded designs; design and testing of integrated systems; advanced topics.', 'Embedded Systems and Software', 'Lecture 3 hours per week; Tutorial 1 hour per week; Laboratory 2 hours per week Notes: Students who have received credit for COEN 421 may not take this course for credit.', 'Students who have received credit for COEN 421 may not take this course for credit.'),
('SOEN 423', 4, 'This course covers the following topics: principles of distributed computing including scalability, transparency, concurrency, consistency, fault tolerance, high availability; client‑server interaction technologies including interprocess communication, sockets, group communication, remote procedure call, remote method invocation, object request broker, web services; server design techniques including process replication, fault tolerance through passive replication, high availability through active replication, coordination and agreement, transactions and concurrency control.', 'Distributed Systems', 'Lecture 3 hours per week; Tutorial 1 hour per week; Laboratory 2 hours per week', ''),
('SOEN 448', 3, 'This course covers the following topics: software maintenance (corrective, perfective, and adaptive); software reuse; construction of reusable software; techniques for reverse engineering and re‑engineering software; software development as “growing” software; long‑term evolution of existing software systems.', 'Management of Evolving Systems', 'Lecture 3 hours per week', ''),
('SOEN 471', 4, 'This course focuses on the fundamentals of the big data terminology, concepts and technologies. For the technical aspects of big data management systems, the course focuses on big data engines, programming models and file systems. Specific techniques covered include supervised classification, recommender systems, data clustering, frequent itemsets mining, similarity search, data streams and graph analysis. A project provides extensive hands-on experience.', 'Big Data Analytics', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('SOEN 487', 4, 'This course covers the following topics: analysis and design of web services and applications; advanced architectures for the design, deployment, and testing of large multi‑server web services and applications; Service Oriented Architecture (SOA); Electronic Commerce; security; load balancing; stress testing.', 'Web Services and Applications', 'Lecture 3 hours per week; Tutorial 1 hour per week; Laboratory 2 hours per week', ''),
('SOEN 491', 1, 'Theoretical or practical project in an advanced topic in software engineering.', 'Software Engineering Project', 'Lecture', ''),
('SOEN 498', 3, 'This course may be offered in a given year upon the authorization of the Department. The content may vary from offering to offering and will be chosen to complement the available elective courses.', 'Topics in Software Engineering', 'Lecture 3 hours per week.', ''),
('SOEN 499', 4, 'This course may be offered in a given year upon the authorization of the Department. The content may vary from offering to offering and will be chosen to complement the available elective courses.', 'Topics in Software Engineering with Lab', 'Lecture 3 hours per week; Laboratory 2 hours per week', ''),
('ENGR 411', 1, 'Students must submit a report on a topic related to the students’ discipline and approved by the Department. The report must present a review of a current engineering problem, a proposal for a design project, or a current engineering practice.', 'Special Technical Report', 'Lecture Notes: Students who have received credit for ENGR 410 may not take this course for credit.', 'Students who have received credit for ENGR 410 may not take this course for credit.');


-- Insert into Requisite table
INSERT INTO Requisite (code, reqCode, type, groupId) VALUES
  -- from computer science group: software engineering file:
('COMP 232', 'MATH 203', 'pre', NULL),
('COMP 232', 'MATH 204', 'pre', NULL),
('COMP 248', 'MATH 204', 'pre', 1),
('COMP 248', 'MATH 204', 'co', 1),
('COMP 249', 'COMP 248', 'pre', NULL),
('COMP 249', 'MATH 203', 'pre', NULL),
('COMP 249', 'MATH 205', 'pre', 1),
('COMP 249', 'MATH 205', 'co', 1),
('COMP 335', 'COMP 232', 'pre', 1),
('COMP 335', 'COEN 231', 'pre', 1),
('COMP 335', 'COMP 249', 'pre', 2),
('COMP 335', 'COEN 244', 'pre', 2),
('COMP 346', 'COMP 228', 'pre', 1),
('COMP 346', 'SOEN 228', 'pre', 1),
('COMP 346', 'COMP 352', 'pre', NULL),
('COMP 348', 'COMP 249', 'pre', 1),
('COMP 348', 'COMP 249', 'co', 1),
('COMP 352', 'COMP 232', 'pre', NULL),
  -- from engineering core file:
('ELEC 275', 'PHYS 205', 'pre', NULL),
('ELEC 275', 'ENGR 213', 'co', NULL),
('ENCS 282', 'ENCS 272', 'pre', NULL),
('ENGR 213', 'MATH 204', 'pre', NULL),
('ENGR 233', 'MATH 204', 'pre', NULL),
('ENGR 233', 'MATH 205', 'pre', NULL),
('ENGR 371', 'ENGR 213', 'pre', NULL),
('ENGR 371', 'ENGR 233', 'pre', NULL),
('ENGR 391', 'ENGR 213', 'pre', NULL),
('ENGR 391', 'ENGR 233', 'pre', NULL),
('ENGR 391', 'COMP 248', 'pre', 1),
('ENGR 391', 'COEN 243', 'pre', 1),
('ENGR 391', 'MECH 215', 'pre', 1),
('ENGR 391', 'MIAE 215', 'pre', 1),
('ENGR 391', 'BCEE 231', 'pre', 1),
('ENGR 392', 'ENCS 282', 'pre', NULL),
('ENGR 392', 'ENGR 201', 'pre', NULL),
('ENGR 392', 'ENGR 202', 'pre', NULL),
  -- from software engineeering core file:
('SOEN 228', 'MATH 203', 'pre', NULL),
('SOEN 228', 'MATH 204', 'pre', NULL),
('SOEN 287', 'COMP 248', 'pre', NULL),
('SOEN 321', 'COMP 346', 'pre', 1),
('SOEN 321', 'COEN 346', 'pre', 1),
('SOEN 331', 'COMP 232', 'pre', NULL),
('SOEN 331', 'COMP 249', 'pre', NULL),
('SOEN 342', 'SOEN 341', 'pre', NULL),
('SOEN 343', 'SOEN 341', 'pre', 1),
('SOEN 343', 'SOEN 342', 'pre', 2),
('SOEN 343', 'SOEN 341', 'co', 1),
('SOEN 343', 'SOEN 342', 'co', 2),
('SOEN 345', 'SOEN 343', 'pre', 1),
('SOEN 345', 'SOEN 343', 'co', 1),
('SOEN 357', 'SOEN 341', 'pre', 1),
('SOEN 357', 'COMP 354', 'pre', 1),
('SOEN 363', 'COMP 352', 'pre', NULL),
('SOEN 384', 'ENCS 282', 'pre', NULL),
('SOEN 384', 'SOEN 341', 'pre', NULL),
('SOEN 390', 'SOEN 345', 'pre', NULL),
('SOEN 390', 'SOEN 357', 'pre', NULL),
('SOEN 490', 'SOEN 390', 'pre', NULL),
  -- from Engineering and Natural Science Group: Software Engineering file:
('ENGR 245', 'PHYS 204', 'pre', NULL),
('MIAE 221', 'CHEM 205', 'pre', NULL),
  --from software engineering electives file:
('AERO 480', 'AERO 371', 'pre', 1),
('AERO 480', 'ELEC 372', 'pre', 1),
('AERO 480', 'MECH 371', 'pre', 1),
('AERO 480', 'SOEN 385', 'pre', 1),
('AERO 482', 'ENGR 371', 'pre', 1),
('AERO 482', 'COMP 233', 'pre', 1),
('AERO 482', 'AERO 371', 'pre', 1),
('AERO 482', 'ELEC 372', 'pre', 1),
('AERO 482', 'MECH 370', 'pre', 1),
('AERO 482', 'SOEN 385', 'pre', 1),
('COEN 320', 'COEN 346', 'pre', 1),
('COEN 320', 'COMP 346', 'pre', 1),
('COMP 333', 'COMP 233', 'pre', 1),
('COMP 333', 'ENGR 371', 'pre', 1),
('COMP 333', 'COMP 352', 'pre', NULL),
('COMP 333', 'ENCS 282', 'pre', NULL),
('COMP 339', 'COMP 232', 'pre', NULL),
('COMP 345', 'COMP 352', 'pre', NULL),
('COMP 371', 'COMP 232', 'pre', 1),
('COMP 371', 'COEN 231', 'pre', 1),
('COMP 371', 'COMP 352', 'pre', 2),
('COMP 371', 'COEN 352', 'pre', 2),
('COMP 376', 'COMP 371', 'pre', NULL),
('COMP 426', 'COMP 346', 'pre', 1),
('COMP 426', 'COEN 346', 'pre', 1),
('COMP 428', 'COMP 346', 'pre', 1),
('COMP 428', 'COEN 346', 'pre', 1),
('COMP 432', 'COMP 352', 'pre', NULL),
('COMP 433', 'COMP 352', 'pre', NULL),
('COMP 438', 'COMP 352', 'pre', NULL),
('COMP 442', 'COMP 228', 'pre', 1),
('COMP 442', 'SOEN 228', 'pre', 1),
('COMP 442', 'COEN 311', 'pre', 1),
('COMP 442', 'COMP 335', 'pre', NULL),
('COMP 442', 'COMP 352', 'pre', 2),
('COMP 442', 'COEN 352', 'pre', 2),
('COMP 444', 'COMP 346', 'pre', NULL),
('COMP 445', 'COMP 346', 'pre', NULL),
('COMP 451', 'COMP 353', 'pre', NULL),
('COMP 465', 'COMP 232', 'pre', 1),
('COMP 465', 'COEN 231', 'pre', 1),
('COMP 465', 'COMP 339', 'pre', NULL),
('COMP 465', 'COMP 352', 'pre', 2),
('COMP 465', 'COEN 352', 'pre', 2),
('COMP 472', 'COMP 352', 'pre', 1),
('COMP 472', 'COEN 352', 'pre', 1),
('COMP 473', 'COMP 352', 'pre', NULL),
('COMP 474', 'COMP 352', 'pre', 1),
('COMP 474', 'COEN 352', 'pre', 1),
('COMP 475', 'COMP 371', 'pre', NULL),
('COMP 476', 'COMP 361', 'pre', 1),
('COMP 476', 'ENGR 391', 'pre', 1),
('COMP 476', 'COMP 376', 'pre', NULL),
('COMP 477', 'COMP 361', 'pre', 1),
('COMP 477', 'ENGR 391', 'pre', 1),
('COMP 477', 'COMP 371', 'pre', NULL),
('COMP 478', 'COMP 352', 'pre', NULL),
('COMP 479', 'COMP 233', 'pre', 1),
('COMP 479', 'ENGR 371', 'pre', 1),
('COMP 479', 'COMP 352', 'pre', NULL),
('SOEN 344', 'SOEN 343', 'pre', NULL),
('SOEN 387', 'COMP 353', 'pre', 1),
('SOEN 387', 'SOEN 363', 'pre', 1),
('SOEN 422', 'COMP 346', 'pre', NULL),
('SOEN 423', 'COMP 346', 'pre', NULL),
('SOEN 448', 'SOEN 342', 'pre', NULL),
('SOEN 448', 'SOEN 343', 'pre', NULL),
('SOEN 471', 'COMP 352', 'pre', NULL),
('SOEN 487', 'SOEN 387', 'pre', NULL),
('ENGR 411', 'ENCS 282', 'pre', NULL);
  
-- Insert into CoursePool table
INSERT INTO CoursePool (name)
VALUES ('Engineering Core'),
       ('Software Engineering Core'),
       ('Computer Science Group: Software Engineering'),
       ('Engineering and Natural Science Group: Software Engineering'),
       ('Software Engineering Electives'),
       ('Computer Engineering Core'),
       ('Computer Engineering Electives'),
       ('Electrical Engineering Core'),
       ('Electrical Engineering Electives'),
       ('Computer Science Core'),
       ('Computer Science Complementary Core'),
       ('Computer Science Electives'),
       ('Mathematics Electives: BCompSC'),
       ('General Electives: BCompSc');

-- Insert into DegreeXCoursePool table
INSERT INTO DegreeXCoursePool (degree, coursepool, creditsRequired)
SELECT (SELECT id FROM Degree WHERE name = 'Computer Science'), (SELECT id FROM CoursePool WHERE name = 'Computer Science Core'), 33 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Computer Science'), (SELECT id FROM CoursePool WHERE name = 'Computer Science Complementary Core'), 6 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Computer Science'), (SELECT id FROM CoursePool WHERE name = 'Computer Science Electives'), 18 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Computer Science'), (SELECT id FROM CoursePool WHERE name = 'Mathematics Electives: BCompSC'), 6 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Computer Science'), (SELECT id FROM CoursePool WHERE name = 'General Electives: BCompSc'), 27 UNION ALL

SELECT (SELECT id FROM Degree WHERE name = 'Computer Engineering'), (SELECT id FROM CoursePool WHERE name = 'Engineering Core'), 30.5 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Computer Engineering'), (SELECT id FROM CoursePool WHERE name = 'Computer Engineering Core'), 69.5 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Computer Engineering'), (SELECT id FROM CoursePool WHERE name = 'Computer Engineering Electives'), 20 UNION ALL

SELECT (SELECT id FROM Degree WHERE name = 'Electrical Engineering'), (SELECT id FROM CoursePool WHERE name = 'Engineering Core'), 30.5 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Electrical Engineering'), (SELECT id FROM CoursePool WHERE name = 'Electrical Engineering Core'), 72.5 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Electrical Engineering'), (SELECT id FROM CoursePool WHERE name = 'Electrical Engineering Electives'), 17 UNION ALL

SELECT (SELECT id FROM Degree WHERE name = 'Software Engineering'), (SELECT id FROM CoursePool WHERE name = 'Engineering Core'), 30.5 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Software Engineering'), (SELECT id FROM CoursePool WHERE name = 'Software Engineering Core'), 47.5 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Software Engineering'), (SELECT id FROM CoursePool WHERE name = 'Computer Science Group: Software Engineering'), 23 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Software Engineering'), (SELECT id FROM CoursePool WHERE name = 'Engineering and Natural Science Group: Software Engineering'), 3 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Software Engineering'), (SELECT id FROM CoursePool WHERE name = 'Software Engineering Electives'), 16;

-- Insert into CourseXCoursePool table
-- Engineering Core courses
INSERT INTO CourseXCoursePool (id, coursecode, coursepool)
SELECT NEWID(), code, (SELECT id FROM CoursePool WHERE name = 'Engineering Core')
FROM Course 
WHERE code IN ('ELEC 275', 'ENCS 282', 'ENGR 201', 'ENGR 202', 'ENGR 213', 
               'ENGR 233', 'ENGR 301', 'ENGR 371', 'ENGR 391', 'ENGR 392');

-- Computer Science Group: Software Engineering courses
INSERT INTO CourseXCoursePool (id, coursecode, coursepool)
SELECT NEWID(), code, (SELECT id FROM CoursePool WHERE name = 'Computer Science Group: Software Engineering')
FROM Course 
WHERE code IN ('COMP 232', 'COMP 248', 'COMP 249', 'COMP 335', 
               'COMP 346', 'COMP 348', 'COMP 352');

-- Software Engineering Core courses
INSERT INTO CourseXCoursePool (id, coursecode, coursepool)
SELECT NEWID(), code, (SELECT id FROM CoursePool WHERE name = 'Software Engineering Core')
FROM Course 
WHERE code IN ('SOEN 228', 'SOEN 287', 'SOEN 321', 'SOEN 331', 'SOEN 341',
               'SOEN 342', 'SOEN 343', 'SOEN 345', 'SOEN 357', 'SOEN 363',
               'SOEN 384', 'SOEN 390', 'SOEN 490');

-- Engineering and Natural Science Group: Software Engineering courses
INSERT INTO CourseXCoursePool (id, coursecode, coursepool)
SELECT NEWID(), code, (SELECT id FROM CoursePool WHERE name = 'Engineering and Natural Science Group: Software Engineering')
FROM Course 
WHERE code IN ('ENGR 245', 'MIAE 221');

-- Software Engineering Electives courses
INSERT INTO CourseXCoursePool (id, coursecode, coursepool)
SELECT NEWID(), code, (SELECT id FROM CoursePool WHERE name = 'Software Engineering Electives')
FROM Course 
WHERE code IN ('AERO 480', 'AERO 482', 'COEN 320', 'COMP 333', 'COMP 339',
               'COMP 345', 'COMP 371', 'COMP 376', 'COMP 425', 'COMP 426',
               'COMP 428', 'COMP 432', 'COMP 433', 'COMP 438', 'COMP 442',
               'COMP 444', 'COMP 445', 'COMP 451', 'COMP 465', 'COMP 472',
               'COMP 473', 'COMP 474', 'COMP 475', 'COMP 476', 'COMP 477',
               'COMP 478', 'COMP 479', 'COMP 498', 'COMP 499', 'SOEN 298',
               'SOEN 344', 'SOEN 387', 'SOEN 422', 'SOEN 423', 'SOEN 448',
               'SOEN 471', 'SOEN 487', 'SOEN 491', 'SOEN 498', 'SOEN 499',
               'ENGR 411');

-- User table (changed from AppUser to [User])
INSERT INTO AppUser (email, password, fullname, degree, type)
SELECT 'jd1@concordia.ca', '1234', 'John Doe', (SELECT id FROM Degree WHERE name = 'Software Engineering'), 'student' UNION ALL
SELECT 'jd2@concordia.ca', '5678', 'Jane Doe', NULL, 'advisor';

-- Timeline table
INSERT INTO Timeline (season, year, coursecode, user_id)
SELECT 'winter', 2024, 'COMP 333', (SELECT id FROM AppUser WHERE fullname = 'John Doe') UNION ALL
SELECT 'fall', 2025, 'COMP 333', (SELECT id FROM AppUser WHERE fullname = 'Jane Doe');

-- Deficiency table
INSERT INTO Deficiency (coursepool, user_id, creditsRequired)
SELECT (SELECT id FROM coursepool WHERE name = 'Engineering and Natural Science Group: Software Engineering'), (SELECT id FROM AppUser WHERE fullname = 'John Doe'), 3 UNION ALL
SELECT (SELECT id FROM coursepool WHERE name = 'Computer Engineering Electives'), (SELECT id FROM AppUser WHERE fullname = 'Jane Doe'), 3 ;

-- Exemption table
INSERT INTO Exemption (coursecode, user_id)
SELECT 'COMP 333', (SELECT id FROM AppUser WHERE fullname = 'John Doe');